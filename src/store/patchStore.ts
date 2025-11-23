import { create } from 'zustand';
import { Patch, Connection } from '../lib/zoia/types';

interface PatchState {
  patch: Patch | null;
  activePage: number;
  selectedModuleIndex: number | null;
  setPatch: (patch: Patch) => void;
  setActivePage: (page: number) => void;
  setSelectedModuleIndex: (index: number | null) => void;
  clearPatch: () => void;
  updateModulePosition: (moduleIndex: number, gridPosition: number) => void;
  updateModuleName: (moduleIndex: number, name: string) => void;
  updateModuleParams: (moduleIndex: number, parameters: number[]) => void;
  addConnection: (connection: Connection) => void;
  removeConnection: (sourceMod: number, sourcePort: number, destMod: number, destPort: number) => void;
  addModule: (typeId: number) => void;
  removeModule: (moduleIndex: number) => void;
}

export const usePatchStore = create<PatchState>((set) => ({
  patch: null,
  activePage: 0,
  selectedModuleIndex: null,
  setPatch: (patch) => set({ patch, activePage: 0, selectedModuleIndex: null }),
  setActivePage: (page) => set({ activePage: page }),
  setSelectedModuleIndex: (index) => set({ selectedModuleIndex: index }),
  clearPatch: () => set({ patch: null, activePage: 0, selectedModuleIndex: null }),
  updateModulePosition: (moduleIndex, gridPosition) => set((state) => {
    if (!state.patch) return {};
    const newModules = state.patch.modules.map((m) =>
      m.index === moduleIndex ? { ...m, gridPosition } : m
    );
    return { patch: { ...state.patch, modules: newModules } };
  }),
  updateModuleName: (moduleIndex, name) => set((state) => {
    if (!state.patch) return {};
    const newModules = state.patch.modules.map((m) =>
      m.index === moduleIndex ? { ...m, name } : m
    );
    return { patch: { ...state.patch, modules: newModules } };
  }),
  updateModuleParams: (moduleIndex, parameters) => set((state) => {
    if (!state.patch) return {};
    const newModules = state.patch.modules.map((m) =>
      m.index === moduleIndex ? { ...m, options: parameters } : m
    );
    return { patch: { ...state.patch, modules: newModules } };
  }),
  addConnection: (connection) => set((state) => {
    if (!state.patch) return {};
    return { patch: { ...state.patch, connections: [...state.patch.connections, connection] } };
  }),
  removeConnection: (sourceMod, sourcePort, destMod, destPort) => set((state) => {
    if (!state.patch) return {};
    const newConnections = state.patch.connections.filter((c) =>
      !(c.sourceModuleIndex === sourceMod &&
        c.sourcePortIndex === sourcePort &&
        c.destModuleIndex === destMod &&
        c.destPortIndex === destPort)
    );
    return { patch: { ...state.patch, connections: newConnections } };
  }),
  addModule: (typeId) => set((state) => {
    if (!state.patch) return {};
    
    const newIndex = state.patch.modules.length;
    const usedPositions = new Set(
      state.patch.modules
        .filter(m => m.page === state.activePage)
        .map(m => m.gridPosition)
    );
    
    let gridPosition = 0;
    while(usedPositions.has(gridPosition) && gridPosition < 40) {
       gridPosition++;
    }

    const newModule = {
      index: newIndex,
      typeId,
      name: '',
      page: state.activePage,
      gridPosition,
      color: 0, 
      options: [0,0,0,0,0,0,0,0],
      parameters: [],
      version: 1
    };

    return {
       patch: {
         ...state.patch,
         modules: [...state.patch.modules, newModule]
       }
    };
  }),
  removeModule: (indexToRemove) => set((state) => {
    if (!state.patch) return {};
    
    const oldModules = state.patch.modules;
    const newModules = oldModules
      .filter((m) => m.index !== indexToRemove)
      .map((m, newIndex) => ({ ...m, index: newIndex }));

    const newConnections = state.patch.connections
      .filter((c) => c.sourceModuleIndex !== indexToRemove && c.destModuleIndex !== indexToRemove)
      .map((c) => ({
        ...c,
        sourceModuleIndex: c.sourceModuleIndex > indexToRemove ? c.sourceModuleIndex - 1 : c.sourceModuleIndex,
        destModuleIndex: c.destModuleIndex > indexToRemove ? c.destModuleIndex - 1 : c.destModuleIndex,
      }));

    return { 
      patch: { 
        ...state.patch, 
        modules: newModules, 
        connections: newConnections 
      },
      selectedModuleIndex: null
    };
  }),
}));
