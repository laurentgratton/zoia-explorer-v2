import type { BrowserConversionV1, PreviewControl } from 'zoia2pd';
import type { CreatePdOptions, Pd, PdMessage } from 'libpd-wasm';

type PdFactory = (options: CreatePdOptions) => Promise<Pd>;
type AudioContextConstructor = new (options?: AudioContextOptions) => AudioContext;

export type PreviewFeedbackChannel =
  | 'base'
  | 'effective'
  | 'state'
  | 'note'
  | 'gate'
  | 'trigger'
  | 'strength'
  | 'gain';

export interface PreviewSessionCallbacks {
  onFeedback?: (controlId: string, channel: PreviewFeedbackChannel, value: number) => void;
  onPrint?: (message: string) => void;
  onError?: (error: Error) => void;
}

interface PreviewSessionDependencies {
  AudioContext?: AudioContextConstructor;
  createPd?: PdFactory;
}

export interface PreviewSession {
  setVolume(value: number): void;
  sendFloat(receiver: string, value: number): void;
  sendMessage(receiver: string, selector: string, values: number[]): void;
  pause(): Promise<void>;
  resume(): Promise<void>;
  close(): Promise<void>;
}

export async function startPreviewSession(
  conversion: BrowserConversionV1,
  callbacks: PreviewSessionCallbacks = {},
  isCurrent: () => boolean = () => true,
  dependencies: PreviewSessionDependencies = {},
): Promise<PreviewSession> {
  const AudioContextClass = dependencies.AudioContext ?? window.AudioContext;
  const audioContext = new AudioContextClass();
  const masterGain = audioContext.createGain();
  let pd: Pd | undefined;
  let closed = false;
  const unsubscribers: Array<() => void> = [];

  masterGain.gain.value = 0;
  masterGain.connect(audioContext.destination);

  const close = async () => {
    if (closed) return;
    closed = true;
    for (const unsubscribe of unsubscribers.splice(0)) unsubscribe();
    try {
      await pd?.close();
    } finally {
      masterGain.disconnect();
      if (audioContext.state !== 'closed') await audioContext.close();
    }
  };

  try {
    await audioContext.resume();
    const createPd = dependencies.createPd ?? (await import('libpd-wasm')).createPd;
    pd = await createPd({
      audioContext,
      workletUrl: '/libpd-wasm/libpd-worklet.js',
      packages: ['vanilla'],
      files: { 'main.pd': conversion.pdText },
      entry: 'main.pd',
      onPrint: callbacks.onPrint,
      onError: callbacks.onError,
    });

    if (!isCurrent()) throw new Error('Preview initialization was replaced');

    subscribeToFeedback(pd, conversion.controls, callbacks, unsubscribers);
    resendInitialValues(pd, conversion.controls);
    pd.connect(masterGain);

    return {
      setVolume(value) {
        const next = Math.min(1, Math.max(0, value));
        const now = audioContext.currentTime;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.linearRampToValueAtTime(next, now + 0.02);
      },
      sendFloat(receiver, value) {
        pd?.sendFloat(receiver, value);
      },
      sendMessage(receiver, selector, values) {
        pd?.sendMessage(receiver, selector, values);
      },
      async pause() {
        if (audioContext.state === 'running') await audioContext.suspend();
      },
      async resume() {
        if (audioContext.state === 'suspended') await audioContext.resume();
      },
      close,
    };
  } catch (error) {
    await close();
    throw error;
  }
}

function subscribeToFeedback(
  pd: Pd,
  controls: PreviewControl[],
  callbacks: PreviewSessionCallbacks,
  unsubscribers: Array<() => void>,
) {
  const subscribe = (controlId: string, channel: PreviewFeedbackChannel, receiver: string) => {
    unsubscribers.push(pd.subscribe(receiver, (message: PdMessage) => {
      const value = message.values[0];
      if (typeof value === 'number') callbacks.onFeedback?.(controlId, channel, value);
    }));
  };

  for (const control of controls) {
    switch (control.kind) {
      case 'parameter':
      case 'ui-button':
        subscribe(control.id, 'base', control.baseFeedback);
        subscribe(control.id, 'effective', control.effectiveFeedback);
        break;
      case 'pushbutton':
      case 'stompswitch':
      case 'euro-pushbutton':
        subscribe(control.id, 'state', control.stateFeedback);
        break;
      case 'keyboard':
        subscribe(control.id, 'note', control.noteFeedback);
        subscribe(control.id, 'gate', control.gateFeedback);
        subscribe(control.id, 'trigger', control.triggerFeedback);
        break;
      case 'connection':
        subscribe(control.id, 'strength', control.strengthFeedback);
        subscribe(control.id, 'gain', control.gainFeedback);
        break;
    }
  }
}

function resendInitialValues(pd: Pd, controls: PreviewControl[]) {
  for (const control of controls) {
    switch (control.kind) {
      case 'parameter':
      case 'ui-button':
        pd.sendFloat(control.receiver, control.baseValue);
        break;
      case 'connection':
        pd.sendFloat(control.receiver, control.initialStrength.raw);
        break;
    }
  }
}
