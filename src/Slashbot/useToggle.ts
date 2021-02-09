import { useCallback, useState } from 'react';

const useToggle = (
  initialState: boolean | (() => boolean) = false,
): [
  state: boolean,
  toggle: (state?: boolean) => void,
  isTrue: boolean,
  isFalse: boolean,
] => {
  const [state, setState] = useState<boolean>(initialState);
  const toggle = useCallback((state?: boolean) => {
    if (typeof state === 'boolean') {
      return setState(state);
    }
    return setState((state) => !state);
  }, []);
  return [state, toggle, state === true, state === false];
};

export default useToggle;
