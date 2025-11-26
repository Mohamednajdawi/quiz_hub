'use client';

import { useMemo } from 'react';
import ReactFlow, { Background, Controls, Edge, MiniMap, Node } from 'reactflow';
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
            label: undefined,
            kind: 'connection',
          });
        }
      });
    }
  });

  return edges;
};

export function MindMapCanvas({ nodes, edges, centralIdea }: MindMapCanvasProps) {
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
      const color = (node.color as string | undefined) ?? '#EEF2FF';
      const border = (node.color as string | undefined) ?? '#6366F1';
      return {
        id,
        position,
        data: {
          label: node.label ?? `Node ${index + 1}`,
          definition: node.definition ?? '',
          tags: node.tags ?? [],
        },
        style: {
          background: color,
          borderColor: border,
          color: '#0f172a',
          width: 240,
          padding: 12,
          borderWidth: 2,
          borderRadius: 12,
          boxShadow: '0 8px 20px rgba(79,70,229,0.08)',
        },
      } satisfies Node;
    });
  }, [centralIdea, nodes]);

  const flowEdges: Edge[] = useMemo(() => {
    const effectiveEdges: RawEdge[] =
      edges && edges.length > 0 ? edges : buildFallbackEdgesFromHierarchy(nodes);

    if (!effectiveEdges.length) return [];

    return effectiveEdges.map((edge, index) => {
      const id = String(edge.id ?? `edge-${index}`);
      const kind = (edge.kind as string | undefined) ?? 'connection';
      const stroke = kind === 'emphasis' ? '#F97316' : '#94A3B8';
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
        },
        labelBgPadding: [6, 4],
        labelBgBorderRadius: 4,
        labelStyle: { fill: '#0f172a', fontWeight: 600 },
      } satisfies Edge;
    });
  }, [edges]);

  return (
    <div className="w-full h-[640px] rounded-2xl border border-gray-200 bg-white shadow-inner overflow-hidden">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} color="#E5E7EB" />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default MindMapCanvas;

