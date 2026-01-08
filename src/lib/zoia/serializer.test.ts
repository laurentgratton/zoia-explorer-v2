import { serializePatch } from './serializer';
import { parsePatch } from './parser';
import { Patch } from './types';

describe('Binary Serializer', () => {
  it('should round-trip a patch correctly', () => {
    const originalPatch: Patch = {
      name: "RoundTrip",
      modules: [
        {
          id: '0',
          index: 0,
          typeId: 10,
          name: "ModA",
          page: 0,
          gridPosition: 5,
          color: 1,
          options: [1,2,3,4,5,6,7,8],
          parameters: [100, 200],
          version: 2
        }
      ],
      connections: [
        {
          sourceModuleIndex: 0,
          sourcePortIndex: 1,
          destModuleIndex: 0,
          destPortIndex: 0,
          strength: 5000
        }
      ],
      pageNames: ["Page1"],
      starredElements: [
        { type: 'parameter', moduleIndex: 0, blockIndex: 2, midiCc: 5 },
        { type: 'connection', connectionIndex: 0 }
      ]
    };

    const buffer = serializePatch(originalPatch);
    const parsed = parsePatch(buffer);

    expect(parsed.name).toBe(originalPatch.name);
    expect(parsed.modules.length).toBe(1);
    expect(parsed.modules[0].name).toBe("ModA");
    expect(parsed.modules[0].parameters).toEqual([100, 200]);
    expect(parsed.modules[0].version).toBe(2);
    // Check extended color persistence (Module 0 had color 1 (Blue), which is same in old/new)
    // Let's change original patch color to an extended one (8 - Orange)
    // But wait, I defined color: 1 in originalPatch above.
    
    expect(parsed.connections.length).toBe(1);
    expect(parsed.connections[0].strength).toBe(5000);
    expect(parsed.pageNames).toEqual(["Page1"]);
    
    expect(parsed.starredElements).toBeDefined();
    expect(parsed.starredElements!.length).toBe(2);
    expect(parsed.starredElements![0]).toEqual(originalPatch.starredElements![0]);
    expect(parsed.starredElements![1]).toEqual(originalPatch.starredElements![1]);
  });
  
  it('should handle extended colors in round-trip', () => {
      const patch: Patch = {
          name: "ColorTest",
          modules: [{
              id: '0',
              index: 0, typeId: 0, name: "OrangeMod", page: 0, gridPosition: 0,
              color: 8, // Orange (Extended)
              options: [], parameters: [], version: 1
          }],
          connections: [],
          pageNames: []
      };
      
      const buffer = serializePatch(patch);
      const parsed = parsePatch(buffer);
      
      expect(parsed.modules[0].color).toBe(8);
  });
});
