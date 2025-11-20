import { parsePatch } from './parser';

describe('Binary Parser', () => {
  it('should parse a minimal patch correctly', () => {
    // Manually construct a minimal valid patch buffer
    // 1 Module, 0 Connections
    const buffer = new ArrayBuffer(1024);
    const view = new DataView(buffer);
    let offset = 0;

    // Patch Header
    const patchSizeOffset = 0;
    offset += 4;
    // Patch Name "TestPatch"
    const name = "TestPatch";
    for(let i=0; i<16; i++) view.setUint8(offset+i, i < name.length ? name.charCodeAt(i) : 0);
    offset += 16;

    // Modules Count = 1
    view.setUint32(offset, 1, true);
    offset += 4;

    // Module 1
    const modStart = offset;
    const modSizeOffset = offset;
    offset += 4;
    view.setUint32(offset, 42, true); // Type ID
    offset += 4;
    offset += 4; // Unknown
    view.setUint32(offset, 1, true); // Page
    offset += 4;
    view.setUint32(offset, 2, true); // Color
    offset += 4;
    view.setUint32(offset, 10, true); // Grid Pos
    offset += 4;
    view.setUint32(offset, 0, true); // Num params
    offset += 4;
    view.setUint32(offset, 5, true); // Version
    offset += 4;
    // Options (8 bytes)
    for(let i=0; i<8; i++) view.setUint8(offset+i, i);
    offset += 8;
    // Params (0)
    // Name "MyModule"
    const modName = "MyModule";
    for(let i=0; i<16; i++) view.setUint8(offset+i, i < modName.length ? modName.charCodeAt(i) : 0);
    offset += 16;
    
    // Write Mod Size
    const modSize = offset - modStart;
    view.setUint32(modSizeOffset, modSize / 4, true);

    // Connections Count = 0
    view.setUint32(offset, 0, true);
    offset += 4;

    // Pages Count = 0
    view.setUint32(offset, 0, true);
    offset += 4; 

    // Write Patch Size
    view.setUint32(patchSizeOffset, offset / 4, true);

    // PARSE
    const patch = parsePatch(buffer);

    expect(patch.name).toBe("TestPatch");
    expect(patch.modules.length).toBe(1);
    expect(patch.modules[0].typeId).toBe(42);
    expect(patch.modules[0].name).toBe("MyModule");
    expect(patch.modules[0].page).toBe(1);
    expect(patch.modules[0].gridPosition).toBe(10);
    expect(patch.modules[0].options[0]).toBe(0);
    expect(patch.modules[0].version).toBe(5);
  });

  it('should parse starred elements and extended colors', () => {
    const buffer = new ArrayBuffer(2048);
    const view = new DataView(buffer);
    let offset = 0;

    // --- Header ---
    const patchSizeOffset = 0;
    offset += 4;
    // Name
    offset += 16; 

    // --- Modules ---
    view.setUint32(offset, 1, true); // 1 Module
    offset += 4;

    // Module 1
    const modStart = offset;
    const modSizeOffset = offset;
    offset += 4;
    view.setUint32(offset, 10, true); // Type ID
    offset += 4;
    offset += 4; // Unknown
    view.setUint32(offset, 0, true); // Page
    offset += 4;
    view.setUint32(offset, 3, true); // Old Color (Red) - Should be overridden by extended color
    offset += 4;
    view.setUint32(offset, 0, true); // Grid Pos
    offset += 4;
    view.setUint32(offset, 0, true); // Num Params
    offset += 4;
    view.setUint32(offset, 1, true); // Version
    offset += 4;
    offset += 8; // Options
    offset += 16; // Name placeholder
    
    const modSize = offset - modStart;
    view.setUint32(modSizeOffset, modSize / 4, true);

    // --- Connections ---
    view.setUint32(offset, 1, true); // 1 Connection
    offset += 4;
    // Connection 1
    view.setUint32(offset, 0, true);
    offset += 4;
    view.setUint32(offset, 0, true);
    offset += 4;
    view.setUint32(offset, 0, true);
    offset += 4;
    view.setUint32(offset, 0, true);
    offset += 4;
    view.setUint32(offset, 100, true);
    offset += 4;

    // --- Page Names ---
    view.setUint32(offset, 0, true); // 0 Pages
    offset += 4;

    // --- Starred Elements ---
    view.setUint32(offset, 2, true); // 2 Starred Elements
    offset += 4;

    // Star 1: Parameter (Mod 0, Block 5, MIDI CC 10 (stored as 11))
    // (11 << 23) | (5 << 16) | 0
    const star1 = (11 << 23) | (5 << 16) | 0;
    view.setUint32(offset, star1, true);
    offset += 4;

    // Star 2: Connection (Conn 0, MIDI CC None (0 stored as 0))
    // val = 0 | 0 = 0. raw = ~0
    const star2 = ~0 >>> 0;
    view.setUint32(offset, star2, true);
    offset += 4;

    // --- Modules Colors ---
    // 1 Module, so 1 Color. Color 8 (Orange)
    view.setUint32(offset, 8, true);
    offset += 4;

    // Write Patch Size
    view.setUint32(patchSizeOffset, offset / 4, true);

    const patch = parsePatch(buffer);

    expect(patch.modules[0].color).toBe(8); // Should be extended color
    expect(patch.starredElements?.length).toBe(2);
    
    const s1 = patch.starredElements![0];
    if (s1.type === 'parameter') {
        expect(s1.moduleIndex).toBe(0);
        expect(s1.blockIndex).toBe(5);
        expect(s1.midiCc).toBe(10);
    } else {
        fail('First star should be parameter');
    }

    const s2 = patch.starredElements![1];
    if (s2.type === 'connection') {
        expect(s2.connectionIndex).toBe(0);
        expect(s2.midiCc).toBeUndefined();
    } else {
        fail('Second star should be connection');
    }
  });
});
