/** Resize local artwork through Next's cached image optimizer, preserving its URL as the source. */
export type ImageWidth = 128 | 256 | 384 | 640 | 828 | 1080 | 1920 | 2048;
export function imageAsset(source: string, width: ImageWidth = 640): string {
  if (!/^\/(?:brand|images|mascots|chess)\//.test(source)) return source;
  return `/_next/image?url=${encodeURIComponent(source)}&w=${width}&q=85`;
}
