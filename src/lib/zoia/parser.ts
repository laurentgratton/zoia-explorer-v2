import { Patch, Module, Connection } from './types';

export function parsePatch(buffer: ArrayBuffer): Patch {
  const view = new DataView(buffer);
  let offset = 0;

  // --- 1. Header ---
  // 0: Patch Size (u32) - in 4-byte chunks
  const patchSizeChunks = view.getUint32(offset, true);
  offset += 4;
  const patchEndOffset = patchSizeChunks * 4;

  if (patchEndOffset < 24 || patchEndOffset > buffer.byteLength) {
    throw new Error('Invalid patch size');
  }
  
  // 4: Patch Name (16 bytes)
  const patchName = parseString(view, offset, 16);
  offset += 16;

  // --- 2. Modules ---
  // Number of modules
  const numModules = view.getUint32(offset, true);
  offset += 4;

  const modules: Module[] = [];
  for (let i = 0; i < numModules; i++) {
    const moduleStartOffset = offset;
    
    const moduleSizeChunks = view.getUint32(offset, true);
    const moduleSizeBytes = moduleSizeChunks * 4;
    const moduleEndOffset = moduleStartOffset + moduleSizeBytes;

    if (moduleSizeBytes < 40 || moduleEndOffset > patchEndOffset) {
      throw new Error(`Invalid size for module ${i}`);
    }
    offset += 4;

    const typeId = view.getUint32(offset, true);
    offset += 4;

    const version = view.getUint32(offset, true);
    offset += 4;

    const page = view.getUint32(offset, true);
    offset += 4;

    const oldColor = view.getUint32(offset, true);
    offset += 4;

    const gridPosition = view.getUint32(offset, true);
    offset += 4;

    const numUserParams = view.getUint32(offset, true);
    offset += 4;

    const savedDataSize = view.getUint32(offset, true);
    const savedDataStorageSize = Math.ceil(savedDataSize / 4) * 4;
    offset += 4;

    // Options (8 bytes)
    const options: number[] = [];
    for (let j = 0; j < 8; j++) {
      options.push(view.getUint8(offset));
      offset += 1;
    }

    const parametersEndOffset = offset + numUserParams * 4;
    const savedDataEndOffset = parametersEndOffset + savedDataStorageSize;

    if (savedDataEndOffset > moduleEndOffset) {
      throw new Error(`Invalid parameter or saved-data size for module ${i}`);
    }

    const parameters: number[] = [];
    for (let k = 0; k < numUserParams; k++) {
      parameters.push(view.getUint32(offset, true));
      offset += 4;
    }

    const savedData: number[] = [];
    for (let k = 0; k < savedDataStorageSize; k++) {
      savedData.push(view.getUint8(offset));
      offset += 1;
    }

    const remainingBytes = moduleEndOffset - offset;
    let name = "";
    if (remainingBytes === 16) {
      name = parseString(view, offset, 16);
      offset += 16;
    } else if (remainingBytes !== 0) {
      throw new Error(`Invalid trailing data for module ${i}`);
    }

    modules.push({
      id: 'module-'+i,
      index: i,
      typeId,
      name,
      page,
      gridPosition,
      color: oldColor,
      options,
      parameters,
      savedData,
      savedDataSize,
      version
    });
  }

  // --- 3. Connections ---
  const numConnections = view.getUint32(offset, true);
  offset += 4;

  const connections: Connection[] = [];
  for (let i = 0; i < numConnections; i++) {
    const sourceModuleIndex = view.getUint32(offset, true);
    offset += 4;
    const sourcePortIndex = view.getUint32(offset, true);
    offset += 4;
    const destModuleIndex = view.getUint32(offset, true);
    offset += 4;
    const destPortIndex = view.getUint32(offset, true);
    offset += 4;
    const strength = view.getUint32(offset, true);
    offset += 4;

    connections.push({
      sourceModuleIndex,
      sourcePortIndex,
      destModuleIndex,
      destPortIndex,
      strength
    });
  }

  // --- 4. Page Names ---
  const pageNames: string[] = [];
  if (offset + 4 <= patchEndOffset) {
     const numPageNames = view.getUint32(offset, true);
     offset += 4;
     
     for (let i = 0; i < numPageNames; i++) {
       if (offset + 16 > patchEndOffset) break;
       pageNames.push(parseString(view, offset, 16));
       offset += 16;
     }
  }

  // --- 5. Starred Elements ---
  const starredElements: import('./types').StarredElement[] = [];
  if (offset + 4 <= patchEndOffset) {
     const numStarred = view.getUint32(offset, true);
     offset += 4;

     for (let i = 0; i < numStarred; i++) {
       if (offset + 4 > patchEndOffset) break;
       let raw = view.getUint32(offset, true);
       offset += 4;

       // Check MSB (Bit 31)
       // 0x80000000 is negative in signed 32-bit, so check if non-zero
       const isConnection = (raw & 0x80000000) !== 0;

       if (isConnection) {
         // Invert bits for connection type
         raw = ~raw >>> 0; 
         
         // Bits 0-15: Connection Index
         const connectionIndex = raw & 0xFFFF;
         // Bits 16-22: Not used
         // Bits 23-30: MIDI CC (0 = none, value-1 = CC#)
         const midiCcRaw = (raw >> 23) & 0xFF;
         const midiCc = midiCcRaw > 0 ? midiCcRaw - 1 : undefined;

         starredElements.push({
           type: 'connection',
           connectionIndex,
           midiCc
         });
       } else {
         // Parameter type
         // Bits 0-15: Module Index
         const moduleIndex = raw & 0xFFFF;
         // Bits 16-22: Input Block Index
         const blockIndex = (raw >> 16) & 0x7F;
         // Bits 23-30: MIDI CC
         const midiCcRaw = (raw >> 23) & 0xFF;
         const midiCc = midiCcRaw > 0 ? midiCcRaw - 1 : undefined;

         starredElements.push({
           type: 'parameter',
           moduleIndex,
           blockIndex,
           midiCc
         });
       }
     }
  }

  // --- 6. Modules Colors (Optional) ---
  // Check if there is remaining data for colors. We expect numModules * 4 bytes.
  const expectedColorBytes = numModules * 4;
  if (offset + expectedColorBytes <= patchEndOffset) {
    for (let i = 0; i < numModules; i++) {
      const extendedColor = view.getUint32(offset, true);
      offset += 4;
      if (i < modules.length) {
        modules[i].color = extendedColor;
      }
    }
  }

  return {
    name: patchName,
    modules,
    connections,
    pageNames,
    starredElements
  };
}

function parseString(view: DataView, offset: number, length: number): string {
  let str = "";
  for (let i = 0; i < length; i++) {
    const charCode = view.getUint8(offset + i);
    if (charCode === 0) break; // Null terminator
    str += String.fromCharCode(charCode);
  }
  return str;
}
