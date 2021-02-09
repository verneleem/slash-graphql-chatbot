import React, { useState, useRef, useCallback, useEffect } from 'react';

function useStateCallback<S = any>(
  initialState: S | (() => S),
  callbackEveryUpdate?: (state: S) => void,
): [
  S,
  (
    newState: React.SetStateAction<S>,
    callbackThisUpdate?: ((state: S) => void) | undefined,
  ) => void,
] {
  const [state, setState] = useState<S>(initialState);
  useEffect(() => callbackEveryUpdate?.(state), [state, callbackEveryUpdate]);
  const resolverRef = useRef<(state: S) => void>();

  useEffect(() => {
    resolverRef.current?.(state);
    resolverRef.current = undefined;
  }, [state]);

  const handleSetState = useCallback(
    (
      newState: React.SetStateAction<S>,
      callbackThisUpdate?: (state: S) => void,
    ) => {
      setState(newState);
      resolverRef.current = callbackThisUpdate;
    },
    [],
  );

  return [state, handleSetState];
}

export default useStateCallback;
