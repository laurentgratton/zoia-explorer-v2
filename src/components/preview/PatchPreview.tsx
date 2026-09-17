"use client";

import React from 'react';
import type { BrowserConversionV1, PreviewWarning } from 'zoia2pd';
import { serializePatch } from '@/lib/zoia/serializer';
import { usePatchStore } from '@/store/patchStore';
import {
  getModuleColor,
  getPreviewPageName,
  groupPreviewControls,
  isMappedControl,
} from '@/lib/preview/previewModel';
import {
  startPreviewSession,
  type PreviewFeedbackChannel,
  type PreviewSession,
} from '@/lib/preview/pdSession';
import PreviewControl from './PreviewControl';
import PreviewPageSelector from './PreviewPageSelector';
import PreviewTransport, { type PreviewStatus } from './PreviewTransport';

interface DiagnosticEntry {
  id: number;
  source: 'conversion' | 'pd' | 'runtime';
  message: string;
}

export default function PatchPreview() {
  const patch = usePatchStore((state) => state.patch);
  const activePage = usePatchStore((state) => state.activePage);
  const [conversion, setConversion] = React.useState<BrowserConversionV1 | null>(null);
  const [status, setStatus] = React.useState<PreviewStatus>('converting');
  const [feedback, setFeedback] = React.useState<Record<string, number>>({});
  const [volume, setVolume] = React.useState(0);
  const [diagnostics, setDiagnostics] = React.useState<DiagnosticEntry[]>([]);
  const [showDiagnostics, setShowDiagnostics] = React.useState(false);
  const sessionRef = React.useRef<PreviewSession | null>(null);
  const generationRef = React.useRef(0);
  const diagnosticIdRef = React.useRef(0);

  const addDiagnostic = React.useCallback((source: DiagnosticEntry['source'], message: string) => {
    setDiagnostics((current) => [
      ...current.slice(-199),
      { id: diagnosticIdRef.current++, source, message },
    ]);
  }, []);

  React.useEffect(() => {
    if (!patch) return;
    const generation = ++generationRef.current;
    setConversion(null);
    setStatus('converting');
    setFeedback({});
    setVolume(0);
    setDiagnostics([]);

    void sessionRef.current?.close().catch((error) => {
      console.error('Failed to close the previous Preview session', error);
    });
    sessionRef.current = null;

    const convert = async () => {
      try {
        const bytes = serializePatch(patch);
        const { convertBinaryForBrowser } = await import('zoia2pd');
        const nextConversion = convertBinaryForBrowser(bytes);
        if (generationRef.current !== generation) return;
        setConversion(nextConversion);
        setDiagnostics(nextConversion.warnings.map((warning) => ({
          id: diagnosticIdRef.current++,
          source: 'conversion' as const,
          message: formatWarning(warning),
        })));
        setStatus('ready');
      } catch (error) {
        if (generationRef.current !== generation) return;
        addDiagnostic('conversion', errorMessage(error));
        setStatus('error');
        setShowDiagnostics(true);
      }
    };

    void convert();
  }, [addDiagnostic, patch]);

  React.useEffect(() => () => {
    generationRef.current += 1;
    void sessionRef.current?.close().catch((error) => {
      console.error('Failed to close Preview audio', error);
    });
    sessionRef.current = null;
  }, []);

  const initialize = React.useCallback(async () => {
    if (!conversion || status === 'initializing') return;
    const generation = ++generationRef.current;
    setStatus('initializing');
    setVolume(0);
    setFeedback({});

    try {
      await sessionRef.current?.close();
      sessionRef.current = await startPreviewSession(
        conversion,
        {
          onFeedback(controlId, channel, value) {
            setFeedback((current) => ({ ...current, [feedbackKey(controlId, channel)]: value }));
          },
          onPrint(message) {
            addDiagnostic('pd', message);
          },
          onError(error) {
            addDiagnostic('runtime', error.message);
          },
        },
        () => generationRef.current === generation,
      );
      if (generationRef.current === generation) setStatus('initializedMuted');
    } catch (error) {
      if (generationRef.current !== generation) return;
      addDiagnostic('runtime', errorMessage(error));
      setStatus('error');
      setShowDiagnostics(true);
    }
  }, [addDiagnostic, conversion, status]);

  const sendFloat = React.useCallback((receiver: string, value: number) => {
    sessionRef.current?.sendFloat(receiver, value);
  }, []);

  const sendMessage = React.useCallback((receiver: string, selector: string, values: number[]) => {
    sessionRef.current?.sendMessage(receiver, selector, values);
  }, []);

  if (!patch) return null;

  const groups = conversion ? groupPreviewControls(conversion.controls, activePage, patch) : [];
  const pageControls = groups.flatMap((group) => group.controls);
  const mappedCount = pageControls.filter(isMappedControl).length;
  const interfaceCount = pageControls.filter((control) => control.kind !== 'parameter' && control.kind !== 'connection').length;
  const controlsDisabled = status !== 'initializedMuted' && status !== 'playing';

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-300">
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-white">Patch controls</h1>
            <p className="text-sm text-gray-400 mt-1">MIDI-mapped controls and interactive modules, organized by patch page.</p>
          </div>

          <PreviewPageSelector patch={patch} />

          <div className="flex flex-wrap items-end justify-between gap-3 mt-5 mb-3">
            <div>
              <h2 className="text-xl font-semibold text-white">{getPreviewPageName(patch, activePage)}</h2>
              <p className="text-xs text-gray-500 mt-1">
                Page {activePage + 1} · {mappedCount} mapped · {interfaceCount} interface
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span><span className="text-yellow-400">★</span> MIDI mapped</span>
              <span><span className="inline-block w-2.5 h-2.5 border border-gray-400 rounded-sm mr-1" /> Interactive module</span>
            </div>
          </div>

          {status === 'converting' ? (
            <EmptyPanel title="Converting patch…" detail="Preparing Pure Data and browser controls." />
          ) : status === 'error' && !conversion ? (
            <EmptyPanel title="Preview conversion failed" detail="Open Diagnostics for the conversion error." tone="error" />
          ) : groups.length === 0 ? (
            <EmptyPanel title="No Preview controls on this page" detail="This page has no starred controls or interactive interface modules." />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {groups.map((group) => (
                <section key={group.key} className="border border-gray-700 rounded-lg bg-gray-800/50 p-4">
                  <header className="flex items-center gap-3 pb-3 border-b border-gray-700">
                    <span
                      className="w-4 h-4 rounded-sm shadow-sm"
                      style={{ backgroundColor: getModuleColor(group.colorIndex) }}
                    />
                    <h3 className="font-semibold text-white">{group.moduleName}</h3>
                  </header>
                  {group.controls.map((control) => (
                    <PreviewControl
                      key={control.id}
                      control={control}
                      disabled={controlsDisabled}
                      feedback={feedback}
                      onSendFloat={sendFloat}
                      onSendMessage={sendMessage}
                    />
                  ))}
                </section>
              ))}
            </div>
          )}

          {conversion && conversion.warnings.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDiagnostics(true)}
              className="w-full mt-4 text-left px-4 py-3 rounded border border-amber-900/70 bg-amber-950/20 text-sm text-amber-200 hover:bg-amber-950/30"
            >
              ⚠ {conversion.warnings.length} compatibility warning{conversion.warnings.length === 1 ? '' : 's'} — view Diagnostics
            </button>
          )}

          {showDiagnostics && (
            <section className="mt-4 rounded border border-gray-700 bg-gray-950/70">
              <header className="flex justify-between items-center px-4 py-3 border-b border-gray-700">
                <h3 className="text-sm font-semibold text-white">Diagnostics</h3>
                <button type="button" onClick={() => setShowDiagnostics(false)} className="text-gray-400 hover:text-white">Close</button>
              </header>
              <div className="max-h-56 overflow-y-auto p-4 font-mono text-xs space-y-2">
                {diagnostics.length === 0 ? (
                  <p className="text-gray-500">No diagnostics.</p>
                ) : diagnostics.map((entry) => (
                  <p key={entry.id} className={entry.source === 'runtime' ? 'text-red-300' : entry.source === 'conversion' ? 'text-amber-300' : 'text-gray-400'}>
                    [{entry.source}] {entry.message}
                  </p>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <PreviewTransport
        status={status}
        volume={volume}
        diagnosticsCount={diagnostics.length}
        canInitialize={Boolean(conversion)}
        onInitialize={() => void initialize()}
        onPause={() => {
          void sessionRef.current?.pause().then(() => setStatus('paused')).catch((error) => addDiagnostic('runtime', errorMessage(error)));
        }}
        onResume={() => {
          void sessionRef.current?.resume().then(() => setStatus(volume > 0 ? 'playing' : 'initializedMuted')).catch((error) => addDiagnostic('runtime', errorMessage(error)));
        }}
        onVolumeChange={(nextVolume) => {
          setVolume(nextVolume);
          sessionRef.current?.setVolume(nextVolume);
          setStatus(nextVolume > 0 ? 'playing' : 'initializedMuted');
        }}
        onToggleDiagnostics={() => setShowDiagnostics((visible) => !visible)}
      />
    </div>
  );
}

function EmptyPanel({ title, detail, tone = 'default' }: { title: string; detail: string; tone?: 'default' | 'error' }) {
  return (
    <div className={`rounded-lg border p-10 text-center ${tone === 'error' ? 'border-red-900 bg-red-950/20' : 'border-gray-700 bg-gray-800/40'}`}>
      <p className={tone === 'error' ? 'text-red-300' : 'text-gray-200'}>{title}</p>
      <p className="text-sm text-gray-500 mt-1">{detail}</p>
    </div>
  );
}

function feedbackKey(controlId: string, channel: PreviewFeedbackChannel) {
  return `${controlId}:${channel}`;
}

function formatWarning(warning: PreviewWarning) {
  const reference = warning.moduleIndex !== undefined
    ? ` (module ${warning.moduleIndex}${warning.blockIndex !== undefined ? `, block ${warning.blockIndex}` : ''})`
    : warning.connectionIndex !== undefined
      ? ` (connection ${warning.connectionIndex})`
      : '';
  return `${warning.code}: ${warning.message}${reference}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
