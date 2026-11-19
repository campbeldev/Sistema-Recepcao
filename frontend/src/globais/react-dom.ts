// O ReactDOM 18.3.1 do kit (public/campbel/react-dom.production.min.js), já carregado na página.
type ModuloReactDom = typeof import('react-dom/client')

const D = (window as unknown as { ReactDOM: ModuloReactDom }).ReactDOM

export const { createRoot } = D
