/// <reference types="vite/client" />
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { virtualKeyboardMode?: string; ref?: any; value?: string; onInput?: (e: any) => void; };
    }
  }
}
export {};
