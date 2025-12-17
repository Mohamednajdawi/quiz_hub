'use client';

import { useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  MiniMap,
  Node,
  MarkerType,
  NodeMouseHandler,
  Position,
} from 'reactflow';
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

interface MindMapCanvasFlowProps {
  nodes: RawNode[];
  edges: RawEdge[];
  centralIdea: string;
}

const LEVEL_SPACING = 400;
const NODE_SPACING = 120;
const NODE_HEIGHT = 100;
const START_X = 100;

const importanceToDepth = (node: RawNode) => {
  if (typeof node.depth === 'number') return node.depth;
  const importance = (node.importance as string | undefined)?.toLowerCase();
  if (importance === 'core') return 0;
  if (importance === 'supporting') return 1;
  return 2;
};

const assignPositions = (nodes: RawNode[], edges: RawEdge[]): Map<string, { x: number; y: number }> => {
  const positions = new Map<string, { x: number; y: number }>();

  const nodeIdMap = new Map<string, RawNode>();
  nodes.forEach((node, index) => {
    const id = String(node.id ?? `node-${index}`);
    nodeIdMap.set(id, node);
  });

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

  const nodeDepth = new Map<string, number>();
  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [];

  nodes.forEach((node, index) => {
    const id = String(node.id ?? `node-${index}`);
    const depth = importanceToDepth(node);
    if (depth === 0 || (parentsMap.get(id)?.length ?? 0) === 0) {
      nodeDepth.set(id, 0);
      queue.push({ id, depth: 0 });
      visited.add(id);
    }
  });

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

  nodes.forEach((node, index) => {
    const id = String(node.id ?? `node-${index}`);
    if (!nodeDepth.has(id)) {
      nodeDepth.set(id, importanceToDepth(node));
    }
  });

  const depthMap = new Map<number, string[]>();
  nodeDepth.forEach((depth, id) => {
    if (!depthMap.has(depth)) depthMap.set(depth, []);
    depthMap.get(depth)!.push(id);
  });

  Array.from(depthMap.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([depth, nodeIds]) => {
      const x = START_X + depth * LEVEL_SPACING;
      const totalHeight = nodeIds.length * (NODE_HEIGHT + NODE_SPACING) - NODE_SPACING;
      const startY = -totalHeight / 2;

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
            label: undefined,
            kind: 'connection',
          });
        }
      });
    }
  });

  return edges;
};

export function MindMapCanvasFlow({ nodes, edges, centralIdea }: MindMapCanvasFlowProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

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

    edges.forEach((edge) => {
      const source = String(edge.source);
      const target = String(edge.target);

      if (!childrenOf.has(source)) childrenOf.set(source, []);
      if (!parentsOf.has(target)) parentsOf.set(target, []);

      childrenOf.get(source)!.push(target);
      parentsOf.get(target)!.push(source);
    });

    nodes.forEach((node, index) => {
      const id = String(node.id ?? `node-${index}`);
      if (!parentsOf.has(id)) parentsOf.set(id, []);
      if (!childrenOf.has(id)) childrenOf.set(id, []);

      const parents = node.parents?.map((p) => String(p)) ?? [];
      const children = node.children?.map((c) => String(c)) ?? [];

      parents.forEach((pid) => {
        if (!parentsOf.get(id)!.includes(pid)) {
          parentsOf.get(id)!.push(pid);
        }
        if (!childrenOf.has(pid)) childrenOf.set(pid, []);
        if (!childrenOf.get(pid)!.includes(id)) {
          childrenOf.get(pid)!.push(id);
        }
      });

      children.forEach((cid) => {
        if (!childrenOf.get(id)!.includes(cid)) {
          childrenOf.get(id)!.push(cid);
        }
        if (!parentsOf.has(cid)) parentsOf.set(cid, []);
        if (!parentsOf.get(cid)!.includes(id)) {
          parentsOf.get(cid)!.push(id);
        }
      });
    });

    return { parentsOf, childrenOf };
  }, [nodes, edges]);

  const visibleNodeIds = useMemo(() => {
    const visible = new Set<string>();

    nodes.forEach((node, index) => {
      const id = String(node.id ?? `node-${index}`);
      const depth = importanceToDepth(node);
      if (depth === 0 || depth === 1) {
        visible.add(id);
      }
    });

    expandedNodes.forEach((expandedId: string) => {
      visible.add(expandedId);
      const children = adjacency.childrenOf.get(expandedId) ?? [];
      children.forEach((childId: string) => visible.add(childId));
    });

    const addAncestors = (nodeId: string) => {
      const parents = adjacency.parentsOf.get(nodeId) ?? [];
      parents.forEach((parentId: string) => {
        if (!visible.has(parentId)) {
          visible.add(parentId);
          addAncestors(parentId);
        }
      });
    };

    Array.from(visible).forEach(addAncestors);

    return visible;
  }, [nodes, expandedNodes, adjacency]);

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
            background: '#020617',
            borderColor: '#38BDF8',
            color: '#E2E8F0',
            width: 260,
            padding: 12,
          },
        },
      ];
    }

    const visibleNodes = nodes.filter((node, index) => {
      const id = String(node.id ?? `node-${index}`);
      return visibleNodeIds.has(id);
    });

    const visibleEdges = edges.filter((edge) => {
      const source = String(edge.source);
      const target = String(edge.target);
      return visibleNodeIds.has(source) && visibleNodeIds.has(target);
    });

    const positions = assignPositions(visibleNodes, visibleEdges);
    return visibleNodes.map((node, index) => {
      const id = String(node.id ?? `node-${index}`);
      const position =
        positions.get(id) ?? {
          x: START_X + index * 50,
          y: index * 150,
        };
      const depth = importanceToDepth(node);

      // Theme-aligned colors (match teacher app: dark navy + cyan/sky accents)
      // We intentionally IGNORE any backend-provided node.color to keep a consistent theme.
      const baseBg = '#020617'; // same deep navy used across the teacher app

      const border =
        depth === 0
          ? '#38BDF8' // primary sky accent for root
          : depth === 1
            ? '#0EA5E9' // sky-500 for major branches
            : '#1F2937'; // slate-800 for detail nodes

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
      const borderWidth = isSelected ? 3 : 1.5;
      return {
        id,
        position,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: `${label}${depthSuffix}`,
          definition: node.definition ?? '',
          tags: node.tags ?? [],
        },
        style: {
          background: baseBg,
          borderColor: border,
          color: '#E2E8F0',
          width: 260,
          padding: 12,
          borderWidth,
          borderRadius: 14,
          opacity: baseOpacity,
          backdropFilter: 'blur(12px)',
          boxShadow: isSelected
            ? '0 18px 45px rgba(56,189,248,0.35)'
            : '0 12px 30px rgba(15,23,42,0.65)',
        },
      } satisfies Node;
    });
  }, [adjacency.childrenOf, adjacency.parentsOf, centralIdea, nodes, selectedNodeId, visibleNodeIds, edges]);

  const flowEdges: Edge[] = useMemo(() => {
    const baseEdges = Array.isArray(edges) ? edges : [];
    const fallback = buildFallbackEdgesFromHierarchy(nodes);

    const merged: RawEdge[] = [];
    const seen = new Set<string>();

    const addEdge = (edge: RawEdge) => {
      const key = `${String(edge.source)}->${String(edge.target)}`;
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(edge);
    };

    baseEdges.forEach(addEdge);
    fallback.forEach(addEdge);

    const filteredEdges = merged
      .filter((edge) => {
        const source = String(edge.source);
        const target = String(edge.target);
        return visibleNodeIds.has(source) && visibleNodeIds.has(target);
      })
      .map((edge) => ({
        ...edge,
        label: edge.label && edge.label.toLowerCase() !== 'parent' ? edge.label : undefined,
      }));

    return filteredEdges.map((edge, index) => {
      const id = String(edge.id ?? `edge-${index}`);
      const kind = (edge.kind as string | undefined) ?? 'connection';
      const stroke = kind === 'emphasis' ? '#F97316' : '#38BDF8';
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
          width: 18,
          height: 18,
        },
        labelBgPadding: [6, 4],
        labelBgBorderRadius: 4,
        labelBgStyle: {
          fill: 'rgba(15,23,42,0.96)',
          stroke: '#1f2937',
          strokeWidth: 0.5,
        },
        labelStyle: {
          fill: '#E2E8F0',
          fontWeight: 500,
          fontSize: 10,
        },
      } satisfies Edge;
    });
  }, [edges, nodes, selectedNodeId, visibleNodeIds]);

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    const nodeId = String(node.id);
    const rawNode = nodeIndex.get(nodeId);

    if (!rawNode) {
      setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
      return;
    }

    const depth = importanceToDepth(rawNode);

    if (depth === 1) {
      setExpandedNodes((prev: Set<string>) => {
        const next = new Set(prev);

        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          const l1Nodes = nodes
            .map((n, idx) => ({ node: n, id: String(n.id ?? `node-${idx}`) }))
            .filter(({ node }) => importanceToDepth(node) === 1)
            .map(({ id }) => id);

          l1Nodes.forEach((id: string) => next.delete(id));
          next.add(nodeId);
        }

        return next;
      });
    }

    setSelectedNodeId((prev: string | null) => (prev === nodeId ? null : nodeId));
  };

  const selectedDetails = useMemo(() => {
    if (!selectedNodeId) return null;
    const raw = nodeIndex.get(selectedNodeId);
    if (!raw) return null;

    const depth = importanceToDepth(raw);
    const parents = (adjacency.parentsOf.get(selectedNodeId) ?? []).map((pid: string) => ({
      id: pid,
      label: nodeIndex.get(pid)?.label ?? pid,
    }));
    const children = (adjacency.childrenOf.get(selectedNodeId) ?? []).map((cid: string) => ({
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
      <div className="relative w-full h-[640px] rounded-2xl border border-slate-800 bg-slate-950/90 shadow-inner overflow-hidden">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          fitView
          fitViewOptions={{ padding: 0.2, includeHiddenNodes: false }}
          minZoom={0.2}
          maxZoom={1.75}
          defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
          proOptions={{ hideAttribution: true }}
          onNodeClick={handleNodeClick}
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { strokeWidth: 2 },
          }}
        >
          <Background gap={26} size={1.6} color="#0f172a" variant="dots" />
          <MiniMap
            pannable
            zoomable
            nodeColor={() => '#38BDF8'}
            maskColor="rgba(15,23,42,0.85)"
          />
          <Controls
            position="bottom-right"
            style={{
              background: '#020617',
              borderRadius: 999,
              borderColor: '#1f2937',
              color: '#E2E8F0',
            }}
          />
        </ReactFlow>

        {/* Subtle interaction hint overlay */}
        <div className="pointer-events-none absolute top-3 left-3 rounded-full border border-slate-800/80 bg-slate-950/80 px-3 py-1.5 text-[10px] sm:text-[11px] text-slate-400 shadow-md shadow-black/40 flex items-center gap-2">
          <span className="hidden sm:inline text-slate-500">Mind map</span>
          <span>Drag to pan</span>
          <span className="text-slate-600">•</span>
          <span>Scroll to zoom</span>
          <span className="text-slate-600">•</span>
          <span>Click nodes to focus</span>
        </div>
      </div>

      <div className="text-xs sm:text-sm text-slate-200 border border-slate-800 rounded-xl bg-slate-950/80 px-3 py-2">
        {selectedDetails ? (
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="font-semibold text-slate-50">
                Focus node:{' '}
                <span className="text-sky-300">
                  {selectedDetails.label ?? selectedDetails.id}
                </span>
                <span className="ml-2 inline-flex items-center rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-300">
                  Level {selectedDetails.depth ?? 0}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                <span>
                  <span className="font-medium">Parents:</span>{' '}
                  {selectedDetails.parents.length
                    ? selectedDetails.parents
                        .map((p) => String(p.label ?? p.id))
                        .join(', ')
                    : '—'}
                </span>
                <span className="hidden sm:inline text-slate-600">•</span>
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
            <div className="text-[11px] text-slate-500 mt-1 sm:mt-0">
              Click a node again to clear focus.
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-300">
            <span>
              Click any node in the map to inspect its parents, children, and level in the topic.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MindMapCanvasFlow;


