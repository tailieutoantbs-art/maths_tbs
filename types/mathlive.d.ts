declare namespace JSX {
  interface IntrinsicElements {
    'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      'math-virtual-keyboard-policy'?: string;
      value?: string;
    };
  }
}
