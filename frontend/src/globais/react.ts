// O React 18.3.1 do kit (public/campbel/react.production.min.js), já carregado na página.
type ModuloReact = typeof import('react')

const R = (window as unknown as { React: ModuloReact }).React

export default R
export const {
  Children,
  Fragment,
  StrictMode,
  createContext,
  createElement,
  forwardRef,
  memo,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} = R
