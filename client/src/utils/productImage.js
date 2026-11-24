const placeholderSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <rect width="600" height="600" fill="#f4f4f8"/>
    <circle cx="300" cy="255" r="92" fill="#feeA85"/>
    <path d="M238 264h124l-13 108H251z" fill="#635bff"/>
    <path d="M265 264c0-49 70-49 70 0" fill="none" stroke="#171717" stroke-width="18"/>
    <text x="300" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#171717">Fresh product</text>
  </svg>`;

export const PRODUCT_IMAGE_FALLBACK = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(placeholderSvg)}`;

// This source currently returns an ORB-blocked response instead of an image.
const blockedSources = [
  'photo-1541344999736-83eca872f242',
  'photo-1589135233689-d56d78709117',
  'photo-1585994192701-f1a505c817ea'
];

export const getSafeProductImage = (source) => {
  if (!source || blockedSources.some((blocked) => source.includes(blocked))) {
    return PRODUCT_IMAGE_FALLBACK;
  }
  return source;
};

export const useProductImageFallback = (event) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = PRODUCT_IMAGE_FALLBACK;
};
