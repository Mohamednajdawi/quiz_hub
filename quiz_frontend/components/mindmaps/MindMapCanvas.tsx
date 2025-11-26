'use client';

import { useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, Edge, MiniMap, Node, MarkerType, NodeMouseHandler, Position } from 'reactflow';
import 'reactflow/dist/style.css';

interface RawNode {
  id?: string | number;
  label?: string;
  definition?: string;
  importance?: string;
  depth?: number;
  parents?: Array<string | number>;
  children?: Array<string | number>;
  tags?: string[];
  color?: string;
}

interface RawEdge {
  id?: string | number;
  source: string | number;
  target: string | number;
  label?: string;
  kind?: string;
}

interface MindMapCanvasProps {
  nodes: RawNode[];
  edges: RawEdge[];
  centralIdea: string;
}

// Layout constants for hierarchical left-to-right layout
const LEVEL_SPACING = 400; // Horizontal spacing between levels
const NODE_SPACING = 120; // Vertical spacing between nodes in same level
const NODE_HEIGHT = 100; // Approximate height of a node (for calculations)
const START_X = 100; // Starting X position for root level

const importanceToDepth = (node: RawNode) => {
  if (typeof node.depth === 'number') return node.depth;
  const importance = (node.importance as string | undefined)?.toLowerCase();
  if (importance === 'core') return 0;
  if (importance === 'supporting') return 1;
  return 2;
};

/**
 * Assigns hierarchical left-to-right positions to nodes.
 * Root nodes (depth 0) are on the left, children flow to the right.
 */
const assignPositions = (nodes: RawNode[], edges: RawEdge[]): Map<string, { x: number; y: number }> => {
  const positions = new Map<string, { x: number; y: number }>();
  
  // Build node ID map
  const nodeIdMap = new Map<string, RawNode>();
  nodes.forEach((node, index) => {
    const id = String(node.id ?? `node-${index}`);
    nodeIdMap.set(id, node);
  });

  // Build adjacency map from edges
  const childrenMap = new Map<string, string[]>();
  const parentsMap = new Map<string, string[]>();
  
  edges.forEach((edge) => {
    const source = String(edge.source);
    const target = String(edge.target);
    
    if (!childrenMap.has(source)) childrenMap.set(source, []);
    if (!parentsMap.has(target)) parentsMap.set(target, []);
    
    childrenMap.get(source)!.push(target);
    parentsMap.get(target)!.push(source);
  });

  // Also use node.parents/children if edges are missing
  nodes.forEach((node, index) => {
    const id = String(node.id ?? `node-${index}`);
    if (!childrenMap.has(id)) childrenMap.set(id, []);
    if (!parentsMap.has(id)) parentsMap.set(id, []);
    
    (node.parents ?? []).forEach((p) => {
      const parentId = String(p);
      if (nodeIdMap.has(parentId)) {
        if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
        childrenMap.get(parentId)!.push(id);
        parentsMap.get(id)!.push(parentId);
      }
    });
    
    (node.children ?? []).forEach((c) => {
      const childId = String(c);
      if (nodeIdMap.has(childId)) {
        childrenMap.get(id)!.push(childId);
        if (!parentsMap.has(childId)) parentsMap.set(childId, []);
        parentsMap.get(childId)!.push(id);
      }
    });
  });

  // Calculate depth for each node (using BFS from roots)
  const nodeDepth = new Map<string, number>();
  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [];

  // Find root nodes (nodes with no parents or depth 0)
  nodes.forEach((node, index) => {
    const id = String(node.id ?? `node-${index}`);
    const depth = importanceToDepth(node);
    if (depth === 0 || (parentsMap.get(id)?.length ?? 0) === 0) {
      nodeDepth.set(id, 0);
      queue.push({ id, depth: 0 });
      visited.add(id);
    }
  });

  // BFS to assign depths
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    const children = childrenMap.get(id) ?? [];
    children.forEach((childId) => {
      if (!visited.has(childId)) {
        const childNode = nodeIdMap.get(childId);
        const childDepth = childNode ? importanceToDepth(childNode) : depth + 1;
        const finalDepth = Math.max(depth + 1, childDepth);
        nodeDepth.set(childId, finalDepth);
        visited.add(childId);
        queue.push({ id: childId, depth: finalDepth });
      }
    });
  }

  // Assign depth to any remaining nodes
  nodes.forEach((node, index) => {
    const id = String(node.id ?? `node-${index}`);
    if (!nodeDepth.has(id)) {
      nodeDepth.set(id, importanceToDepth(node));
    }
  });

  // Group nodes by depth
  const depthMap = new Map<number, string[]>();
  nodeDepth.forEach((depth, id) => {
    if (!depthMap.has(depth)) depthMap.set(depth, []);
    depthMap.get(depth)!.push(id);
  });

  // Calculate positions: left to right, top to bottom
  const maxDepth = Math.max(...Array.from(depthMap.keys()));
  
  Array.from(depthMap.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([depth, nodeIds]) => {
      const x = START_X + depth * LEVEL_SPACING;
      const totalHeight = nodeIds.length * (NODE_HEIGHT + NODE_SPACING) - NODE_SPACING;
      const startY = -totalHeight / 2; // Center vertically

      nodeIds.forEach((id, index) => {
        const y = startY + index * (NODE_HEIGHT + NODE_SPACING);
        positions.set(id, { x, y });
      });
    });

  return positions;
};

const buildFallbackEdgesFromHierarchy = (nodes: RawNode[]): RawEdge[] => {
  const edges: RawEdge[] = [];
  const nodeIds = new Set<string>(nodes.map((n, index) => String(n.id ?? `node-${index}`)));

  nodes.forEach((node, index) => {
    const id = String(node.id ?? `node-${index}`);
    const parents = node.parents ?? [];

    if (parents.length) {
      parents.forEach((parent) => {
        const parentId = String(parent);
        if (nodeIds.has(parentId)) {
          edges.push({
            id: `auto-${parentId}-${id}`,
            source: parentId,
            target: id,
            label: 'parent',
            kind: 'connection',
          });
        }
      });
    }
  });

  return edges;
};

export function MindMapCanvas({ nodes, edges, centralIdea }: MindMapCanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const nodeIndex = useMemo(() => {
    const map = new Map<string, RawNode>();
    nodes.forEach((node, index) => {
      const id = String(node.id ?? `node-${index}`);
      map.set(id, node);
    });
    return map;
  }, [nodes]);

  const adjacency = useMemo(() => {
    const parentsOf = new Map<string, string[]>();
    const childrenOf = new Map<string, string[]>();

    nodes.forEach((node, index) => {
      const id = String(node.id ?? `node-${index}`);
      const parents = node.parents?.map((p) => String(p)) ?? [];
      const children = node.children?.map((c) => String(c)) ?? [];

      if (!parentsOf.has(id)) parentsOf.set(id, []);
      if (!childrenOf.has(id)) childrenOf.set(id, []);

      parents.forEach((pid) => {
        parentsOf.get(id)!.push(pid);
        if (!childrenOf.has(pid)) childrenOf.set(pid, []);
        childrenOf.get(pid)!.push(id);
      });

      children.forEach((cid) => {
        childrenOf.get(id)!.push(cid);
        if (!parentsOf.has(cid)) parentsOf.set(cid, []);
        parentsOf.get(cid)!.push(id);
      });
    });

    return { parentsOf, childrenOf };
  }, [nodes]);

  const flowNodes: Node[] = useMemo(() => {
    if (!nodes.length) {
      return [
        {
          id: 'root',
          position: { x: 0, y: 0 },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          data: { label: centralIdea, definition: 'Mind map overview' },
          style: {
            background: '#EEF2FF',
            borderColor: '#4F46E5',
            color: '#1F2937',
            width: 220,
            padding: 12,
          },
        },
      ];
    }

    const positions = assignPositions(nodes, edges);
    return nodes.map((node, index) => {
      const id = String(node.id ?? `node-${index}`);
      const position =
        positions.get(id) ??
        {
          x: START_X + index * 50,
          y: index * 150,
        };
      const depth = importanceToDepth(node);
      const color = (node.color as string | undefined) ?? ['#EEF2FF', '#DBEAFE', '#E0F2FE'][Math.min(depth, 2)];
      const border = (node.color as string | undefined) ?? '#6366F1';
      const label =
        (node.label as string | undefined) ??
        (typeof node.id === 'string' || typeof node.id === 'number' ? String(node.id) : `Node ${index + 1}`);
      const depthSuffix = depth > 0 ? ` (L${depth})` : ' (Root)';

      const isSelected = selectedNodeId === id;
      const neighbors = new Set<string>([
        ...(adjacency.parentsOf.get(id) ?? []),
        ...(adjacency.childrenOf.get(id) ?? []),
      ]);
      const isNeighbor = selectedNodeId ? neighbors.has(selectedNodeId) || neighbors.has(id) : false;

      const baseOpacity = selectedNodeId ? (isSelected ? 1 : isNeighbor ? 0.9 : 0.35) : 1;
      const borderWidth = isSelected ? 3 : 2;
      return {
        id,
        position,
        sourcePosition: Position.Right, // Edges leave from right side
        targetPosition: Position.Left, // Edges enter from left side
        data: {
          label: `${label}${depthSuffix}`,
          definition: node.definition ?? '',
          tags: node.tags ?? [],
        },
        style: {
          background: color,
          borderColor: border,
          color: '#0f172a',
          width: 240,
          padding: 12,
          borderWidth,
          borderRadius: 12,
          opacity: baseOpacity,
          boxShadow: isSelected
            ? '0 12px 30px rgba(79,70,229,0.25)'
            : '0 8px 20px rgba(79,70,229,0.08)',
        },
      } satisfies Node;
    });
  }, [adjacency.childrenOf, adjacency.parentsOf, centralIdea, nodes, selectedNodeId]);

  const flowEdges: Edge[] = useMemo(() => {
    const effectiveEdges: RawEdge[] =
      edges && edges.length > 0 ? edges : buildFallbackEdgesFromHierarchy(nodes);

    if (!effectiveEdges.length) return [];

    return effectiveEdges.map((edge, index) => {
      const id = String(edge.id ?? `edge-${index}`);
      const kind = (edge.kind as string | undefined) ?? 'connection';
      const stroke = kind === 'emphasis' ? '#F97316' : '#94A3B8';
      const isAttachedToSelection =
        selectedNodeId &&
        (String(edge.source) === selectedNodeId || String(edge.target) === selectedNodeId);
      const edgeOpacity = selectedNodeId ? (isAttachedToSelection ? 1 : 0.25) : 0.9;
      return {
        id,
        source: String(edge.source),
        target: String(edge.target),
        label: edge.label,
        type: 'smoothstep', // Smooth curved edge for left-to-right flow
        animated: kind === 'flow',
        style: {
          stroke,
          strokeWidth: kind === 'emphasis' ? 3 : 2,
          opacity: edgeOpacity,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: stroke,
          width: 20,
          height: 20,
        },
        labelBgPadding: [6, 4],
        labelBgBorderRadius: 4,
        labelStyle: { fill: '#0f172a', fontWeight: 600 },
      } satisfies Edge;
    });
  }, [edges, nodes, selectedNodeId]);

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    setSelectedNodeId((prev) => (prev === node.id ? null : String(node.id)));
  };

  const selectedDetails = useMemo(() => {
    if (!selectedNodeId) return null;
    const raw = nodeIndex.get(selectedNodeId);
    if (!raw) return null;

    const depth = importanceToDepth(raw);
    const parents = (adjacency.parentsOf.get(selectedNodeId) ?? []).map((pid) => ({
      id: pid,
      label: nodeIndex.get(pid)?.label ?? pid,
    }));
    const children = (adjacency.childrenOf.get(selectedNodeId) ?? []).map((cid) => ({
      id: cid,
      label: nodeIndex.get(cid)?.label ?? cid,
    }));

    return {
      id: selectedNodeId,
      label: raw.label,
      depth,
      parents,
      children,
    };
  }, [adjacency.childrenOf, adjacency.parentsOf, nodeIndex, selectedNodeId]);

  return (
    <div className="space-y-3">
      <div className="relative w-full h-[640px] rounded-2xl border border-gray-200 bg-white shadow-inner overflow-hidden">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          fitView
          fitViewOptions={{ padding: 0.2, includeHiddenNodes: false }}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          proOptions={{ hideAttribution: true }}
          onNodeClick={handleNodeClick}
        >
          <Background gap={24} color="#E5E7EB" />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>

        {/* Legend */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg border border-gray-200 px-3 py-2 text-[11px] text-gray-700 shadow-sm space-y-1">
          <div className="font-semibold text-gray-900">Legend</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#EEF2FF] border border-[#4F46E5]" />
            <span>Root</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#DBEAFE] border border-[#4F46E5]" />
            <span>L1 (major branches)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#E0F2FE] border border-[#4F46E5]" />
            <span>L2+ (details)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-px bg-[#94A3B8] relative">
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[4px] border-l-[#94A3B8] border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent" />
            </span>
            <span className="flex-1">Left → Right: parent to child</span>
          </div>
        </div>
      </div>

      {/* Selection details */}
      <div className="text-xs sm:text-sm text-gray-700 border border-gray-200 rounded-xl bg-white px-3 py-2">
        {selectedDetails ? (
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="font-semibold text-gray-900">
                Focus node:{' '}
                <span className="text-indigo-700">
                  {selectedDetails.label ?? selectedDetails.id}
                </span>
                <span className="ml-2 inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                  Level {selectedDetails.depth ?? 0}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span>
                  <span className="font-medium">Parents:</span>{' '}
                  {selectedDetails.parents.length
                    ? selectedDetails.parents
                        .map((p) => String(p.label ?? p.id))
                        .join(', ')
                    : '—'}
                </span>
                <span className="hidden sm:inline text-gray-300">•</span>
                <span>
                  <span className="font-medium">Children:</span>{' '}
                  {selectedDetails.children.length
                    ? selectedDetails.children
                        .map((c) => String(c.label ?? c.id))
                        .join(', ')
                    : '—'}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-gray-500 mt-1 sm:mt-0">
              Click a node again to clear focus.
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span>
              Click any node in the map to inspect its level, parents, and children.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MindMapCanvas;

