import React, { useEffect, useMemo, useState } from 'react';
import {
  Background, BackgroundVariant, Controls, Handle, Position, ReactFlow,
  useUpdateNodeInternals, useReactFlow, useStore,
  type Node, type NodeProps, type Edge, type Connection as FlowConnection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getModuleDefinition, hasEuroModules } from '@/lib/zoia/moduleLib';
import { getModuleColor, getPreviewPageName } from '@/lib/preview/previewModel';
import type { Module } from '@/lib/zoia/types';
import { usePatchStore } from '@/store/patchStore';
import ModuleDetailsModal from './ModuleDetailsModal';

type CardData = {
  module: Module;
  connectedPorts: number[];
  remote: boolean;
  pageName: string;
};
type CardNode = Node<CardData, 'moduleCard'>;

function ModuleCard({ id, data, selected }: NodeProps<CardNode>) {
  const { module, connectedPorts, remote, pageName } = data;
  const [expanded, setExpanded] = useState(false);
  const updateInternals = useUpdateNodeInternals();
  const selectModule = usePatchStore(s => s.setSelectedModuleIndex);
  const setActivePage = usePatchStore(s => s.setActivePage);
  const updateParameters = usePatchStore(s => s.updateModuleParameters);
  const definition = getModuleDefinition(module.typeId);
  const blocks = definition?.calcBlocks({ blocks: definition.blocks, options: module.options }) ?? [];
  const firstParameter = blocks.findIndex(block => block.hasParameter);
  const shown = blocks.map((block, index) => ({ ...block, index })).filter(block =>
    expanded || block.type === 0 || connectedPorts.includes(block.index) || block.index === firstParameter || block.direction === 1
  );
  const hiddenCount = blocks.length - shown.length;
  const color = getModuleColor(module.color);
  const name = module.name.replace(/\0/g, '').trim() || definition?.name || `Unknown module ${module.typeId}`;

  useEffect(() => {
    updateInternals(id);
  }, [id, expanded, module.options, connectedPorts, updateInternals]);

  return (
    <div
      className={`w-60 rounded-lg border bg-gray-900 text-gray-100 shadow-md ${selected ? 'ring-2 ring-white/50' : ''}`}
      style={{ borderColor: color }}
      aria-label={`${name} module`}
    >
      <div className="module-card-heading px-4 py-3 cursor-grab border-b border-white/10 rounded-t-lg" style={{ backgroundColor: `${color}12` }}>
        <button className="nodrag text-left text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-white" onClick={() => selectModule(module.index)}>
          {name}
        </button>
        <div className="text-[11px] text-gray-400 mt-1">{definition?.name ?? `Type ${module.typeId}`} · #{module.index + 1}</div>
      </div>
      {remote && definition?.category === 'System' && <p className="px-4 py-2 text-xs text-sky-300">System · connected endpoint</p>}
      {remote && definition?.category !== 'System' && (
        <button className="nodrag w-full px-4 py-2 text-left text-xs text-sky-300 hover:bg-gray-800" onClick={event => { event.stopPropagation(); setActivePage(module.page); selectModule(null); }}>
          Open {pageName} ↗
        </button>
      )}
      <div className="py-2">
        {shown.map(block => (
          <div key={block.index} className="relative px-4 py-1.5 text-xs">
            <Handle
              id={String(block.index)}
              type={block.direction === 0 ? 'target' : 'source'}
              position={block.direction === 0 ? Position.Left : Position.Right}
              title={`${block.name} · ${block.type === 0 ? 'Audio' : 'CV'} ${block.direction === 0 ? 'input' : 'output'}`}
              style={{ width: 12, height: 12, background: '#111827', border: `2px solid ${color}`, borderRadius: block.type === 0 ? '50%' : 2, top: 14 }}
            />
            <div className={`flex items-center gap-2 ${block.direction === 1 ? 'justify-end' : ''}`}>
              <span>{block.name}</span>
              <span className="text-[10px] text-gray-500">{block.type === 0 ? 'Audio' : 'CV'}</span>
            </div>
            {block.hasParameter && block.parameterIndex !== undefined && (
              <label className="nodrag nopan flex items-center gap-2 mt-1 text-[10px] text-gray-400" onClick={event => event.stopPropagation()}>
                Bias
                <input
                  aria-label={`${name} ${block.name} bias`}
                  type={block.parameterMax !== undefined ? 'range' : 'number'}
                  min={block.parameterMin ?? 0}
                  max={block.parameterMax ?? 4294967295}
                  step={1}
                  value={module.parameters[block.parameterIndex] ?? 0}
                  className="min-w-0 w-full h-4 accent-violet-400 bg-gray-800 rounded"
                  onChange={event => {
                    const value = Number(event.target.value);
                    if (!Number.isInteger(value) || value < (block.parameterMin ?? 0) || value > (block.parameterMax ?? 4294967295)) return;
                    const parameters = [...module.parameters];
                    parameters[block.parameterIndex!] = value;
                    updateParameters(module.index, parameters);
                  }}
                />
                <output className="tabular-nums">{module.parameters[block.parameterIndex] ?? 0}</output>
              </label>
            )}
          </div>
        ))}
        {!blocks.length && <p className="px-4 py-2 text-xs text-amber-300">Port metadata unavailable. Open details to inspect this module.</p>}
      </div>
      <div className="nodrag flex justify-between gap-2 border-t border-white/10 px-3 py-2 text-xs" onClick={event => event.stopPropagation()}>
        {(hiddenCount > 0 || expanded) ? (
          <button className="text-gray-300 hover:text-white" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Compact' : `+${hiddenCount} CV ports`}
          </button>
        ) : <span className="text-gray-500">All ports shown</span>}
        <button className="text-gray-300 hover:text-white" onClick={() => selectModule(module.index)}>Details</button>
      </div>
    </div>
  );
}

const nodeTypes = { moduleCard: ModuleCard };

function FitCanvas() {
  const { fitView } = useReactFlow();
  const width = useStore(state => state.width);
  const height = useStore(state => state.height);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (width > 0 && height > 0) void fitView({ padding: 0.18, maxZoom: 1 });
    });
    return () => cancelAnimationFrame(frame);
  }, [width, height, fitView]);
  return null;
}

export default function ModuleCanvas() {
  const patch = usePatchStore(s => s.patch);
  const activePage = usePatchStore(s => s.activePage);
  const showSystemModules = usePatchStore(s => s.showSystemModules);
  const toggleSystemModules = usePatchStore(s => s.toggleSystemModules);
  const selectedModuleIndex = usePatchStore(s => s.selectedModuleIndex);
  const selectModule = usePatchStore(s => s.setSelectedModuleIndex);
  const positions = usePatchStore(s => s.moduleCanvasPositions);
  const setPosition = usePatchStore(s => s.setModuleCanvasPosition);
  const addConnection = usePatchStore(s => s.addConnection);

  const { nodes, edges, unresolvedCount } = useMemo(() => {
    if (!patch) return { nodes: [], edges: [], unresolvedCount: 0 };
    const localIndices = new Set(patch.modules.filter(module => {
      const isSystem = getModuleDefinition(module.typeId)?.category === 'System';
      return isSystem ? showSystemModules : module.page === activePage;
    }).map(module => module.index));
    // Include one-hop off-page endpoints so changing pages never hides a cable's destination.
    const visibleIndices = new Set(localIndices);
    const connections = patch.connections.map((connection, index) => ({ ...connection, index }))
      .filter(connection => localIndices.has(connection.sourceModuleIndex) || localIndices.has(connection.destModuleIndex));
    connections.forEach(connection => {
      visibleIndices.add(connection.sourceModuleIndex);
      visibleIndices.add(connection.destModuleIndex);
    });
    const ports = new Map(patch.modules.map(module => {
      const definition = getModuleDefinition(module.typeId);
      return [module.index, definition?.calcBlocks({ blocks: definition.blocks, options: module.options }) ?? []];
    }));
    const columnHeights = [60, 60, 60];
    const nodes: CardNode[] = patch.modules.filter(module => visibleIndices.has(module.index)).map(module => {
      const blocks = ports.get(module.index)!;
      const hasIncoming = connections.some(connection => connection.destModuleIndex === module.index);
      const column = !blocks.some(block => block.direction === 1) ? 2 : !hasIncoming ? 0 : 1;
      const position = { x: 40 + column * 350, y: columnHeights[column] };
      columnHeights[column] += 300;
      return {
        id: String(module.index), type: 'moduleCard', position: positions[module.index] ?? position,
        selected: selectedModuleIndex === module.index,
        dragHandle: '.module-card-heading',
        data: {
          module,
          connectedPorts: connections.flatMap(connection => [
            ...(connection.sourceModuleIndex === module.index ? [connection.sourcePortIndex] : []),
            ...(connection.destModuleIndex === module.index ? [connection.destPortIndex] : []),
          ]),
          remote: !localIndices.has(module.index),
          pageName: getPreviewPageName(patch, module.page),
        },
      };
    });
    let unresolvedCount = 0;
    const edges: Edge[] = connections.flatMap(connection => {
      const source = ports.get(connection.sourceModuleIndex)?.[connection.sourcePortIndex];
      const target = ports.get(connection.destModuleIndex)?.[connection.destPortIndex];
      if (!source || !target || source.direction !== 1 || target.direction !== 0) {
        unresolvedCount++;
        return [];
      }
      return [{
        id: `connection-${connection.index}`,
        source: String(connection.sourceModuleIndex), target: String(connection.destModuleIndex),
        sourceHandle: String(connection.sourcePortIndex), targetHandle: String(connection.destPortIndex),
        type: 'default',
        label: `${connection.strength / 100}%`,
        labelStyle: { fill: '#d1d5db', fontSize: 11 },
        labelBgStyle: { fill: '#111827' },
        style: { stroke: source.type === 0 ? '#a78bfa' : '#22d3ee', strokeWidth: 2, strokeDasharray: source.type === 0 ? undefined : '6 4' },
        data: { destination: connection.destModuleIndex },
      }];
    });
    return { nodes, edges, unresolvedCount };
  }, [patch, activePage, showSystemModules, positions, selectedModuleIndex]);

  useEffect(() => {
    // Keep the initial layout stable when cables are added, pages change, or views switch.
    nodes.forEach(node => {
      if (!positions[Number(node.id)]) setPosition(Number(node.id), node.position);
    });
  }, [nodes, positions, setPosition]);

  function validConnection(connection: FlowConnection | Edge) {
    if (!patch || connection.sourceHandle == null || connection.targetHandle == null) return false;
    const sourceModule = patch.modules.find(module => String(module.index) === connection.source);
    const targetModule = patch.modules.find(module => String(module.index) === connection.target);
    if (!sourceModule || !targetModule) return false;
    const sourceDef = getModuleDefinition(sourceModule.typeId);
    const targetDef = getModuleDefinition(targetModule.typeId);
    const source = sourceDef?.calcBlocks({ blocks: sourceDef.blocks, options: sourceModule.options })[Number(connection.sourceHandle)];
    const target = targetDef?.calcBlocks({ blocks: targetDef.blocks, options: targetModule.options })[Number(connection.targetHandle)];
    return source?.direction === 1 && target?.direction === 0 && !patch.connections.some(existing =>
      existing.sourceModuleIndex === sourceModule.index && existing.sourcePortIndex === Number(connection.sourceHandle) &&
      existing.destModuleIndex === targetModule.index && existing.destPortIndex === Number(connection.targetHandle)
    );
  }

  if (!patch) return null;

  return (
    <div className="absolute inset-0 flex bg-gray-900" aria-label="Modules view">
      <div className="relative min-w-0 flex-1">
        <ReactFlow<CardNode>
          key={`${activePage}-${showSystemModules}`}
          nodes={nodes} edges={edges} nodeTypes={nodeTypes}
          onNodesChange={changes => changes.forEach(change => {
            if (change.type === 'position' && change.position) setPosition(Number(change.id), change.position);
          })}
          onNodeClick={(_, node) => selectModule(Number(node.id))}
          onPaneClick={() => selectModule(null)}
          onEdgeClick={(_, edge) => selectModule(Number(edge.data?.destination))}
          isValidConnection={validConnection}
          onConnect={connection => {
            if (validConnection(connection)) addConnection({
              sourceModuleIndex: Number(connection.source), sourcePortIndex: Number(connection.sourceHandle),
              destModuleIndex: Number(connection.target), destPortIndex: Number(connection.targetHandle), strength: 10000,
            });
          }}
          deleteKeyCode={null}
          fitView fitViewOptions={{ padding: 0.18, maxZoom: 1 }} minZoom={0.15} maxZoom={2}
          colorMode="dark"
        >
          <Background variant={BackgroundVariant.Lines} color="#253041" gap={24} />
          <Controls />
          <FitCanvas />
        </ReactFlow>
        <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center gap-3 text-xs pointer-events-none">
          <span className="rounded bg-gray-900/95 px-3 py-2 text-gray-300">○ Audio · □ CV · Drag a socket to connect</span>
          {hasEuroModules(patch.modules) && <button className="pointer-events-auto rounded bg-gray-800 px-3 py-2 text-gray-200" aria-pressed={showSystemModules} onClick={toggleSystemModules}>EURO {showSystemModules ? 'all' : 'linked'}</button>}
          {unresolvedCount > 0 && <span role="status" className="rounded bg-gray-900 px-3 py-2 text-amber-300">{unresolvedCount} unresolved connections — inspect module details</span>}
        </div>
        {!nodes.length && <p className="absolute top-20 left-6 text-sm text-gray-400">No modules on this page. Add one from the Modules library.</p>}
        <p className="absolute bottom-4 left-16 right-4 text-[11px] text-gray-400 pointer-events-none">Card layout is view-only. Hardware grid unchanged.</p>
      </div>
      {selectedModuleIndex !== null && <ModuleDetailsModal docked />}
    </div>
  );
}
