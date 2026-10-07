import { useCallback, useRef } from "react";

/**
 * React keys for the properties of an object that survive renaming a property. Keyed by name, a
 * renamed property (e.g. its key derived from a new label) would mount a fresh editor and lose its
 * state, collapsing the field the user is working in.
 */
export function useStableKeys() {
  const keys = useRef(new Map<string, string>());
  const next = useRef(0);

  /** The key of the property `name`, assigned on first use. */
  const keyOf = useCallback((name: string) => {
    let key = keys.current.get(name);
    if (key === undefined) {
      key = `property-${next.current++}`;
      keys.current.set(name, key);
    }
    return key;
  }, []);

  /** Moves the key of `oldName` to `newName`; call it before the rename reaches the schema. */
  const rename = useCallback((oldName: string, newName: string) => {
    const key = keys.current.get(oldName);
    if (key === undefined || oldName === newName) return;
    keys.current.delete(oldName);
    keys.current.set(newName, key);
  }, []);

  return { keyOf, rename };
}
