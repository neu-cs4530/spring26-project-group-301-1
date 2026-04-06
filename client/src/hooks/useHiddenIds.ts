import { useEffect, useMemo, useState } from "react";

function readHiddenIds(storageKey: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return new Set();

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();

    return new Set(parsed.filter((value): value is string => typeof value === "string"));
  } catch {
    return new Set();
  }
}

interface UseHiddenIdsOptions {
  storagePrefix: string;
  entityId: string;
}

/**
 * Keeps a per-entity set of hidden item IDs persisted in localStorage.
 */
export default function useHiddenIds({ storagePrefix, entityId }: UseHiddenIdsOptions) {
  const storageKey = useMemo(() => `${storagePrefix}:${entityId}`, [storagePrefix, entityId]);
  const [hiddenIdsByEntity, setHiddenIdsByEntity] = useState<Record<string, Set<string>>>(() => ({
    [entityId]: entityId ? readHiddenIds(storageKey) : new Set(),
  }));

  const hiddenIds = useMemo(
    () => hiddenIdsByEntity[entityId] ?? (entityId ? readHiddenIds(storageKey) : new Set()),
    [entityId, hiddenIdsByEntity, storageKey],
  );

  useEffect(() => {
    if (!entityId) return;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(Array.from(hiddenIds)));
    } catch {
      // Ignore storage failures and keep UI functional.
    }
  }, [entityId, hiddenIds, storageKey]);

  function hideItem(itemId: string): void {
    if (!entityId) return;

    setHiddenIdsByEntity((existing) => {
      const next = new Set(existing[entityId] ?? hiddenIds);
      next.add(itemId);
      return { ...existing, [entityId]: next };
    });
  }

  function unhideItem(itemId: string): void {
    if (!entityId) return;

    setHiddenIdsByEntity((existing) => {
      const next = new Set(existing[entityId] ?? hiddenIds);
      next.delete(itemId);
      return { ...existing, [entityId]: next };
    });
  }

  return {
    hiddenIds,
    hideItem,
    unhideItem,
  };
}
