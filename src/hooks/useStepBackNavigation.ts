import { useCallback, useEffect, useRef } from "react";

export function useStepBackNavigation(canStepBack: boolean, onStepBack: () => boolean) {
  const canStepBackRef = useRef(canStepBack);
  const onStepBackRef = useRef(onStepBack);
  const pushedRef = useRef(false);
  const ignoreNextPopRef = useRef(false);

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
      if (ignoreNextPopRef.current) {
        ignoreNextPopRef.current = false;
        return;
      }

      if (!canStepBackRef.current) return;

      pushedRef.current = false;
      onStepBackRef.current();
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const consumeStepHistory = useCallback(() => {
    const currentState = window.history.state as { analysisStep?: boolean } | null;
    if (!pushedRef.current || !currentState?.analysisStep) return;

    ignoreNextPopRef.current = true;
    pushedRef.current = false;
    window.history.back();
  }, []);

  return { consumeStepHistory };
}
