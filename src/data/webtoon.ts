export const WEBTOON_PANEL_IMAGE_URLS = Array.from(
  { length: 7 },
  (_, index) => `https://igx.kr/r/t8/28/${index}`,
);

export const WEBTOON_READER_IMAGE_URLS = Array.from(
  { length: 29 },
  (_, index) => `https://igx.kr/r/t8/27/${index}`,
);

export const ALL_WEBTOON_IMAGE_URLS = [
  ...WEBTOON_PANEL_IMAGE_URLS,
  ...WEBTOON_READER_IMAGE_URLS,
];

export function createRandomWebtoonImage(excludeUrl?: string) {
  const candidates = excludeUrl
    ? WEBTOON_PANEL_IMAGE_URLS.filter((url) => url !== excludeUrl)
    : WEBTOON_PANEL_IMAGE_URLS;

  return candidates[Math.floor(Math.random() * candidates.length)];
}
