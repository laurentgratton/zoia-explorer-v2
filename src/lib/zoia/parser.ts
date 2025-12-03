import { Patch, Module, Connection } from './types';

export function parsePatch(buffer: ArrayBuffer): Patch {
  const view = new DataView(buffer);
  let offset = 0;

  // --- 1. Header ---
  // 0: Patch Size (u32) - in 4-byte chunks
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const patchSizeChunks = view.getUint32(offset, true);
  offset += 4;
  
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
    offset += 4;

    const typeId = view.getUint32(offset, true);
    offset += 4;

    // Unknown
    offset += 4;

    const page = view.getUint32(offset, true);
    offset += 4;

    const oldColor = view.getUint32(offset, true);
    offset += 4;

    const gridPosition = view.getUint32(offset, true);
    offset += 4;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const numUserParams = view.getUint32(offset, true); 
    offset += 4;

    const version = view.getUint32(offset, true);
    offset += 4;

    // Options (8 bytes)
    const options: number[] = [];
    for (let j = 0; j < 8; j++) {
      options.push(view.getUint8(offset));
      offset += 1;
    }

    // Additional Options & Name Logic
    const currentRelPos = offset - moduleStartOffset; // Should be 40
    const remainingBytes = moduleSizeBytes - currentRelPos;
    
    let hasName = false;
    let name = "";
    
    if (remainingBytes >= 16) {
      // Check last 16 bytes for text-like content
      const possibleNameOffset = moduleStartOffset + moduleSizeBytes - 16;
      if (isValidName(view, possibleNameOffset, 16)) {
         hasName = true;
         name = parseString(view, possibleNameOffset, 16);
      }
    }

    const paramsEndOffset = moduleStartOffset + moduleSizeBytes - (hasName ? 16 : 0);
    const paramsBytes = paramsEndOffset - offset;
    const numParams = paramsBytes / 4; // Should be u32s

    const parameters: number[] = [];
    for (let k = 0; k < numParams; k++) {
      parameters.push(view.getUint32(offset, true));
      offset += 4;
    }

    if (hasName) {
      offset += 16; // Skip name as we read it
    }

    // Safety check to ensure we align with the next module
    if (offset !== moduleStartOffset + moduleSizeBytes) {
        // If we miscalculated, force jump to expected end
        offset = moduleStartOffset + moduleSizeBytes;
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
  if (offset + 4 <= buffer.byteLength) {
     const numPageNames = view.getUint32(offset, true);
     offset += 4;
     
     for (let i = 0; i < numPageNames; i++) {
       if (offset + 16 > buffer.byteLength) break;
       pageNames.push(parseString(view, offset, 16));
       offset += 16;
     }
  }

  // --- 5. Starred Elements ---
  const starredElements: import('./types').StarredElement[] = [];
  if (offset + 4 <= buffer.byteLength) {
     const numStarred = view.getUint32(offset, true);
     offset += 4;

     for (let i = 0; i < numStarred; i++) {
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
  if (offset + expectedColorBytes <= buffer.byteLength) {
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

function isValidName(view: DataView, offset: number, length: number): boolean {
  for (let i = 0; i < length; i++) {
    const c = view.getUint8(offset + i);
    if (c === 0) continue; // Null is fine (padding)
    // a-z (0x61 – 0x7A), A-Z (0x41 – 0x5A), 0-9 (0x30 – 0x39), space (0x20), dash (0x2D), dot (0x2E)
    const valid = (c >= 0x61 && c <= 0x7A) ||
                  (c >= 0x41 && c <= 0x5A) ||
                  (c >= 0x30 && c <= 0x39) ||
                  c === 0x20 || c === 0x2D || c === 0x2E;
    if (!valid) return false;
  }
  return true;
}
