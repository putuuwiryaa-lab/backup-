import { useEffect, useRef } from "react";

export function useStepBackNavigation(canStepBack: boolean, onStepBack: () => boolean) {
  const canStepBackRef = useRef(canStepBack);
  const onStepBackRef = useRef(onStepBack);
  const pushedRef = useRef(false);

  canStepBackRef.current = canStepBack;
  onStepBackRef.current = onStepBack;

  useEffect(() => {
    if (canStepBack && !pushedRef.current) {
      window.history.pushState({ analysisStep: true }, "", window.location.href);
      pushedRef.current = true;
    }
    if (!canStepBack) {
      pushedRef.current = false;
    }
  }, [canStepBack]);

  useEffect(() => {
    const onPopState = () => {
      if (!canStepBackRef.current) return;
      const handled = onStepBackRef.current();
      if (handled) {
        window.history.pushState({ analysisStep: true }, "", window.location.href);
        pushedRef.current = true;
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
}
