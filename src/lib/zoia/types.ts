export interface Connection {
  sourceModuleIndex: number;
  sourcePortIndex: number;
  destModuleIndex: number;
  destPortIndex: number;
  strength: number;
}

export interface ConnectionLink {
    source: number;
    target: number;
    index?: number;
    strength?: number;
}

export interface Module {
  id: string;
  index: number; // Runtime index in the module list
  typeId: number;
  name: string;
  page: number;
  gridPosition: number;
  color: number;
  options: number[]; // The 8 byte options
  parameters: number[]; // User parameter values (u32s)
  savedData?: number[]; // Opaque module-owned save data, padded to a 4-byte boundary
  savedDataSize?: number; // Unpadded byte count stored in the module header
  version?: number;
}

export interface StarredParameter {
  type: 'parameter';
  moduleIndex: number;
  blockIndex: number;
  midiCc?: number;
}

export interface StarredConnection {
  type: 'connection';
  connectionIndex: number;
  midiCc?: number;
}

export type StarredElement = StarredParameter | StarredConnection;

export interface Patch {
  id?: string; // Database ID
  name: string;
  modules: Module[];
  connections: Connection[];
  pageNames: string[];
  starredElements?: StarredElement[];
}
