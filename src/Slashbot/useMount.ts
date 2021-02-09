import { useEffect } from 'react';

const useMount = (onMount?: () => void, onUnMount?: () => void): void => {
  useEffect(() => {
    if (typeof onMount === 'function') onMount();
    if (typeof onUnMount === 'function') return onUnMount;
  }, [onMount, onUnMount]);
};

export function useMountSetter<S>(
  setter: (state: S) => void,
  onMount?: S,
  onUnMount?: S,
): void {
  useEffect(() => {
    if (typeof onMount !== 'undefined') setter(onMount);
    if (typeof onUnMount !== 'undefined') return () => setter(onUnMount);
  }, [onMount, onUnMount, setter]);
}

export default useMount;
