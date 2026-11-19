// O JSX compilado chama jsx/jsxs; o bundle do kit traz a mesma ponte (CampbelJsx) sobre o React global.
type Jsx = typeof import('react/jsx-runtime')

const J = (window as unknown as { CampbelJsx: Jsx }).CampbelJsx

export const { jsx, jsxs, Fragment } = J
