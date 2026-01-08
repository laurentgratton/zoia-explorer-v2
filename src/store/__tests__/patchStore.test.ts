import { usePatchStore } from '../patchStore';
import { Patch } from '@/lib/zoia/types';

describe('patchStore', () => {
  beforeEach(() => {
    usePatchStore.getState().clearPatch();
  });

  const mockPatch: Patch = {
    name: 'Test Patch',
    modules: [],
    connections: [],
    pageNames: ['Page 0', 'Page 1'],
  };

  it('should rename the patch', () => {
    usePatchStore.getState().setPatch(mockPatch);
    usePatchStore.getState().renamePatch('New Name');
    expect(usePatchStore.getState().patch?.name).toBe('New Name');
  });

  it('should rename a page', () => {
    usePatchStore.getState().setPatch(mockPatch);
    usePatchStore.getState().renamePage(1, 'New Page Name');
    expect(usePatchStore.getState().patch?.pageNames[1]).toBe('New Page Name');
  });

  it('should add a page and set it as active', () => {
    usePatchStore.getState().setPatch(mockPatch);
    usePatchStore.getState().addPage('New Page');
    const state = usePatchStore.getState();
    expect(state.patch?.pageNames.length).toBe(3);
    expect(state.patch?.pageNames[2]).toBe('New Page');
    expect(state.activePage).toBe(2);
  });

  it('should not add more than 62 pages', () => {
    const manyPagesPatch: Patch = {
      ...mockPatch,
      pageNames: Array(62).fill('Page'),
    };
    usePatchStore.getState().setPatch(manyPagesPatch);
    usePatchStore.getState().addPage('Too Many');
    expect(usePatchStore.getState().patch?.pageNames.length).toBe(62);
  });

  it('should handle adding a page when there are gaps', () => {
      const gapPatch: Patch = {
          ...mockPatch,
          modules: [{ index: 0, typeId: 1, name: 'M1', page: 5, gridPosition: 0, color: 0, options: [], parameters: [] }],
          pageNames: ['P0']
      };
      usePatchStore.getState().setPatch(gapPatch);
      // maxModulePage is 5, so numExistingPages is 6.
      // addPage should fill up to 6 then add the new one at 6 (7th page).
      usePatchStore.getState().addPage('P6');
      const state = usePatchStore.getState();
      expect(state.patch?.pageNames.length).toBe(7);
      expect(state.patch?.pageNames[6]).toBe('P6');
      expect(state.activePage).toBe(6);
  });
});
