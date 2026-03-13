import { useContext } from "react";
import { DmContext } from "../contexts/DmContext";

export default function useDmContext() {
  const context = useContext(DmContext);
  if (!context) {
    throw new Error("DmContext is null.");
  }
  return context;
}
