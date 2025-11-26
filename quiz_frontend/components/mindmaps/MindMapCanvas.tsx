'use client';

import { useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, Edge, MiniMap, Node, MarkerType, NodeMouseHandler } from 'reactflow';
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

const BASE_RADIUS = 180;

const importanceToDepth = (node: RawNode) => {
  if (typeof node.depth === 'number') return node.depth;
  const importance = (node.importance as string | undefined)?.toLowerCase();
  if (importance === 'core') return 0;
  if (importance === 'supporting') return 1;
  return 2;
};

const assignPositions = (nodes: RawNode[]) => {
  const depthMap = new Map<number, RawNode[]>();
  nodes.forEach((node) => {
    const depth = Math.max(0, importanceToDepth(node));
    const list = depthMap.get(depth) ?? [];
    list.push(node);
    depthMap.set(depth, list);
  });

  const positions = new Map<string, { x: number; y: number }>();

  Array.from(depthMap.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([depth, layerNodes]) => {
      if (!layerNodes.length) return;
      if (depth === 0) {
        const root = layerNodes[0];
        const id = String(root.id ?? `root-${root.label ?? 'center'}`);
        positions.set(id, { x: 0, y: 0 });
        layerNodes.slice(1).forEach((node, index) => {
          const angle = (index / layerNodes.length) * Math.PI * 2;
          positions.set(String(node.id ?? `${id}-${index}`), {
            x: Math.cos(angle) * (BASE_RADIUS * 0.6),
            y: Math.sin(angle) * (BASE_RADIUS * 0.6),
          });
        });
        return;
      }

      const radius = BASE_RADIUS * depth + 60;
      layerNodes.forEach((node, index) => {
        const angle = (index / layerNodes.length) * Math.PI * 2;
        positions.set(String(node.id ?? `node-${depth}-${index}`), {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        });
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

    const positions = assignPositions(nodes);
    return nodes.map((node, index) => {
      const id = String(node.id ?? `node-${index}`);
      const position =
        positions.get(id) ??
        {
          x: Math.cos(index) * BASE_RADIUS,
          y: Math.sin(index) * BASE_RADIUS,
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
        type: 'smoothstep',
        animated: kind === 'flow',
        style: {
          stroke,
          strokeWidth: kind === 'emphasis' ? 3 : 2,
          opacity: edgeOpacity,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: stroke,
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
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.2}
          maxZoom={1.5}
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
            <span className="w-3 h-px bg-[#94A3B8]" />
            <span className="flex-1">Arrow = parent → child</span>
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

