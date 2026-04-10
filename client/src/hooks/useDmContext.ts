import { useContext } from "react";
import { DmContext } from "../contexts/DmContext";

/**
 * Custom hook to access the DmContext.
 * @throws if outside a DmContext
 * @returns context information associated with direct messages:
 */
export default function useDmContext() {
  const context = useContext(DmContext);
  if (!context) {
    throw new Error("DmContext is null.");
  }
  return context;
}
