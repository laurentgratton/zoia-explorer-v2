import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';

// Define the data structure for our custom node
export interface ModuleNodeData extends Record<string, unknown> {
  label: string;
  typeId: number;
  inputs: number[];  // List of port indices used as inputs (destinations)
  outputs: number[]; // List of port indices used as outputs (sources)
  color: number;     // Color index
}

export type ModuleNode = Node<ModuleNodeData>;

const ModuleNode = ({ data }: NodeProps<ModuleNode>) => {
  return (
    <div 
      className="px-4 py-2 shadow-md rounded-md border-2 min-w-[150px]"
      style={{
        backgroundColor: '#1f2937', // gray-800
        borderColor: getColorHex(data.color),
        color: 'white'
      }}
    >
      <div className="flex flex-col">
        <div className="text-xs font-bold mb-2 text-center uppercase tracking-wider opacity-70">
          {data.label}
        </div>
        
        <div className="flex justify-between items-center relative h-full min-h-[40px]">
          {/* Inputs on the Left */}
          <div className="flex flex-col space-y-2 absolute -left-3 top-2">
            {data.inputs.map((portIndex) => (
              <div key={`in-${portIndex}`} className="relative group">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`${portIndex}`} // The ID matches the port index
                  className="w-3 h-3 !bg-blue-500 border-2 border-white"
                />
                {/* Tooltip for port index */}
                <span className="absolute left-4 top-0 text-[10px] bg-black px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  In: {portIndex}
                </span>
              </div>
            ))}
          </div>

          {/* Center Content (placeholder for params or value) */}
          <div className="flex-1 text-center text-xs text-gray-400">
             ID: {data.typeId}
          </div>

          {/* Outputs on the Right */}
          <div className="flex flex-col space-y-2 absolute -right-3 top-2">
            {data.outputs.map((portIndex) => (
              <div key={`out-${portIndex}`} className="relative group">
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${portIndex}`} // The ID matches the port index
                  className="w-3 h-3 !bg-green-500 border-2 border-white"
                />
                 {/* Tooltip for port index */}
                 <span className="absolute right-4 top-0 text-[10px] bg-black px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  Out: {portIndex}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
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
