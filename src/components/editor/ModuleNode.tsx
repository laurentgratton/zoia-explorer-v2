import React, { memo, useMemo } from 'react';
import { Position, NodeProps, Node } from '@xyflow/react';
import { getModuleDefinition } from '@/lib/zoia/moduleLib';
import { getGridPosition } from '@/lib/zoia/gridUtils';

// Define the data structure for our custom node
export interface ModuleNodeData extends Record<string, unknown> {
  label: string;
  typeId: number;
  type: string;
  color: number;
  options: number[];
  gridX: number;
  gridY: number;
  identifier: number;
}

export type ModuleNode = Node<ModuleNodeData>;

const BLOCK_SIZE = 60;
const GAP = 8;

const ModuleNode = ({ data }: NodeProps<ModuleNode>) => {
  const { typeId, options, gridX, gridY, color, identifier } = data;
  const def = getModuleDefinition(typeId);

  const blocks = useMemo(() => {
    if (!def) return [];
    // Ensure options is array of numbers
    const safeOptions = options || []; 
    return def.calcBlocks({ blocks: def.blocks, options: safeOptions });
  }, [def, options]);

  // Map blocks to positions and handles
  const blockElements = useMemo(() => {
    let inputIdx = 0;
    let outputIdx = 0;

    return blocks.map((block, index) => {
      // Calculate Grid Position
      const pos = getGridPosition(gridX, gridY, index);
      
      // Calculate Relative Position (pixels)
      // Relative to the Module Node's origin (which is at gridX, gridY)
      const relGridX = pos.x - gridX;
      const relGridY = pos.y - gridY;
      
      const left = relGridX * (BLOCK_SIZE + GAP);
      const top = relGridY * (BLOCK_SIZE + GAP);

      // Determine Handle
      let handleId = null;
      let handleType: 'target' | 'source' | null = null;
      let handlePos = null;

      if (block.direction === 0) { // Input
        handleId = `${inputIdx++}`;
        handleType = 'target';
        handlePos = Position.Left;
      } else if (block.direction === 1) { // Output
        handleId = `${outputIdx++}`;
        handleType = 'source';
        handlePos = Position.Right;
      }

      return {
        ...block,
        left,
        top,
        handleId,
        handleType,
        handlePos
      };
    });
  }, [blocks, gridX, gridY]);

  const hexColor = getColorHex(color);

  // Fallback if no blocks are generated (e.g. unknown module type)
  if (blockElements.length === 0) {
    return (
      <div 
        className={"border border-red-500 bg-red-900/50 flex items-center justify-center text-white text-[8px] " + "module-" + identifier}
        style={{ width: BLOCK_SIZE, height: BLOCK_SIZE }}
        title={`Unknown Module Type: ${typeId}`}
      >
          {data.label}
      </div>
    );
  }

  return (
    <div className="relative pointer-events-none">1
      {blockElements.map((b, i) => (
        <div
          key={i}
          className={"absolute border flex items-center justify-center text-[8px] text-center overflow-hidden select-none pointer-events-auto cursor-pointer hover:brightness-110 shadow-sm module-" + identifier}
          style={{
            left: b.left,
            top: b.top,
            width: BLOCK_SIZE,
            height: BLOCK_SIZE,
            backgroundColor: '#1f2937', // gray-800
            borderColor: hexColor,
            borderTopWidth: 3, 
          }}
        >
           {/* Block Content */}
           <div className="absolute inset-0 text-white opacity-10" style={{ backgroundColor: hexColor }}></div>
            <span className="relative z-10 text-white leading-tight px-0.5 break-words"></span>
           <span className="relative z-10 text-white leading-tight px-0.5 break-words">{i === 0 ? data.label + "\n" + b.name : b.name}</span>
        </div>
      ))}
    </div>
  );
};

// Helper to map Zoia color indices to Hex codes (approximate)
function getColorHex(colorIndex: number): string {
  // Based on Binary Format.md (old colors 0-7, extended 8+)
  // We'll just map the basic ones for now or a default.
  const colors: Record<number, string> = {
    0: '#6b7280', // Unknown (Gray)
    1: '#3b82f6', // Blue
    2: '#22c55e', // Green
    3: '#ef4444', // Red
    4: '#eab308', // Yellow
    5: '#06b6d4', // Aqua
    6: '#d946ef', // Magenta
    7: '#ffffff', // White
    // Extended
    8: '#f97316', // Orange
    9: '#84cc16', // Lime
    10: '#14b8a6', // Surf (Teal)
    11: '#0ea5e9', // Sky
    12: '#a855f7', // Purple
    13: '#ec4899', // Pink
    14: '#f43f5e', // Peach (Rose)
    15: '#f59e0b', // Mango (Amber)
  };
  return colors[colorIndex] || '#9ca3af'; // Default Gray
}

export default memo(ModuleNode);
