import type { MediaAsset } from '@/lib/types';
import data from '@/lib/placeholder-images.json';

export const PlaceHolderImages: MediaAsset[] = data.placeholderImages.map(
  (item) => ({ ...item, type: item.type as MediaAsset['type'] })
);
