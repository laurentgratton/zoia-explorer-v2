import React, { useEffect, useCallback } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  Node,
  Edge,
  NodeChange,
  OnConnect,
  OnEdgesDelete,
  OnNodesDelete
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {getModuleDefinition, hasEuroModules} from '@/lib/zoia/moduleLib';
import { usePatchStore } from '@/store/patchStore';
import { Connection } from '@/lib/zoia/types';
import ModuleNode, { ModuleNodeData } from './ModuleNode';
import StarredSection from './StarredSection';
import GridBorderNode from './GridBorderNode';
import SignalSection from "@/components/editor/SignalPath";

// Define custom node types
const nodeTypes = {
  moduleNode: ModuleNode,
  gridBorder: GridBorderNode,
};

const GRID_SPACING_X = 68;
const GRID_SPACING_Y = 68;

const SYSTEM_COORDINATES: Record<number, {x: number, y: number}> = {
  // Right Column
  93: { x: 9, y: -1 }, // Euro Audio In 1
  94: { x: 9, y: 0 }, // Euro Audio In 2
  95: { x: 9, y: 1 }, // Euro Audio Out 1
  96: { x: 9, y: 2 }, // Euro Audio Out 2
  92: { x: 9, y: 3 }, // Euro Headphone Amp
  
  // Bottom Row - CV In (Cols 0-3)
  88: { x: 0, y: 6 }, // Euro CV In 1
  89: { x: 1, y: 6 }, // Euro CV In 2
  90: { x: 2, y: 6 }, // Euro CV In 3
  91: { x: 3, y: 6 }, // Euro CV In 4
  
  // Bottom Row - CV Out (Cols 4-7)
  99: { x: 4, y: 6 }, // Euro CV Out 1
  100: { x: 5, y: 6 }, // Euro CV Out 2
  101: { x: 6, y: 6 }, // Euro CV Out 3
  87: { x: 7, y: 6 }, // Euro CV Out 4

  // Bottom Left
  97: { x: -3, y: 7 }, // Euro Pushbutton 1
  98: { x: -2, y: 7 }, // Euro Pushbutton 2
};

export default function NodeGraph() {
  const patch = usePatchStore((state) => state.patch);
  const activePage = usePatchStore((state) => state.activePage);
  const showSystemModules = usePatchStore((state) => state.showSystemModules);
  const toggleSystemModules = usePatchStore((state) => state.toggleSystemModules);
  const updateModulePosition = usePatchStore((state) => state.updateModulePosition);
  const setSelectedModuleIndex = usePatchStore((state) => state.setSelectedModuleIndex);
  const addConnection = usePatchStore((state) => state.addConnection);
  const removeConnection = usePatchStore((state) => state.removeConnection);
  const removeModule = usePatchStore((state) => state.removeModule);
  
  // Local React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    const index = parseInt(node.id, 10);
    if (!isNaN(index)) {
        setSelectedModuleIndex(index);
    }
  }, [setSelectedModuleIndex]);

  const onConnect: OnConnect = useCallback(
    (params) => {
      if (!params.source || !params.target || !params.sourceHandle || !params.targetHandle) return;

      const sourceMod = parseInt(params.source);
      const sourcePort = parseInt(params.sourceHandle);
      const destMod = parseInt(params.target);
      const destPort = parseInt(params.targetHandle);

      if (isNaN(sourceMod) || isNaN(sourcePort) || isNaN(destMod) || isNaN(destPort)) return;

      const newConn: Connection = {
        sourceModuleIndex: sourceMod,
        sourcePortIndex: sourcePort,
        destModuleIndex: destMod,
        destPortIndex: destPort,
        strength: 10000 // Default strength
      };

      addConnection(newConn);
    },
    [addConnection]
  );

  const onEdgesDelete: OnEdgesDelete = useCallback(
    (edgesToDelete) => {
      edgesToDelete.forEach((edge) => {
        // Parse ID format: e-SRC-SRCPORT-DST-DSTPORT
        const parts = edge.id.split('-');
        if (parts.length !== 5) return; 

        const sourceMod = parseInt(parts[1]);
        const sourcePort = parseInt(parts[2]);
        const destMod = parseInt(parts[3]);
        const destPort = parseInt(parts[4]);

        if (!isNaN(sourceMod)) {
            removeConnection(sourceMod, sourcePort, destMod, destPort);
        }
      });
    },
    [removeConnection]
  );

  const onNodesDelete: OnNodesDelete = useCallback(
    (nodesToDelete) => {
      const indices = nodesToDelete
        .map(n => parseInt(n.id, 10))
        .filter(id => !isNaN(id))
        .sort((a, b) => b - a); // Descending to prevent index shifting issues

      indices.forEach(index => {
        removeModule(index);
      });
    },
    [removeModule]
  );

  // Transform Patch -> React Flow Nodes/Edges
  useEffect(() => {
    if (!patch) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const isSystemModule = (typeId: number) => {
        return Object.prototype.hasOwnProperty.call(SYSTEM_COORDINATES, typeId);
    };

    const visibleModules = patch.modules.filter(m => {
        if (showSystemModules && isSystemModule(m.typeId)) return true;
        // Normal modules on active page, excluding system modules
        return m.page === activePage && !isSystemModule(m.typeId);
    });

    const activeModuleIndices = new Set(visibleModules.map(m => m.index));

    // 2. Create Nodes
    const newNodes: Node[] = visibleModules.map((mod) => {
      let gridX, gridY, draggable;
      
      if (SYSTEM_COORDINATES[mod.typeId]) {
         gridX = SYSTEM_COORDINATES[mod.typeId].x;
         gridY = SYSTEM_COORDINATES[mod.typeId].y;
         draggable = false;
      } else {
         const safeGridPos = mod.gridPosition;
         gridX = safeGridPos % 8; 
         gridY = Math.floor(safeGridPos / 8); 
         draggable = true;
      }
      
      const def = getModuleDefinition(mod.typeId);
      // Use custom name if present, otherwise fallback to Definition name, then ID
      // Clean up null strings if any
      const safeName = mod.name?.replace(/\0/g, '').trim();
      const label = safeName || def?.name || `Module ${mod.index}`;

      return {
        id: mod.index.toString(),
        type: 'moduleNode',
        draggable,
        position: { 
          x: gridX * GRID_SPACING_X + 50,
          y: gridY * GRID_SPACING_Y + 50
        },
        data: {
          label,
          typeId: mod.typeId,
          type: getModuleDefinition(mod.typeId)?.name || 'Unknown',
          color: mod.color,
          options: Array.from(mod.options || []), // Ensure it's a standard array
          gridX,
          gridY,
          identifier: mod.index,
        } as ModuleNodeData
      };
    });

    // Add Grid Border Node
     newNodes.unshift({
         id: 'grid-border',
         type: 'gridBorder',
         position: { x: 50, y: 50 },
         draggable: false,
         selectable: false,
         data: { label: '' }
     });

    // 3. Create Edges (only if BOTH nodes are visible)
    const newEdges: Edge[] = patch.connections
      .filter(conn => activeModuleIndices.has(conn.sourceModuleIndex) && activeModuleIndices.has(conn.destModuleIndex))
      .map((conn) => {
        const edgeId = `e-${conn.sourceModuleIndex}-${conn.sourcePortIndex}-${conn.destModuleIndex}-${conn.destPortIndex}`;
        return {
          id: edgeId,
          source: conn.sourceModuleIndex.toString(),
          sourceHandle: conn.sourcePortIndex.toString(),
          target: conn.destModuleIndex.toString(),
          targetHandle: conn.destPortIndex.toString(),
          animated: false, 
          style: { stroke: '#6b7280' }
        };
      });

    setNodes(newNodes);
    setEdges(newEdges);

  }, [patch, activePage, showSystemModules, setNodes, setEdges]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => onNodesChange(changes),
    [onNodesChange]
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!patch) return;

      const draggedIndex = parseInt(node.id);
      
      // Calculate intended grid position
      const rawGridX = Math.round((node.position.x - 50) / GRID_SPACING_X);
      const rawGridY = Math.round((node.position.y - 50) / GRID_SPACING_Y);
      
      // Clamp to grid (8 columns)
      // Rows are dynamic but let's assume at least 0
      const targetX = Math.max(0, Math.min(7, rawGridX));
      const targetY = Math.max(0, rawGridY);
      
      let finalPos = targetY * 8 + targetX;

      // Collision Detection
      // Get all OTHER module positions ON CURRENT PAGE
      const occupiedPositions = new Set(
        patch.modules
          .filter(m => m.page === activePage && m.index !== draggedIndex)
          .map(m => m.gridPosition)
      );

      // If target is occupied, find nearest empty slot
      if (occupiedPositions.has(finalPos)) {
        // Simple linear search for nearest empty starting from target
        // Spiral or alternating search would be better but linear is okay for small grids
        let offset = 1;
        let found = false;
        
        // Safety limit 
        const MAX_POS = 400; 

        while (!found && offset < 100) {
           // Check +offset
           const nextPos = finalPos + offset;
           if (nextPos < MAX_POS && !occupiedPositions.has(nextPos)) {
             finalPos = nextPos;
             found = true;
             break;
           }
           // Check -offset
           const prevPos = finalPos - offset;
           if (prevPos >= 0 && !occupiedPositions.has(prevPos)) {
             finalPos = prevPos;
             found = true;
             break;
           }
           offset++;
        }
      }
      
      // Update store
      updateModulePosition(draggedIndex, finalPos);
    },
    [patch, updateModulePosition, activePage]
  );

  if (!patch) return null;

  return (
    <div className="w-full h-full bg-gray-900 relative overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeDoubleClick}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onNodesDelete={onNodesDelete}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-900"
      >
        <Background color="#374151" gap={20} />
        <Controls />
      </ReactFlow>

      { hasEuroModules(patch.modules) && <div className="absolute bottom-4 left-4 z-10">
        <button
          aria-label="Toggle Euroburo Modules"
          title="Toggle Euroburo Modules"
          onClick={toggleSystemModules}
          className={`p-2 rounded-full font-bold shadow-lg ml-8 transition-colors ${
            showSystemModules ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          EURO
        </button>
      </div> }

      <StarredSection />
      <SignalSection />
    </div>
  );
}
