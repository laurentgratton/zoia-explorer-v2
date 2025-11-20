import { Patch } from './types';

const PATCH_MAX_SIZE = 32768;

export function serializePatch(patch: Patch): ArrayBuffer {
  const buffer = new ArrayBuffer(PATCH_MAX_SIZE);
  const view = new DataView(buffer);
  let offset = 0;

  // Placeholder for Patch Size (will write later)
  const patchSizeOffset = offset;
  offset += 4;

  // Patch Name
  writeString(view, offset, 16, patch.name);
  offset += 16;

  // --- Modules ---
  view.setUint32(offset, patch.modules.length, true);
  offset += 4;

  for (const mod of patch.modules) {
    const moduleStartOffset = offset;
    
    // Placeholder for Module Size
    const moduleSizeOffset = offset;
    offset += 4;

    view.setUint32(offset, mod.typeId, true);
    offset += 4;

    // Unknown (0)
    view.setUint32(offset, 0, true);
    offset += 4;

    view.setUint32(offset, mod.page, true);
    offset += 4;

    // Old Color (Mapped from extended color if necessary)
    view.setUint32(offset, getOldColor(mod.color), true); 
    offset += 4;

    view.setUint32(offset, mod.gridPosition, true);
    offset += 4;

    // Num User Params - usually matches additional options count
    view.setUint32(offset, mod.parameters.length, true);
    offset += 4;

    view.setUint32(offset, mod.version || 0, true);
    offset += 4;

    // Options (8 bytes)
    for (let i = 0; i < 8; i++) {
      const val = (mod.options && i < mod.options.length) ? mod.options[i] : 0;
      view.setUint8(offset, val);
      offset += 1;
    }

    // Additional Params
    for (const param of mod.parameters) {
      view.setUint32(offset, param, true);
      offset += 4;
    }

    // Name (Always write 16 bytes)
    writeString(view, offset, 16, mod.name);
    offset += 16;

    // Write Module Size (in 4-byte chunks)
    const moduleSizeBytes = offset - moduleStartOffset;
    view.setUint32(moduleSizeOffset, moduleSizeBytes / 4, true);
  }

  // --- Connections ---
  view.setUint32(offset, patch.connections.length, true);
  offset += 4;

  for (const conn of patch.connections) {
    view.setUint32(offset, conn.sourceModuleIndex, true);
    offset += 4;
    view.setUint32(offset, conn.sourcePortIndex, true);
    offset += 4;
    view.setUint32(offset, conn.destModuleIndex, true);
    offset += 4;
    view.setUint32(offset, conn.destPortIndex, true);
    offset += 4;
    view.setUint32(offset, conn.strength, true);
    offset += 4;
  }

  // --- Page Names ---
  const pageNames = patch.pageNames || [];
  view.setUint32(offset, pageNames.length, true);
  offset += 4;

  for (const pName of pageNames) {
    writeString(view, offset, 16, pName);
    offset += 16;
  }

  // --- Starred Elements ---
  const starred = patch.starredElements || [];
  view.setUint32(offset, starred.length, true);
  offset += 4;

  for (const s of starred) {
    let raw = 0;
    const midiCcVal = (s.midiCc !== undefined ? s.midiCc + 1 : 0) & 0xFF;

    if (s.type === 'connection') {
        // Connection Type
        // val = (midiCc + 1) << 23 | connectionIndex
        // raw = ~val
        const val = (midiCcVal << 23) | (s.connectionIndex & 0xFFFF);
        raw = ~val >>> 0; 
    } else {
        // Parameter Type
        // Bits 0-15: Module Index
        // Bits 16-22: Block Index
        // Bits 23-30: MIDI CC
        raw = (midiCcVal << 23) | ((s.blockIndex & 0x7F) << 16) | (s.moduleIndex & 0xFFFF);
        // Ensure MSB is 0
        raw = raw >>> 0; 
    }
    view.setUint32(offset, raw, true);
    offset += 4;
  }

  // --- Modules Colors ---
  for (const mod of patch.modules) {
      view.setUint32(offset, mod.color, true);
      offset += 4;
  }

  // Write Patch Size (in 4-byte chunks)
  const patchSizeBytes = offset;
  view.setUint32(patchSizeOffset, patchSizeBytes / 4, true);

  return buffer;
}

function writeString(view: DataView, offset: number, length: number, str: string) {
  for (let i = 0; i < length; i++) {
    if (i < str.length) {
      view.setUint8(offset + i, str.charCodeAt(i));
    } else {
      view.setUint8(offset + i, 0); // Pad with null
    }
  }
}

function getOldColor(extendedColor: number): number {
  if (extendedColor <= 7) return extendedColor;
  
  const map: Record<number, number> = {
    8: 3, // Orange -> Red
    9: 2, // Lime -> Green
    10: 5, // Surf -> Aqua
    11: 1, // Sky -> Blue
    12: 6, // Purple -> Magenta
    13: 3, // Pink -> Red
    14: 3, // Peach -> Red
    15: 4  // Mango -> Yellow
  };
  return map[extendedColor] !== undefined ? map[extendedColor] : 0;
}
