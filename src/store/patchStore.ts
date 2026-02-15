import { create } from 'zustand';
import {Patch, Connection, StarredParameter, StarredConnection} from '@/lib/zoia/types';
import {hasEuroModules} from "@/lib/zoia/moduleLib";

interface PatchState {
  patch: Patch | null;
  activePage: number;
  showSystemModules: boolean;
  selectedModuleIndex: number | null;
  setPatch: (patch: Patch) => void;
  setActivePage: (page: number) => void;
  toggleSystemModules: () => void;
  setSelectedModuleIndex: (index: number | null) => void;
  clearPatch: () => void;
  updateModulePosition: (moduleIndex: number, gridPosition: number) => void;
  updateModuleName: (moduleIndex: number, name: string) => void;
  updateModuleParams: (moduleIndex: number, parameters: number[]) => void;
  updateModuleParameters: (moduleIndex: number, parameters: number[]) => void;
  addConnection: (connection: Connection) => void;
  removeConnection: (sourceMod: number, sourcePort: number, destMod: number, destPort: number) => void;
  updateConnectionStrength: (connectionIndex: number, strength: number) => void;
  addModule: (typeId: number) => void;
  removeModule: (moduleIndex: number) => void;
  toggleStarParameter: (moduleIndex: number, blockIndex: number) => void;
  toggleStarConnection: (connectionIndex: number) => void;
  setStarredParameterCc: (moduleIndex: number, blockIndex: number, ccValue: number | undefined) => void;
  setStarredConnectionCc: (connectionIndex: number, ccValue: number | undefined) => void;
  renamePatch: (name: string) => void;
  renamePage: (pageIndex: number, name: string) => void;
  addPage: (name: string) => void;
}

export const usePatchStore = create<PatchState>((set) => ({
  patch: null,
  activePage: 0,
  showSystemModules: false,
  selectedModuleIndex: null,
  setPatch: (patch) => set({ patch, activePage: 0, selectedModuleIndex: null }),
  setActivePage: (page) => set({ activePage: page }),
  toggleSystemModules: () => set((state) => ({ showSystemModules: hasEuroModules(state?.patch?.modules) ? !state.showSystemModules : false })),
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
  updateModuleParameters: (moduleIndex, parameters) => set((state) => {
    if (!state.patch) return {};
    const newModules = state.patch.modules.map((m) =>
        m.index === moduleIndex ? { ...m, parameters: parameters } : m
    );
    return { patch: { ...state.patch, modules: newModules } };
  }),
  addConnection: (connection) => set((state) => {
    if (!state.patch) return {};
    return { patch: { ...state.patch, connections: [...state.patch.connections, connection] } };
  }),
  removeConnection: (sourceMod, sourcePort, destMod, destPort) => set((state) => {
    if (!state.patch) return {};
    
    const connectionIndex = state.patch.connections.findIndex((c) =>
      c.sourceModuleIndex === sourceMod &&
      c.sourcePortIndex === sourcePort &&
      c.destModuleIndex === destMod &&
      c.destPortIndex === destPort
    );

    if (connectionIndex === -1) return {};

    const newConnections = state.patch.connections.filter((_, i) => i !== connectionIndex);

    let newStarred = state.patch.starredElements || [];
    newStarred = newStarred.filter(s => !(s.type === 'connection' && s.connectionIndex === connectionIndex));
    newStarred = newStarred.map(s => {
      if (s.type === 'connection' && s.connectionIndex > connectionIndex) {
        return { ...s, connectionIndex: s.connectionIndex - 1 };
      }
      return s;
    });

    return { patch: { ...state.patch, connections: newConnections, starredElements: newStarred } };
  }),
  updateConnectionStrength: (connectionIndex, strength) => set((state) => {
    if (!state.patch) return {};
    const newConnections = state.patch.connections.map((c, i) =>
      i === connectionIndex ? { ...c, strength } : c
    );
    return { patch: { ...state.patch, connections: newConnections } };
  }),
  // @ts-expect-error subtype mixup
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
  toggleStarParameter: (moduleIndex, blockIndex) => set((state) => {
    if (!state.patch) return {};
    const starred = state.patch.starredElements || [];
    const existingIndex = starred.findIndex(s => s.type === 'parameter' && s.moduleIndex === moduleIndex && s.blockIndex === blockIndex);
    
    let newStarred;
    if (existingIndex >= 0) {
      newStarred = starred.filter((_, i) => i !== existingIndex);
    } else {
      const newEl: StarredParameter = { type: 'parameter', moduleIndex, blockIndex };
      newStarred = [...starred, newEl];
    }
    return { patch: { ...state.patch, starredElements: newStarred } };
  }),
  toggleStarConnection: (connectionIndex) => set((state) => {
    if (!state.patch) return {};
    const starred = state.patch.starredElements || [];
    const existingIndex = starred.findIndex(s => s.type === 'connection' && s.connectionIndex === connectionIndex);
    
    let newStarred;
    if (existingIndex >= 0) {
      newStarred = starred.filter((_, i) => i !== existingIndex);
    } else {
      const newEl: StarredConnection = { type: 'connection', connectionIndex };
      newStarred = [...starred, newEl];
    }
    return { patch: { ...state.patch, starredElements: newStarred } };
  }),
  setStarredParameterCc: (moduleIndex, blockIndex, ccValue) => set((state) => {
    if (!state.patch) return {};
    const starred = state.patch.starredElements || [];
    const newStarred = starred.map(s => {
      if (s.type === 'parameter' && s.moduleIndex === moduleIndex && s.blockIndex === blockIndex) {
        return { ...s, midiCc: ccValue };
      }
      return s;
    });
    return { patch: { ...state.patch, starredElements: newStarred } };
  }),
  setStarredConnectionCc: (connectionIndex, ccValue) => set((state) => {
    if (!state.patch) return {};
    const starred = state.patch.starredElements || [];
    const newStarred = starred.map(s => {
      if (s.type === 'connection' && s.connectionIndex === connectionIndex) {
        return { ...s, midiCc: ccValue };
      }
      return s;
    });
    return { patch: { ...state.patch, starredElements: newStarred } };
  }),
  renamePatch: (name) => set((state) => {
    if (!state.patch) return {};
    return { patch: { ...state.patch, name } };
  }),
  renamePage: (pageIndex, name) => set((state) => {
    if (!state.patch) return {};
    const newPageNames = [...(state.patch.pageNames || [])];
    // Ensure the array is long enough
    while (newPageNames.length <= pageIndex) {
      newPageNames.push("");
    }
    newPageNames[pageIndex] = name;
    return { patch: { ...state.patch, pageNames: newPageNames } };
  }),
  addPage: (name) => set((state) => {
    if (!state.patch) return {};
    const newPageNames = [...(state.patch.pageNames || [])];
    if (newPageNames.length >= 62) return {};
    
    // If there are gaps in pageNames due to modules being on higher pages than pageNames length
    const maxModulePage = state.patch.modules.reduce((max, m) => Math.max(max, m.page), 0);
    const numExistingPages = Math.max(maxModulePage + 1, newPageNames.length);
    
    if (numExistingPages >= 62) return {};

    while (newPageNames.length < numExistingPages) {
        newPageNames.push("");
    }
    
    newPageNames.push(name);
    const newPageIndex = newPageNames.length - 1;
    
    return { 
        patch: { ...state.patch, pageNames: newPageNames },
        activePage: newPageIndex
    };
  }),
}));
