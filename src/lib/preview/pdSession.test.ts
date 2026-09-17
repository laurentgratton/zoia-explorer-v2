import type { BrowserConversionV1, PreviewParameterControl } from 'zoia2pd';
import type { CreatePdOptions, Pd, PdMessageHandler } from 'libpd-wasm';
import { startPreviewSession } from './pdSession';

const parameter: PreviewParameterControl = {
  kind: 'parameter',
  id: 'parameter-0-1',
  label: 'mix',
  support: { status: 'live' },
  module: {
    index: 0,
    typeId: 79,
    typeName: 'Reverb Lite',
    name: 'Verb',
    pageIndex: 0,
    pageName: 'Ambient',
    colorIndex: 12,
  },
  blockIndex: 1,
  parameterIndex: 0,
  blockName: 'mix',
  star: { blockIndex: 1, midiCc: 21 },
  baseValue: 0.5,
  savedRawValue: 32768,
  valueSpec: { min: 0, max: 1, step: 1 / 65535, unit: 'normalized', curve: 'linear' },
  receiver: 'parameter-in',
  baseFeedback: 'parameter-base',
  effectiveFeedback: 'parameter-effective',
};

const conversion: BrowserConversionV1 = {
  apiVersion: 1,
  pdText: '#N canvas 0 0 100 100 10;',
  controls: [parameter],
  warnings: [],
};

describe('Preview Pd session', () => {
  it('starts silent, subscribes before restoring state, and routes Pd through master gain', async () => {
    const harness = createHarness();
    const feedback = jest.fn();

    const session = await startPreviewSession(
      conversion,
      { onFeedback: feedback },
      () => true,
      harness.dependencies,
    );

    expect(harness.events).toEqual([
      'gain=0',
      'gain-connect',
      'context-resume',
      'create-pd',
      'subscribe:parameter-base',
      'subscribe:parameter-effective',
      'send:parameter-in:0.5',
      'pd-connect',
    ]);
    expect(harness.createOptions?.workletUrl).toBe('/libpd-wasm/libpd-worklet.js');

    harness.subscriptions.get('parameter-effective')?.({
      receiver: 'parameter-effective',
      selector: 'float',
      values: [0.75],
    });
    expect(feedback).toHaveBeenCalledWith(parameter.id, 'effective', 0.75);

    session.setVolume(2);
    expect(harness.events.slice(-3)).toEqual(['gain-cancel:0', 'gain-set:0:0', 'gain-ramp:1:0.02']);

    await session.close();
    expect(harness.events.slice(-5)).toEqual([
      'unsubscribe:parameter-base',
      'unsubscribe:parameter-effective',
      'pd-close',
      'gain-disconnect',
      'context-close',
    ]);
  });

  it('cleans up an obsolete initialization before it can connect audio', async () => {
    const harness = createHarness();

    await expect(startPreviewSession(
      conversion,
      {},
      () => false,
      harness.dependencies,
    )).rejects.toThrow('Preview initialization was replaced');

    expect(harness.events).not.toContain('pd-connect');
    expect(harness.events.slice(-3)).toEqual(['pd-close', 'gain-disconnect', 'context-close']);
  });
});

function createHarness() {
  const events: string[] = [];
  const subscriptions = new Map<string, PdMessageHandler>();
  let createOptions: CreatePdOptions | undefined;

  const gainParam = {
    _value: 1,
    get value() {
      return this._value;
    },
    set value(value: number) {
      this._value = value;
      events.push(`gain=${value}`);
    },
    cancelScheduledValues(time: number) {
      events.push(`gain-cancel:${time}`);
    },
    setValueAtTime(value: number, time: number) {
      events.push(`gain-set:${value}:${time}`);
    },
    linearRampToValueAtTime(value: number, time: number) {
      events.push(`gain-ramp:${value}:${time}`);
    },
  };

  class FakeAudioContext {
    state: AudioContextState = 'suspended';
    currentTime = 0;
    destination = {} as AudioDestinationNode;

    createGain() {
      return {
        gain: gainParam,
        connect: () => events.push('gain-connect'),
        disconnect: () => events.push('gain-disconnect'),
      };
    }

    async resume() {
      events.push('context-resume');
      this.state = 'running';
    }

    async suspend() {
      events.push('context-suspend');
      this.state = 'suspended';
    }

    async close() {
      events.push('context-close');
      this.state = 'closed';
    }
  }

  const pd = {
    connect: () => events.push('pd-connect'),
    close: async () => {
      events.push('pd-close');
    },
    sendFloat: (receiver: string, value: number) => events.push(`send:${receiver}:${value}`),
    sendMessage: jest.fn(),
    subscribe: (receiver: string, handler: PdMessageHandler) => {
      events.push(`subscribe:${receiver}`);
      subscriptions.set(receiver, handler);
      return () => events.push(`unsubscribe:${receiver}`);
    },
  } as unknown as Pd;

  return {
    events,
    subscriptions,
    get createOptions() {
      return createOptions;
    },
    dependencies: {
      AudioContext: FakeAudioContext as unknown as new (options?: AudioContextOptions) => AudioContext,
      createPd: async (options: CreatePdOptions) => {
        createOptions = options;
        events.push('create-pd');
        return pd;
      },
    },
  };
}
