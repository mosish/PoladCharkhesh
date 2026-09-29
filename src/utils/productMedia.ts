import { BearingProduct } from '../types';

/**
 * Returns the best high-definition media URL for a bearing product:
 * 1. An explicit uploaded image (if valid and not an old placeholder path).
 * 2. An authentic self-hosted mechanical reference photo from /reference-images/.
 */
export function getProductMediaUrl(product: BearingProduct): { url: string; isReference: boolean } {
  if (product.imageUrl && !product.imageUrl.startsWith('/assets/images/') && !product.imageUrl.includes('unsplash.com')) {
    return { url: product.imageUrl, isReference: false };
  }

  if (product.category === 'seal') {
    return { url: '/reference-images/shaft-seal.jpg', isReference: true };
  }
  if (product.category === 'housing') {
    return { url: '/reference-images/pillow-block.jpg', isReference: true };
  }
  if (product.schematicType === 'spherical') {
    return { url: '/reference-images/spherical-roller.png', isReference: true };
  }
  if (product.schematicType === 'cylindrical') {
    return { url: '/reference-images/cylindrical-roller.png', isReference: true };
  }
  if (product.schematicType === 'needle') {
    return { url: '/reference-images/needle-bearing.jpg', isReference: true };
  }
  if (product.schematicType === 'tapered') {
    return { url: '/reference-images/tapered-roller-bearing.jpg', isReference: true };
  }
  if (product.category === 'ball' || product.schematicType === 'deep-groove' || product.schematicType === 'angular-contact' || product.schematicType === 'self-aligning-ball') {
    return { url: '/reference-images/ball-bearing.jpg', isReference: true };
  }

  return { url: product.imageUrl || '/reference-images/ball-bearing.jpg', isReference: !product.imageUrl };
}
