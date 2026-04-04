import { useSyncExternalStore } from 'react';

type Listener = () => void;
type StoreUpdater<State extends object> = Partial<State> | ((state: State) => Partial<State> | State);

export function createStore<State extends object>(initialState: State) {
  let state = initialState;
  const listeners = new Set<Listener>();

  const getState = () => state;

  const setState = (updater: StoreUpdater<State>) => {
    const nextValue = typeof updater === 'function' ? updater(state) : updater;
    state = {
      ...state,
      ...nextValue,
    };

    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const useStore = <Selected,>(selector: (value: State) => Selected) =>
    useSyncExternalStore(subscribe, () => selector(state), () => selector(state));

  return {
    getState,
    setState,
    subscribe,
    useStore,
  };
}
