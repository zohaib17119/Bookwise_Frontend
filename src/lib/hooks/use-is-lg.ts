import { useSyncExternalStore } from "react";

const LG_QUERY = "(min-width: 1024px)";

function subscribe(callback: () => void) {
  const mediaQuery = window.matchMedia(LG_QUERY);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(LG_QUERY).matches;
}

function getServerSnapshot() {
  return true;
}

export function useIsLg() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
