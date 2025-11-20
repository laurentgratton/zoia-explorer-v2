export interface Connection {
  sourceModuleIndex: number;
  sourcePortIndex: number;
  destModuleIndex: number;
  destPortIndex: number;
  strength: number;
}

export interface Module {
  index: number; // Runtime index in the module list
  typeId: number;
  name: string;
  page: number;
  gridPosition: number;
  color: number;
  options: number[]; // The 8 byte options
  parameters: number[]; // The additional options (u32s)
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
