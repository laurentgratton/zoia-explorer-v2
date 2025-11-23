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

import { getModuleDefinition } from '@/lib/zoia/moduleLib';
import { usePatchStore } from '@/store/patchStore';
import { Connection } from '@/lib/zoia/types';
import ModuleNode, { ModuleNodeData } from './ModuleNode';
import StarredSection from './StarredSection';

// Define custom node types
const nodeTypes = {
  moduleNode: ModuleNode,
};

const GRID_SPACING_X = 150;
const GRID_SPACING_Y = 120;

export default function NodeGraph() {
  const patch = usePatchStore((state) => state.patch);
  const activePage = usePatchStore((state) => state.activePage);
  const updateModulePosition = usePatchStore((state) => state.updateModulePosition);
  const setSelectedModuleIndex = usePatchStore((state) => state.setSelectedModuleIndex);
  const addConnection = usePatchStore((state) => state.addConnection);
  const removeConnection = usePatchStore((state) => state.removeConnection);
  const removeModule = usePatchStore((state) => state.removeModule);
  
  // Local React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
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

    // Filter modules for current page
    const pageModules = patch.modules.filter(m => m.page === activePage);
    const activeModuleIndices = new Set(pageModules.map(m => m.index));

    // 1. Calculate used ports for each module
    const moduleInputs = new Map<number, Set<number>>();
    const moduleOutputs = new Map<number, Set<number>>();

    patch.connections.forEach(conn => {
      // Source is Output
      if (activeModuleIndices.has(conn.sourceModuleIndex)) {
        if (!moduleOutputs.has(conn.sourceModuleIndex)) moduleOutputs.set(conn.sourceModuleIndex, new Set());
        moduleOutputs.get(conn.sourceModuleIndex)?.add(conn.sourcePortIndex);
      }

      // Dest is Input
      if (activeModuleIndices.has(conn.destModuleIndex)) {
        if (!moduleInputs.has(conn.destModuleIndex)) moduleInputs.set(conn.destModuleIndex, new Set());
        moduleInputs.get(conn.destModuleIndex)?.add(conn.destPortIndex);
      }
    });

    // 2. Create Nodes
    const newNodes: Node[] = pageModules.map((mod) => {
      const gridX = mod.gridPosition % 8; // 8 columns
      const gridY = Math.floor(mod.gridPosition / 8); // 5 rows usually
      
      const def = getModuleDefinition(mod.typeId);
      // Use custom name if present, otherwise fallback to Definition name, then ID
      // Clean up null strings if any
      const safeName = mod.name?.replace(/\0/g, '').trim();
      const label = safeName || def?.name || `Module ${mod.index}`;

      return {
        id: mod.index.toString(),
        type: 'moduleNode',
        position: { 
          x: gridX * GRID_SPACING_X + 50,
          y: gridY * GRID_SPACING_Y + 50
        },
        data: {
          label,
          typeId: mod.typeId,
          type: getModuleDefinition(mod.typeId)?.name || 'Unknown',
          inputs: Array.from(moduleInputs.get(mod.index) || []).sort((a, b) => a - b),
          outputs: Array.from(moduleOutputs.get(mod.index) || []).sort((a, b) => a - b),
          color: mod.color
        } as ModuleNodeData
      };
    });

    // 3. Create Edges (only if BOTH nodes are on active page)
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

  }, [patch, activePage, setNodes, setEdges]);

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
        onNodeClick={onNodeClick}
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
      <StarredSection />
    </div>
  );
}
