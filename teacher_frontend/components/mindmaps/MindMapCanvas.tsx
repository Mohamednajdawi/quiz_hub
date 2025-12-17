'use client';

import { useMemo, useState, useRef } from 'react';

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

const buildEdgesFromHierarchy = (nodes: RawNode[]): RawEdge[] => {
  const result: RawEdge[] = [];
  const seen = new Set<string>();

  nodes.forEach((node, idx) => {
    const id = String(node.id ?? `node-${idx}`);

     // From parent -> this node
    (node.parents ?? []).forEach((parent) => {
      const parentId = String(parent);
      const key = `${parentId}->${id}`;
      if (seen.has(key)) return;
      seen.add(key);
      result.push({
        id: key,
        source: parentId,
        target: id,
        kind: 'connection',
      });
    });

    // From this node -> each child
    (node.children ?? []).forEach((child) => {
      const childId = String(child);
      const key = `${id}->${childId}`;
      if (seen.has(key)) return;
      seen.add(key);
      result.push({
        id: key,
        source: id,
        target: childId,
        kind: 'connection',
      });
    });
  });

  return result;
};

const importanceToDepth = (node: RawNode) => {
  if (typeof node.depth === 'number') return node.depth;
  const importance = (node.importance as string | undefined)?.toLowerCase();
  if (importance === 'core') return 0;
  if (importance === 'supporting') return 1;
  return 2;
};

export function MindMapCanvas({ nodes, edges, centralIdea }: MindMapCanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Map<string, HTMLElement | null>>(new Map());

  const effectiveEdges = useMemo<RawEdge[]>(() => {
    const explicit = Array.isArray(edges) ? edges : [];
    const inferred = buildEdgesFromHierarchy(nodes);

    const merged: RawEdge[] = [];
    const seen = new Set<string>();

    const addEdge = (edge: RawEdge) => {
      const key = `${String(edge.source)}->${String(edge.target)}`;
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(edge);
    };

    explicit.forEach(addEdge);
    inferred.forEach(addEdge);

    return merged;
  }, [edges, nodes]);

  const { levels, nodeIndex, adjacency } = useMemo(() => {
    const index = new Map<string, RawNode>();
    const parentsOf = new Map<string, string[]>();
    const childrenOf = new Map<string, string[]>();

    nodes.forEach((node, idx) => {
      const id = String(node.id ?? `node-${idx}`);
      index.set(id, node);
      if (!parentsOf.has(id)) parentsOf.set(id, []);
      if (!childrenOf.has(id)) childrenOf.set(id, []);
    });

    effectiveEdges.forEach((edge) => {
      const source = String(edge.source);
      const target = String(edge.target);
      if (!childrenOf.has(source)) childrenOf.set(source, []);
      if (!parentsOf.has(target)) parentsOf.set(target, []);
      childrenOf.get(source)!.push(target);
      parentsOf.get(target)!.push(source);
    });

    nodes.forEach((node, idx) => {
      const id = String(node.id ?? `node-${idx}`);
      (node.parents ?? []).forEach((p) => {
        const pid = String(p);
        if (!index.has(pid)) return;
        if (!parentsOf.has(id)) parentsOf.set(id, []);
        if (!childrenOf.has(pid)) childrenOf.set(pid, []);
        if (!parentsOf.get(id)!.includes(pid)) parentsOf.get(id)!.push(pid);
        if (!childrenOf.get(pid)!.includes(id)) childrenOf.get(pid)!.push(id);
      });
      (node.children ?? []).forEach((c) => {
        const cid = String(c);
        if (!index.has(cid)) return;
        if (!childrenOf.has(id)) childrenOf.set(id, []);
        if (!parentsOf.has(cid)) parentsOf.set(cid, []);
        if (!childrenOf.get(id)!.includes(cid)) childrenOf.get(id)!.push(cid);
        if (!parentsOf.get(cid)!.includes(id)) parentsOf.get(cid)!.push(id);
      });
    });

    const levelMap = new Map<number, string[]>();
    nodes.forEach((node, idx) => {
      const id = String(node.id ?? `node-${idx}`);
      const depth = importanceToDepth(node);
      if (!levelMap.has(depth)) levelMap.set(depth, []);
      levelMap.get(depth)!.push(id);
    });

    const sortedLevels = Array.from(levelMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([depth, ids]) => ({
        depth,
        ids,
      }));

    return {
      levels: sortedLevels,
      nodeIndex: index,
      adjacency: { parentsOf, childrenOf },
    };
  }, [nodes, effectiveEdges]);

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
      definition: raw.definition,
      tags: raw.tags ?? [],
    };
  }, [adjacency.childrenOf, adjacency.parentsOf, nodeIndex, selectedNodeId]);

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative w-full h-[640px] rounded-2xl border border-slate-800 bg-slate-950/80 shadow-inner overflow-x-auto overflow-y-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#1e293b_0,_transparent_55%),radial-gradient(circle_at_bottom,_#020617_0,_transparent_55%)] opacity-60 pointer-events-none" />

        <div className="relative h-full flex items-stretch gap-6 px-6 py-6 min-w-max">
          {/* Central idea column */}
          <div className="flex flex-col items-center justify-center pr-4 border-r border-slate-800/60 mr-2">
            <div className="px-4 py-3 rounded-2xl bg-sky-500/10 border border-sky-400/60 shadow-lg shadow-sky-900/40 max-w-xs text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-sky-300 mb-1">
                Central idea
              </p>
              <p className="text-sm font-semibold text-slate-50">
                {centralIdea || 'Mind map overview'}
              </p>
            </div>
          </div>

          {/* Levels */}
          <div className="flex-1 flex items-stretch gap-6">
            {levels.map((level) => (
              <div
                key={level.depth}
                className="flex flex-col items-stretch justify-center gap-4 min-w-[220px]"
              >
                <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  {level.depth === 0
                    ? 'Root'
                    : level.depth === 1
                      ? 'Major branches'
                      : `Details (L${level.depth})`}
                </div>
                {level.ids.length === 0 ? (
                  <div className="h-24 rounded-xl border border-dashed border-slate-800/80 flex items-center justify-center text-[11px] text-slate-600">
                    No nodes at this level
                  </div>
                ) : (
                  level.ids.map((id) => {
                    const node = nodeIndex.get(id);
                    if (!node) return null;

                    const depth = importanceToDepth(node);
                    const baseColor =
                      depth === 0
                        ? 'from-indigo-500/90 to-sky-500/90'
                        : depth === 1
                          ? 'from-sky-500/90 to-cyan-400/90'
                          : 'from-slate-500/80 to-slate-400/80';

                    const isSelected = selectedNodeId === id;
                    const label =
                      (node.label as string | undefined) ??
                      (typeof node.id === 'string' || typeof node.id === 'number'
                        ? String(node.id)
                        : `Node ${id}`);

                    return (
                      <div
                        key={id}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          setSelectedNodeId((prev) => (prev === id ? null : String(id)))
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedNodeId((prev) => (prev === id ? null : String(id)));
                          }
                        }}
                        ref={(el) => {
                          nodeRefs.current.set(String(id), el);
                        }}
                        className={`relative text-left rounded-2xl border px-3 py-3 text-xs transition-all cursor-pointer outline-none ${
                          isSelected
                            ? 'border-sky-400/80 bg-slate-900 shadow-lg shadow-sky-900/40'
                            : 'border-slate-800 bg-slate-900/70 hover:border-sky-500/80 hover:bg-slate-900/90 focus-visible:border-sky-400/80'
                        }`}
                      >
                        <div
                          className={`absolute -left-px top-3 h-6 w-[2px] rounded-full bg-gradient-to-b ${baseColor}`}
                        />
                        <p className="text-[11px] font-semibold text-slate-50 mb-1 line-clamp-2">
                          {label}
                        </p>
                        {node.definition && (
                          <p className="text-[11px] text-slate-400 line-clamp-3">
                            {node.definition}
                          </p>
                        )}
                        {node.tags && node.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {node.tags.slice(0, 3).map((tag) => (
                              <span
                                key={String(tag)}
                                className="inline-flex items-center rounded-full bg-slate-800/80 px-2 py-[1px] text-[10px] font-medium text-slate-300"
                              >
                                {String(tag)}
                              </span>
                            ))}
                            {node.tags.length > 3 && (
                              <span className="text-[10px] text-slate-500">
                                +{node.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Outgoing edges as clickable links to related nodes */}
                        {effectiveEdges && effectiveEdges.length > 0 && (() => {
                          const outgoing = effectiveEdges.filter(
                            (e) => String(e.source) === String(id)
                          );
                          if (!outgoing.length) return null;

                          return (
                            <div className="mt-2 space-y-1">
                              <p className="text-[10px] font-medium text-slate-400">
                                Linked ideas
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {outgoing.map((edge) => {
                                  const targetId = String(edge.target);
                                  const targetNode = nodeIndex.get(targetId);
                                  const targetLabel =
                                    (targetNode?.label as string | undefined) ??
                                    targetId;
                                  return (
                                    <button
                                      key={`${id}-${targetId}-${edge.label ?? ''}`}
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setSelectedNodeId(targetId);
                                      }}
                                      className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 border border-slate-700/80 px-2 py-[1px] text-[10px] text-slate-200 hover:border-sky-400/80 hover:text-sky-200 transition-colors"
                                    >
                                      <span className="text-slate-500">→</span>
                                      <span className="truncate max-w-[120px]">
                                        {targetLabel}
                                      </span>
                                      {edge.label && (
                                        <span className="text-sky-300">
                                          · {String(edge.label)}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selection details */}
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

export default MindMapCanvas;



