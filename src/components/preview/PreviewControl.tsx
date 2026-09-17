import React from 'react';
import type {
  PreviewButtonControl,
  PreviewConnectionControl,
  PreviewControl as PreviewControlManifest,
  PreviewKeyboardControl,
  PreviewParameterControl,
  PreviewStar,
  PreviewUiButtonControl,
} from 'zoia2pd';
import type { PreviewFeedbackChannel } from '@/lib/preview/pdSession';

interface PreviewControlProps {
  control: PreviewControlManifest;
  disabled: boolean;
  feedback: Record<string, number>;
  onSendFloat: (receiver: string, value: number) => void;
  onSendMessage: (receiver: string, selector: string, values: number[]) => void;
}

export default function PreviewControl({
  control,
  disabled,
  feedback,
  onSendFloat,
  onSendMessage,
}: PreviewControlProps) {
  switch (control.kind) {
    case 'parameter':
      return <ParameterControl control={control} disabled={disabled} feedback={feedback} onSend={onSendFloat} />;
    case 'connection':
      return <ConnectionControl control={control} disabled={disabled} feedback={feedback} onSend={onSendFloat} />;
    case 'ui-button':
      return <UiButtonControl control={control} disabled={disabled} feedback={feedback} onSend={onSendFloat} />;
    case 'pushbutton':
    case 'stompswitch':
    case 'euro-pushbutton':
      return <ButtonControl control={control} disabled={disabled} feedback={feedback} onSend={onSendFloat} />;
    case 'keyboard':
      return <KeyboardControl control={control} disabled={disabled} onSend={onSendMessage} />;
  }
}

function ParameterControl({
  control,
  disabled,
  feedback,
  onSend,
}: {
  control: PreviewParameterControl;
  disabled: boolean;
  feedback: Record<string, number>;
  onSend: (receiver: string, value: number) => void;
}) {
  const feedbackValue = getFeedback(feedback, control.id, 'base');
  const effectiveValue = getFeedback(feedback, control.id, 'effective');
  const [value, setValue] = React.useState(feedbackValue ?? control.baseValue);

  React.useEffect(() => {
    if (feedbackValue !== undefined) setValue(feedbackValue);
  }, [feedbackValue]);

  return (
    <ControlRow
      label={control.blockName || control.label}
      star={control.star}
      support={control.support.status === 'approximate' ? control.support.reason : undefined}
      valueLabel={`${Math.round(value * 100)}%`}
    >
      <input
        type="range"
        min={control.valueSpec.min}
        max={control.valueSpec.max}
        step={control.valueSpec.step}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const next = Number(event.target.value);
          setValue(next);
          onSend(control.receiver, next);
        }}
        className="w-full accent-violet-500 disabled:opacity-40"
        aria-label={`${control.module.name || control.module.typeName}: ${control.blockName}`}
      />
      {effectiveValue !== undefined && Math.abs(effectiveValue - value) > control.valueSpec.step && (
        <span className="text-[10px] text-gray-500">Effective {Math.round(effectiveValue * 100)}%</span>
      )}
    </ControlRow>
  );
}

function ConnectionControl({
  control,
  disabled,
  feedback,
  onSend,
}: {
  control: PreviewConnectionControl;
  disabled: boolean;
  feedback: Record<string, number>;
  onSend: (receiver: string, value: number) => void;
}) {
  const feedbackValue = getFeedback(feedback, control.id, 'strength');
  const [value, setValue] = React.useState(feedbackValue ?? control.initialStrength.raw);
  const decibels = (value - 10000) / 100;

  React.useEffect(() => {
    if (feedbackValue !== undefined) setValue(feedbackValue);
  }, [feedbackValue]);

  return (
    <ControlRow
      label={`${control.source.blockName} → ${control.destination.blockName}`}
      star={control.star}
      valueLabel={`${decibels > 0 ? '+' : ''}${decibels.toFixed(1)} dB`}
    >
      <input
        type="range"
        min={control.valueSpec.min}
        max={control.valueSpec.max}
        step={control.valueSpec.step}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const next = Number(event.target.value);
          setValue(next);
          onSend(control.receiver, next);
        }}
        className="w-full accent-violet-500 disabled:opacity-40"
        aria-label={`Connection strength: ${control.source.blockName} to ${control.destination.blockName}`}
      />
    </ControlRow>
  );
}

function UiButtonControl({
  control,
  disabled,
  feedback,
  onSend,
}: {
  control: PreviewUiButtonControl;
  disabled: boolean;
  feedback: Record<string, number>;
  onSend: (receiver: string, value: number) => void;
}) {
  const feedbackValue = getFeedback(feedback, control.id, 'base');
  const [value, setValue] = React.useState(feedbackValue ?? control.baseValue);

  React.useEffect(() => {
    if (feedbackValue !== undefined) setValue(feedbackValue);
  }, [feedbackValue]);

  return (
    <ControlRow
      label={control.label}
      star={control.star}
      support={control.support.status === 'approximate' ? control.support.reason : undefined}
      valueLabel={`${Math.round(value * 100)}%`}
    >
      <input
        type="range"
        min="0"
        max="1"
        step={1 / 65535}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const next = Number(event.target.value);
          setValue(next);
          onSend(control.receiver, next);
        }}
        className="w-full accent-violet-500 disabled:opacity-40"
        aria-label={`${control.module.name || control.module.typeName}: ${control.label}`}
      />
    </ControlRow>
  );
}

function ButtonControl({
  control,
  disabled,
  feedback,
  onSend,
}: {
  control: PreviewButtonControl;
  disabled: boolean;
  feedback: Record<string, number>;
  onSend: (receiver: string, value: number) => void;
}) {
  const held = React.useRef(false);
  const state = getFeedback(feedback, control.id, 'state') ?? control.normal;

  const press = React.useCallback(() => {
    if (disabled || held.current) return;
    held.current = true;
    onSend(control.receiver, 1);
  }, [control.receiver, disabled, onSend]);

  const release = React.useCallback(() => {
    if (!held.current) return;
    held.current = false;
    onSend(control.receiver, 0);
  }, [control.receiver, onSend]);

  React.useEffect(() => release, [release]);
  React.useEffect(() => {
    if (disabled) release();
  }, [disabled, release]);

  const detail = control.kind === 'stompswitch'
    ? `Stompswitch · ${control.assignment || 'unassigned'}`
    : control.kind === 'euro-pushbutton'
      ? `Euro Pushbutton ${control.button}`
      : 'Pushbutton';

  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <p className="text-sm text-gray-100">{control.label}</p>
          <p className="text-xs text-gray-500">{detail} · {control.action}</p>
        </div>
        <StarBadges stars={control.stars} />
      </div>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={state >= 0.5}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          press();
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onBlur={release}
        onKeyDown={(event) => {
          if (!event.repeat && (event.key === ' ' || event.key === 'Enter')) {
            event.preventDefault();
            press();
          }
        }}
        onKeyUp={(event) => {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            release();
          }
        }}
        className={`w-full min-h-14 rounded border text-sm font-medium transition-colors disabled:opacity-40 ${
          state >= 0.5
            ? 'border-violet-400 bg-violet-600/30 text-white'
            : 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700'
        }`}
      >
        {control.action === 'momentary' ? 'Hold' : state >= 0.5 ? 'On' : 'Off'}
      </button>
    </div>
  );
}

function KeyboardControl({
  control,
  disabled,
  onSend,
}: {
  control: PreviewKeyboardControl;
  disabled: boolean;
  onSend: (receiver: string, selector: string, values: number[]) => void;
}) {
  const held = React.useRef(new Set<number>());
  const [heldKeys, setHeldKeys] = React.useState<Set<number>>(() => new Set());

  const release = React.useCallback((keyIndex: number) => {
    if (!held.current.has(keyIndex)) return;
    held.current.delete(keyIndex);
    setHeldKeys(new Set(held.current));
    onSend(control.receiver, 'note', [keyIndex, 0]);
  }, [control.receiver, onSend]);

  const press = React.useCallback((keyIndex: number) => {
    if (disabled || held.current.has(keyIndex)) return;
    held.current.add(keyIndex);
    setHeldKeys(new Set(held.current));
    onSend(control.receiver, 'note', [keyIndex, 1]);
  }, [control.receiver, disabled, onSend]);

  React.useEffect(() => () => {
    for (const keyIndex of held.current) onSend(control.receiver, 'note', [keyIndex, 0]);
    held.current.clear();
  }, [control.receiver, onSend]);

  React.useEffect(() => {
    if (!disabled) return;
    for (const keyIndex of [...held.current]) release(keyIndex);
  }, [disabled, release]);

  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm text-gray-100">{control.label}</p>
          <p className="text-xs text-gray-500">Keyboard · {control.count} configured note{control.count === 1 ? '' : 's'}</p>
        </div>
        {control.support.status === 'approximate' && <ApproximateBadge reason={control.support.reason} />}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(72px,1fr))] gap-2">
        {control.keys.map((key) => (
          <button
            key={key.index}
            type="button"
            disabled={disabled}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              press(key.index);
            }}
            onPointerUp={() => release(key.index)}
            onPointerCancel={() => release(key.index)}
            onLostPointerCapture={() => release(key.index)}
            onBlur={() => release(key.index)}
            onKeyDown={(event) => {
              if (!event.repeat && (event.key === ' ' || event.key === 'Enter')) {
                event.preventDefault();
                press(key.index);
              }
            }}
            onKeyUp={(event) => {
              if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                release(key.index);
              }
            }}
            className={`relative min-h-16 rounded border text-sm font-semibold transition-colors disabled:opacity-40 ${
              heldKeys.has(key.index)
                ? 'border-violet-400 bg-violet-600/30 text-white'
                : 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700'
            }`}
          >
            {key.noteName || key.label}
            {key.star && <span className="absolute top-1 right-1 text-yellow-400 text-xs">★</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function ControlRow({
  label,
  star,
  support,
  valueLabel,
  children,
}: {
  label: string;
  star?: PreviewStar;
  support?: string;
  valueLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-3 border-b border-gray-700/70 last:border-0">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-gray-100 truncate">{label}</span>
          {star && <StarBadge star={star} />}
          {support && <ApproximateBadge reason={support} />}
        </div>
        <span className="text-xs text-gray-300 tabular-nums whitespace-nowrap">{valueLabel}</span>
      </div>
      {children}
    </div>
  );
}

function StarBadges({ stars }: { stars: PreviewStar[] }) {
  if (stars.length === 0) return null;
  return <div className="flex gap-1">{stars.map((star, index) => <StarBadge key={`${star.blockIndex ?? 'module'}-${index}`} star={star} />)}</div>;
}

function StarBadge({ star }: { star: PreviewStar }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-yellow-300 border border-yellow-700/60 bg-yellow-950/30 rounded px-1.5 py-0.5 whitespace-nowrap">
      ★{star.midiCc !== null ? ` CC ${star.midiCc}` : ''}
    </span>
  );
}

function ApproximateBadge({ reason }: { reason: string }) {
  return (
    <span title={reason} className="text-[10px] text-amber-300 border border-amber-800 rounded px-1.5 py-0.5 whitespace-nowrap">
      Approximate
    </span>
  );
}

function getFeedback(
  feedback: Record<string, number>,
  controlId: string,
  channel: PreviewFeedbackChannel,
): number | undefined {
  return feedback[`${controlId}:${channel}`];
}
