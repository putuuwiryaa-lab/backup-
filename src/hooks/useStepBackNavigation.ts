import { useEffect, useRef } from "react";

export function useStepBackNavigation(canStepBack: boolean, onStepBack: () => boolean) {
  const canStepBackRef = useRef(canStepBack);
  const onStepBackRef = useRef(onStepBack);
  const pushedRef = useRef(false);

  canStepBackRef.current = canStepBack;
  onStepBackRef.current = onStepBack;

  useEffect(() => {
    if (!canStepBack) {
      pushedRef.current = false;
      return;
    }

    if (pushedRef.current) return;

    window.history.pushState({ analysisStep: true }, "", window.location.href);
    pushedRef.current = true;
  }, [canStepBack]);

  useEffect(() => {
    const onPopState = () => {
      if (!canStepBackRef.current) return;

      pushedRef.current = false;
      onStepBackRef.current();
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
}
