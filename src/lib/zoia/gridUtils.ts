export const GRID_COLS = 8;
export const SYSTEM_GRID_COLS = 10;

export interface GridPosition {
  x: number;
  y: number;
}

/**
 * Calculates the grid position (x, y) of a specific block within a module.
 * Modules wrap to the next row if they exceed the grid width (GRID_COLS).
 *
 * @param moduleX The starting X coordinate (column) of the module (0-7).
 * @param moduleY The starting Y coordinate (row) of the module.
 * @param blockIndex The index of the block within the module (0 to N-1).
 * @param isSystem
 * @returns The calculated {x, y} position of the block.
 */
export function getGridPosition(moduleX: number, moduleY: number, blockIndex: number, isSystem: boolean): GridPosition {
  const columnOffset = isSystem ? SYSTEM_GRID_COLS : GRID_COLS;
  const linearOffset = moduleX + blockIndex;
  const x = linearOffset % columnOffset;
  const rowOffset = Math.floor(linearOffset / GRID_COLS);
  const y = moduleY + rowOffset;
  return { x, y };
}

/**
 * Determines if a specific block is wrapped to a new row relative to the module's start row.
 *
 * @param moduleX The starting X coordinate (column) of the module.
 * @param blockIndex The index of the block within the module.
 * @returns True if the block is on a subsequent row, false otherwise.
 */
export function isWrapped(moduleX: number, blockIndex: number): boolean {
  const linearOffset = moduleX + blockIndex;
  const rowOffset = Math.floor(linearOffset / GRID_COLS);
  return rowOffset > 0;
}
