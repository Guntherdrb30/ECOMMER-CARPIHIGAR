export function shimmer(w: number, h: number, rounded = 0) {
  return `\n<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="loading">\n  <defs>\n    <linearGradient id="g">\n      <stop stop-color="#f6f7f8" offset="20%"/>\n      <stop stop-color="#edeef1" offset="50%"/>\n      <stop stop-color="#f6f7f8" offset="70%"/>\n    </linearGradient>\n  </defs>\n  <rect width="${w}" height="${h}" rx="${rounded}" fill="#f6f7f8"/>\n  <rect id="r" width="${w}" height="${h}" rx="${rounded}" fill="url(#g)"/>\n  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1.2s" repeatCount="indefinite"  />\n</svg>`;
}

export function toBase64(str: string) {
  if (typeof window === 'undefined') {
    // @ts-ignore
    return Buffer.from(str).toString('base64');
  }
  return window.btoa(str);
}

