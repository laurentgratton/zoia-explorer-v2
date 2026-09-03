import { BlockDefinition, getModuleDefinition, getSamplerSampleFile, MODULE_DEFINITIONS } from './moduleLib';
import { Module } from './types';

const FIRMWARE_OPTION_COUNTS = [
  4, 1, 2, 0, 6, 6, 7, 1, 0, 1, 1, 1, 2, 5, 4, 2, 1, 0, 0, 1,
  8, 3, 1, 5, 1, 0, 1, 1, 2, 3, 8, 1, 1, 2, 2, 1, 1, 1, 0, 2,
  4, 3, 2, 4, 3, 1, 1, 2, 1, 2, 1, 0, 0, 1, 1, 1, 2, 2, 0, 0,
  2, 2, 1, 1, 1, 0, 1, 1, 2, 3, 3, 3, 3, 4, 0, 4, 3, 0, 0, 1,
  0, 1, 4, 5, 4, 2, 1, 3, 4, 4, 4, 4, 0, 1, 1, 0, 0, 2, 2, 3,
  3, 3, 6, 1, 2, 3, 2, 2, 1, 1,
];

function blocks(typeId: number, options: number[]): BlockDefinition[] {
  const definition = getModuleDefinition(typeId);
  if (!definition) throw new Error(`Missing module definition ${typeId}`);
  return definition.calcBlocks({ blocks: definition.blocks, options });
}

function blockNames(typeId: number, options: number[]): string[] {
  return blocks(typeId, options).map(block => block.name);
}

function representativeOptions(typeId: number): number[][] {
  const definition = getModuleDefinition(typeId)!;
  const defaults = definition.options.map(() => 0);
  const candidates = [defaults];

  if (definition.options.length > 0) {
    candidates.push(definition.options.map(option => option.values.length - 1));
  }
  definition.options.forEach((option, optionIndex) => {
    option.values.forEach((_, valueIndex) => {
      const values = [...defaults];
      values[optionIndex] = valueIndex;
      candidates.push(values);
    });
  });

  return candidates;
}

describe('firmware 5.41 module catalog', () => {
  it('defines every firmware module type exactly once', () => {
    expect(Object.keys(MODULE_DEFINITIONS).map(Number)).toEqual(
      Array.from({ length: 110 }, (_, typeId) => typeId)
    );
  });

  it('matches the option count encoded in every firmware descriptor', () => {
    expect(FIRMWARE_OPTION_COUNTS).toHaveLength(110);
    expect(FIRMWARE_OPTION_COUNTS.map((_, typeId) => (
      getModuleDefinition(typeId)!.options.length
    ))).toEqual(FIRMWARE_OPTION_COUNTS);
  });

  it('produces valid blocks and sequential visible parameter indices', () => {
    for (let typeId = 0; typeId < FIRMWARE_OPTION_COUNTS.length; typeId++) {
      const definition = getModuleDefinition(typeId)!;
      for (const options of representativeOptions(typeId)) {
        const activeBlocks = blocks(typeId, options);
        const context = `${typeId} ${definition.name}: ${options}`;
        if (activeBlocks.includes(undefined as unknown as BlockDefinition)) {
          throw new Error(`${context} produced an undefined block`);
        }
        if (activeBlocks.length < definition.minBlocks || activeBlocks.length > definition.maxBlocks) {
          throw new Error(`${context} produced ${activeBlocks.length} blocks; expected ${definition.minBlocks}-${definition.maxBlocks}`);
        }

        const parameterIndices = activeBlocks
          .filter(block => block.hasParameter)
          .map(block => block.parameterIndex);
        const expectedIndices = Array.from({ length: parameterIndices.length }, (_, index) => index);
        if (parameterIndices.some((index, position) => index !== expectedIndices[position])) {
          throw new Error(`${context} produced parameter indices ${parameterIndices}; expected ${expectedIndices}`);
        }
      }
    }
  });
});

describe('dynamic firmware layouts', () => {
  it('supports firmware 4 sequencer pages and block counts', () => {
    expect(blockNames(4, [0, 0, 0, 0, 0, 0])).toEqual([
      'step 1', 'gate in', 'out track 1'
    ]);

    const allBlocks = blockNames(4, [31, 7, 1, 2, 1, 7]);
    expect(allBlocks).toHaveLength(44);
    expect(allBlocks).toContain('queue start');
    expect(allBlocks).toContain('key input note');
    expect(allBlocks).toContain('out track 8');
  });

  it('uses the selected LFO input and optional phase controls', () => {
    expect(blockNames(5, [0, 0, 0, 0, 0, 0])).toEqual(['cv control', 'output']);
    expect(blockNames(5, [0, 1, 0, 1, 1, 1])).toEqual([
      'tap control', 'swing amount', 'phase input', 'phase reset', 'output'
    ]);
    expect(blockNames(5, [0, 0, 0, 2, 0, 0])).toEqual(['cv control', 'output']);
  });

  it('models all optional ADSR stages', () => {
    expect(blockNames(6, [0, 0, 0, 1, 1, 1, 0])).toEqual([
      'gate input', 'attack', 'decay', 'cv output'
    ]);
    expect(blockNames(6, [1, 1, 1, 0, 0, 1, 1])).toEqual([
      'gate input', 'retrigger', 'delay', 'attack', 'hold atk dec', 'decay',
      'sustain level', 'hold sus rel', 'release', 'cv output'
    ]);
  });

  it('switches Clock Divider between legacy modifier and ratio controls', () => {
    const tapBlocks = blocks(49, [0, 0]);
    const cvBlocks = blocks(49, [1, 1]);

    expect(tapBlocks.map(block => block.name)).toEqual([
      'input', 'reset switch', 'modifier', 'output'
    ]);
    expect(cvBlocks.map(block => block.name)).toEqual([
      'input', 'reset switch', 'dividend', 'divisor', 'output'
    ]);
    expect(tapBlocks.filter(block => block.hasParameter)).toHaveLength(3);
    expect(cvBlocks.filter(block => block.hasParameter)).toHaveLength(4);
    expect(getModuleDefinition(49)!.savedParameterCount).toBe(4);
  });

  it('saves every Tap to CV input parameter', () => {
    expect(blocks(85, [0, 0]).filter(block => block.hasParameter)).toHaveLength(1);
    expect(blocks(85, [1, 1]).filter(block => block.hasParameter)).toHaveLength(3);
  });

  it('switches Delay Line between rate and tap controls', () => {
    expect(blockNames(13, [0, 0, 0, 0, 0])).toEqual([
      'audio in', 'delay time', 'audio out'
    ]);
    expect(blockNames(13, [5, 1, 1, 1, 1])).toEqual([
      'audio in', 'modulation in', 'tap tempo in', 'audio out'
    ]);
  });

  it('expands Keyboard and MIDI Notes In outputs from zero-based options', () => {
    expect(blockNames(16, [0])).toEqual(['note #1', 'note out', 'gate out', 'trigger out']);
    expect(blockNames(16, [39])).toHaveLength(43);

    expect(blockNames(20, [0, 0, 0, 0, 0, 0, 0, 0])).toEqual([
      'note out 1', 'gate out 1'
    ]);
    expect(blockNames(20, [0, 7, 4, 0, 1, 0, 0, 1])).toHaveLength(32);
  });

  it('selects one rate, tap, or direct control for modulation effects', () => {
    for (const typeId of [29, 41, 69, 70, 71, 107]) {
      expect(blockNames(typeId, [0, 0])).toContain('rate');
      expect(blockNames(typeId, [0, 1])).toContain('tap tempo in');
      expect(blockNames(typeId, [0, 2])).toContain('direct');
    }
    for (const typeId of [43, 75]) {
      expect(blockNames(typeId, [0, 0])).toContain('delay time');
      expect(blockNames(typeId, [0, 1])).toContain('tap tempo in');
    }
  });

  it('expands switch channel counts through 16', () => {
    expect(blocks(31, [0])).toHaveLength(3);
    expect(blocks(31, [15])).toHaveLength(18);
    expect(blocks(32, [15])).toHaveLength(18);
    expect(blocks(33, [15, 1])).toHaveLength(18);
    expect(blocks(34, [15, 1])).toHaveLength(18);
  });

  it('models MIDI clock input and output options', () => {
    expect(blockNames(82, [0, 0, 0, 0])).toEqual(['quarter out']);
    expect(blockNames(82, [1, 1, 1, 10])).toEqual([
      'quarter out', 'clock out', 'reset out', 'run out'
    ]);

    expect(blockNames(84, [0, 1, 1, 0])).toEqual(['tap/cv control']);
    expect(blockNames(84, [1, 0, 0, 1])).toEqual([
      'tap/cv control', 'sent', 'reset', 'send position', 'song position'
    ]);
  });

  it('includes firmware 5.30 granular grain sizes', () => {
    const granular = getModuleDefinition(83)!;
    expect(granular.options.map(option => option.name)).toEqual([
      'num grains', 'channels', 'pos control', 'size control', 'max grain size'
    ]);
    expect(granular.options[0].values).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(granular.options[4].values).toEqual(['1s', '4s', '16s']);
  });

  it('uses firmware option labels and their encoded order', () => {
    expect(getModuleDefinition(1)!.options[0].values).toEqual(['stereo', 'left', 'right']);
    expect(getModuleDefinition(2)!.options.map(option => option.values)).toEqual([
      ['off', 'on'], ['stereo', 'left', 'right']
    ]);
    expect(getModuleDefinition(14)!.options.map(option => option.values)).toEqual([
      ['sine', 'square', 'triangle', 'sawtooth'],
      ['off', 'on'],
      ['off', 'on'],
      ['none', '2X']
    ]);
    expect(getModuleDefinition(24)!.options[0].values).toEqual([
      'low-pass', 'hi shelf', 'bell', 'high-pass', 'low shelf', 'band-pass'
    ]);
    expect(getModuleDefinition(39)!.options[1].values).toEqual(['off', 'on']);
    expect(getModuleDefinition(45)!.options[0].name).toBe('output');
    expect(getModuleDefinition(55)!.options[0].name).toBe('input range');
    expect(getModuleDefinition(56)!.options[1].values).toEqual(['basic', 'extended']);
    expect(getModuleDefinition(63)!.options[0].values).toEqual(['xor', 'and', 'or']);
    expect(getModuleDefinition(64)!.options[0]).toEqual({
      name: 'output', values: ['mono', 'stereo']
    });
    expect(getModuleDefinition(66)!.options[0].name).toBe('model');
    expect(getModuleDefinition(68)!.options).toEqual([
      {name: 'channels', values: ['1in->1out', '2in->2out', '1in->2out']},
      {name: 'type', values: [
        '4x12 full', '2x12 dark', '2x12 modern', '1x12', '1x8 lofi',
        '1x12 vint', '4x12 hifi'
      ]}
    ]);
    expect(getModuleDefinition(103)!.options[0].values).toEqual([
      'bypass', 'stomp aux', 'perform'
    ]);
  });

  it('maps channel and conditional options to firmware block layouts', () => {
    expect(blockNames(1, [0])).toEqual(['pedal input L', 'pedal input R']);
    expect(blockNames(1, [1])).toEqual(['pedal input L']);
    expect(blockNames(1, [2])).toEqual(['pedal input R']);

    expect(blockNames(2, [0, 0])).toEqual(['pedal output L', 'pedal output R']);
    expect(blockNames(2, [1, 1])).toEqual(['pedal output L', 'gain']);
    expect(blockNames(2, [0, 2])).toEqual(['pedal output R']);

    expect(blockNames(14, [0, 0, 0, 0])).toEqual(['frequency', 'audio out']);
    expect(blockNames(14, [3, 1, 1, 1])).toEqual([
      'frequency', 'FM input', 'duty cycle', 'audio out'
    ]);

    for (const shape of [0, 3, 5]) {
      expect(blockNames(24, [shape])).not.toContain('gain');
    }
    for (const shape of [1, 2, 4]) {
      expect(blockNames(24, [shape])).toContain('gain');
    }
    expect(blockNames(39, [0, 0])).toEqual(['CV output']);
    expect(blockNames(39, [0, 1])).toEqual(['trigger in', 'CV output']);

    expect(blocks(81, [0])).toEqual([
      expect.objectContaining({name: 'cv in', direction: 0, type: 1, hasParameter: true})
    ]);
    expect(blocks(81, [1])).toEqual([
      expect.objectContaining({name: 'audio in', direction: 0, type: 0})
    ]);
    expect(blocks(81, [1])[0].hasParameter).toBeUndefined();

    expect(blockNames(64, [0])).toEqual(['audio in1', 'audio in2', 'mix', 'audio out1']);
    expect(blockNames(64, [1])).toEqual([
      'audio in1 L', 'audio in1 R', 'audio in2 L', 'audio in2 R',
      'mix', 'audio outL', 'audio outR'
    ]);
    expect(blockNames(68, [0, 0])).toEqual(['audio in1', 'audio out1']);
    expect(blockNames(68, [1, 0])).toEqual([
      'audio in1', 'audio in2', 'audio out1', 'audio out2'
    ]);
    expect(blockNames(68, [2, 0])).toEqual(['audio in1', 'audio out1', 'audio out2']);
  });

  it('models firmware 4 sampler options and conditional blocks', () => {
    const sampler = getModuleDefinition(102)!;
    expect(sampler.options.map(option => option.name)).toEqual([
      'file', 'channels', 'record', 'playback', 'reverse button', 'cv outputs'
    ]);
    expect(blockNames(102, [0, 0, 0, 0, 0, 0])).toEqual([
      'sample playback', 'speed/pitch', 'start', 'length', 'audio out L'
    ]);
    expect(blockNames(102, [0, 1, 2, 1, 1, 1])).toEqual([
      'audio in L', 'audio in R', 'record', 'sample playback', 'speed/pitch',
      'direction', 'start', 'length', 'position CV out', 'loop end CV out',
      'audio out L', 'audio out R'
    ]);
  });

  it('reads the sampler filename from module-owned save data', () => {
    const sampler = {
      typeId: 102,
      savedData: [...Array.from('KICK.WAV', char => char.charCodeAt(0)), 0, 65, 66],
      savedDataSize: 11,
    } as Module;

    expect(getSamplerSampleFile(sampler)).toBe('KICK.WAV');
    expect(getSamplerSampleFile({...sampler, savedData: [0, 65]})).toBeUndefined();
    expect(getSamplerSampleFile({...sampler, typeId: 1})).toBeUndefined();
  });

  it('expands CV Mixer and Logic Gate to firmware limits', () => {
    expect(blocks(104, [0, 0])).toHaveLength(3);
    expect(blocks(104, [7, 1])).toHaveLength(17);
    expect(blockNames(105, [6, 36, 0])).toEqual(['in 1', 'CV Out']);
    expect(blocks(105, [0, 36, 1])).toHaveLength(40);
  });

  it('shows only the selected Reverse Delay controls', () => {
    expect(blockNames(106, [0, 0])).toEqual([
      'audio in L', 'delay time', 'feedback', 'pitch', 'mix', 'audio out L'
    ]);
    expect(blockNames(106, [1, 1])).toEqual([
      'audio in L', 'audio in R', 'tap tempo in', 'tap ratio', 'feedback',
      'pitch', 'mix', 'audio out L', 'audio out R'
    ]);
  });

  it.each([
    [108, 'MIDI Pitch Bend Out', 'pitch bend'],
    [109, 'MIDI Pressure Out', 'pressure out'],
  ])('defines firmware 5.40 module type %i', (typeId, name, blockName) => {
    const definition = getModuleDefinition(typeId)!;
    expect(definition.name).toBe(name);
    expect(definition.options[0].values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    expect(definition.blocks).toEqual([
      expect.objectContaining({ name: blockName, direction: 0, hasParameter: true })
    ]);
  });
});
