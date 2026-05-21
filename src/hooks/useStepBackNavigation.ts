import { useEffect, useRef } from "react";

export function useStepBackNavigation(canStepBack: boolean, onStepBack: () => boolean) {
  const canStepBackRef = useRef(canStepBack);
  const onStepBackRef = useRef(onStepBack);
  const pushedRef = useRef(false);

  canStepBackRef.current = canStepBack;
  onStepBackRef.current = onStepBack;

  const pushStepState = () => {
    if (!canStepBackRef.current || pushedRef.current) return;
    window.history.pushState({ analysisStep: true }, "", window.location.href);
    pushedRef.current = true;
  };

  useEffect(() => {
    if (canStepBack) pushStepState();
    if (!canStepBack) pushedRef.current = false;
  }, [canStepBack]);

  useEffect(() => {
    const onPopState = () => {
      if (!canStepBackRef.current) return;
      pushedRef.current = false;
      const handled = onStepBackRef.current();
      if (!handled) return;

      window.setTimeout(() => {
        pushStepState();
      }, 0);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
}
