const style = document.createElement('style');
style.innerHTML = `
  html {
    --textflex-scale: 1;
  }
  body, p, span, li, a, td, th, input, button, label, textarea,
  h1, h2, h3, h4, h5, h6, div, section, article, aside, nav, header, footer {
    font-size: calc(1em * var(--textflex-scale)) !important;
    line-height: normal;
    transition: font-size 0.4s ease;
  }
`;
document.head.appendChild(style);