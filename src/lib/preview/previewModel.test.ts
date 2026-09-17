import type { PreviewControl } from 'zoia2pd';
import type { Patch } from '@/lib/zoia/types';
import {
  getControlPage,
  getPreviewPageCount,
  getPreviewPageName,
  groupPreviewControls,
  isMappedControl,
} from './previewModel';

const patch: Patch = {
  name: 'Preview Test',
  pageNames: ['Ambient', 'Performance'],
  modules: [
    { id: '0', index: 0, typeId: 79, name: 'Verb', page: 0, gridPosition: 0, color: 12, options: [], parameters: [], version: 1 },
    { id: '1', index: 1, typeId: 15, name: 'Freeze', page: 1, gridPosition: 1, color: 5, options: [0, 0], parameters: [], version: 1 },
  ],
  connections: [],
};

const parameter = {
  kind: 'parameter',
  id: 'parameter-0-1',
  label: 'mix',
  support: { status: 'approximate', reason: 'test' },
  module: { index: 0, typeId: 79, typeName: 'Reverb Lite', name: 'Verb', pageIndex: 0, pageName: 'Ambient', colorIndex: 12 },
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
} satisfies PreviewControl;

const connection = {
  kind: 'connection',
  id: 'connection-0',
  label: 'mix to switch',
  support: { status: 'live' },
  connectionIndex: 0,
  star: { midiCc: null },
  source: { moduleIndex: 0, blockIndex: 1, blockName: 'mix', pageIndex: 0 },
  destination: { moduleIndex: 1, blockIndex: 0, blockName: 'switch', pageIndex: 1 },
  signalType: 'cv',
  initialStrength: { raw: 10000, decibels: 0, linearGain: 1 },
  valueSpec: { min: 0, max: 11200, step: 1, unit: 'raw-connection-strength', curve: 'decibel-amplitude' },
  receiver: 'connection-in',
  strengthFeedback: 'connection-strength',
  gainFeedback: 'connection-gain',
} satisfies PreviewControl;

describe('Preview page model', () => {
  it('uses named and module-backed pages', () => {
    expect(getPreviewPageCount(patch)).toBe(2);
    expect(getPreviewPageName(patch, 0)).toBe('Ambient');
    expect(getPreviewPageName(patch, 2)).toBe('Page 3');
  });

  it('places a cross-page connection on its destination page', () => {
    expect(getControlPage(parameter)).toBe(0);
    expect(getControlPage(connection)).toBe(1);
    expect(groupPreviewControls([parameter, connection], 1, patch)).toEqual([
      expect.objectContaining({ moduleIndex: 1, moduleName: 'Freeze', controls: [connection] }),
    ]);
  });

  it('treats stars as mapping metadata', () => {
    expect(isMappedControl(parameter)).toBe(true);
    expect(isMappedControl(connection)).toBe(true);
  });
});
