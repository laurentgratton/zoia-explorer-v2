import { getGridPosition, isWrapped } from './gridUtils';

describe('gridUtils', () => {
  describe('getGridPosition', () => {
    it('should calculate position for a block within the same row', () => {
      // Start at (0, 0), block 2 -> should be (2, 0)
      expect(getGridPosition(0, 0, 2, false)).toEqual({ x: 2, y: 0 });
    });

    it('should calculate position for a block wrapping to the next row', () => {
      // Start at (6, 0), block 2 (indices 0, 1, 2) -> 6, 7, 0(next row)
      // Block 0 at (6,0)
      // Block 1 at (7,0)
      // Block 2 at (0,1)
      expect(getGridPosition(6, 0, 2, false)).toEqual({ x: 0, y: 1 });
    });

    it('should calculate position for a block wrapping multiple rows', () => {
      // Start at (7, 0), block 9
      // 0->(7,0), 1->(0,1)...8->(7,1), 9->(0,2)
      expect(getGridPosition(7, 0, 9, false)).toEqual({ x: 0, y: 2 });
    });
    
    it('should handle non-zero start Y correctly', () => {
        // Start at (6, 5), block 2 -> should wrap to (0, 6)
        expect(getGridPosition(6, 5, 2, false)).toEqual({ x: 0, y: 6 });
    });
  });

  describe('isWrapped', () => {
    it('should return false for blocks on the same row', () => {
      expect(isWrapped(0, 2)).toBe(false);
    });

    it('should return true for blocks on the next row', () => {
      // Start at 6, block 2 wraps to next row
      expect(isWrapped(6, 2)).toBe(true);
    });
    
    it('should return true for blocks on any subsequent row', () => {
        // Start at 7, block 9 wraps to 2 rows down
        expect(isWrapped(7, 9)).toBe(true);
    });
  });
});
