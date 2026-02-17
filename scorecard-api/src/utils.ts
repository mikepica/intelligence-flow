/**
 * Builds a nested tree from a flat array of items with parent_id references.
 * Root nodes are those with parent_id === null or whose parent is not in the set.
 */
export function buildTree<T extends { id: number; parent_id: number | null }>(
  items: T[]
): (T & { children: (T & { children: any[] })[] })[] {
  const map = new Map<number, T & { children: (T & { children: any[] })[] }>();
  const roots: (T & { children: (T & { children: any[] })[] })[] = [];

  for (const item of items) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const item of items) {
    const node = map.get(item.id)!;
    if (item.parent_id !== null && map.has(item.parent_id)) {
      map.get(item.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
