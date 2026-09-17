import React from 'react';

export type PreviewStatus =
  | 'converting'
  | 'ready'
  | 'initializing'
  | 'initializedMuted'
  | 'playing'
  | 'paused'
  | 'error';

interface PreviewTransportProps {
  status: PreviewStatus;
  volume: number;
  diagnosticsCount: number;
  canInitialize: boolean;
  onInitialize: () => void;
  onPause: () => void;
  onResume: () => void;
  onVolumeChange: (value: number) => void;
  onToggleDiagnostics: () => void;
}

const statusLabels: Record<PreviewStatus, string> = {
  converting: 'Converting patch',
  ready: 'Ready · Silent',
  initializing: 'Initializing · Silent',
  initializedMuted: 'Initialized · Muted',
  playing: 'Playing',
  paused: 'Paused',
  error: 'Preview error',
};

export default function PreviewTransport({
  status,
  volume,
  diagnosticsCount,
  canInitialize,
  onInitialize,
  onPause,
  onResume,
  onVolumeChange,
  onToggleDiagnostics,
}: PreviewTransportProps) {
  const initialized = status === 'initializedMuted' || status === 'playing' || status === 'paused';
  const busy = status === 'converting' || status === 'initializing';

  return (
    <div className="border-t border-gray-700 bg-gray-800 px-5 py-3 flex flex-wrap items-center gap-5 shadow-[0_-8px_30px_rgba(0,0,0,0.2)]">
      {!initialized ? (
        <button
          type="button"
          onClick={onInitialize}
          disabled={!canInitialize || status === 'initializing' || status === 'converting'}
          className="px-4 py-2 rounded bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? 'Please wait…' : status === 'error' ? 'Retry initialization' : 'Initialize audio'}
        </button>
      ) : (
        <button
          type="button"
          onClick={status === 'paused' ? onResume : onPause}
          className="w-10 h-10 rounded-full border border-gray-500 text-white hover:border-violet-400 hover:text-violet-300"
          aria-label={status === 'paused' ? 'Resume Preview' : 'Pause Preview'}
        >
          {status === 'paused' ? '▶' : 'Ⅱ'}
        </button>
      )}

      <div className="min-w-36">
        <div className="flex items-center gap-2 text-sm text-gray-200">
          <span className={`w-2.5 h-2.5 rounded-full ${status === 'error' ? 'bg-red-400' : volume > 0 && status === 'playing' ? 'bg-green-400' : 'bg-yellow-400'}`} />
          {statusLabels[status]}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">Output starts muted.</p>
      </div>

      <label className="flex-1 min-w-56 max-w-xl text-xs text-gray-400">
        <span className="flex justify-between mb-1.5">
          <span>Output (Master)</span>
          <span>{Math.round(volume * 100)}%{volume === 0 ? ' (Muted)' : ''}</span>
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          disabled={!initialized || status === 'paused'}
          onChange={(event) => onVolumeChange(Number(event.target.value))}
          className="w-full accent-violet-500 disabled:opacity-40"
          aria-label="Master output volume"
        />
      </label>

      <button
        type="button"
        onClick={onToggleDiagnostics}
        className="px-3 py-2 rounded border border-gray-600 text-sm text-gray-300 hover:bg-gray-700"
      >
        Diagnostics{diagnosticsCount > 0 ? ` (${diagnosticsCount})` : ''}
      </button>
    </div>
  );
}
