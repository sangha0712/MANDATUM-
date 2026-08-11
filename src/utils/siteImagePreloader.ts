import {
  ALL_WEBTOON_IMAGE_URLS,
  WEBTOON_PANEL_IMAGE_URLS,
  WEBTOON_READER_IMAGE_URLS,
} from '../data/webtoon';
import {
  ARCHIVE_PANEL_IMAGE_URL,
  SITE_BACKGROUND_IMAGE_URLS,
  WORLD_PANEL_IMAGE_URLS,
} from '../data/backgrounds';
import { WORLD_CLOUD_TEXTURE_URL } from '../data/worldAssets';
import { CHARACTER_IMAGE_IDS } from './characterImages';
import { registerPersistentImageCache } from './persistentImageCache';

const CHARACTER_PROFILE_IMAGE_URLS = Object.values(CHARACTER_IMAGE_IDS).map(
  (characterId) => `https://igx.kr/r/t8/${characterId}/0`,
);

const CHARACTER_BATTLE_IMAGE_URLS = Object.values(CHARACTER_IMAGE_IDS).flatMap(
  (characterId) => [14, 15].map(
    (imageNumber) => `https://igx.kr/r/t8/${characterId}/${imageNumber}`,
  ),
);

export const SITE_IMAGE_URLS = Array.from(new Set([
  ...CHARACTER_PROFILE_IMAGE_URLS,
  ...CHARACTER_BATTLE_IMAGE_URLS,
  ...ALL_WEBTOON_IMAGE_URLS,
  ...SITE_BACKGROUND_IMAGE_URLS,
  ...WORLD_PANEL_IMAGE_URLS,
  ARCHIVE_PANEL_IMAGE_URL,
  WORLD_CLOUD_TEXTURE_URL,
]));

const IMMEDIATE_IMAGE_URLS = Array.from(new Set([
  ...SITE_BACKGROUND_IMAGE_URLS,
  ...WORLD_PANEL_IMAGE_URLS,
  ARCHIVE_PANEL_IMAGE_URL,
]));

const HOME_PANEL_IMAGE_URLS = Array.from(new Set([
  ...CHARACTER_BATTLE_IMAGE_URLS,
  ...WEBTOON_PANEL_IMAGE_URLS,
]));

const DEFERRED_IMAGE_URLS = Array.from(new Set([
  ...CHARACTER_PROFILE_IMAGE_URLS,
  ...WEBTOON_READER_IMAGE_URLS,
  WORLD_CLOUD_TEXTURE_URL,
])).filter((url) => (
  !IMMEDIATE_IMAGE_URLS.includes(url)
  && !HOME_PANEL_IMAGE_URLS.includes(url)
));

type ImageRequestPriority = 'high' | 'low';

interface QueuedImage {
  url: string;
  priority: ImageRequestPriority;
}

const MAX_CONCURRENT_IMAGE_REQUESTS = 2;
const IMAGE_REQUEST_TIMEOUT_MS = 20_000;
const imageQueue: QueuedImage[] = [];
const queuedImageUrls = new Set<string>();
const loadingImageUrls = new Set<string>();
const loadedImageUrls = new Set<string>();
const decodedDisplayImages = new Map<string, HTMLImageElement>();
const displayImageRequests = new Map<string, Promise<boolean>>();
const backgroundImageRequests = new Map<string, Promise<boolean>>();
let activeImageRequests = 0;
let preloadStarted = false;

// Home scan transitions only need the current image and the next prepared image.
// Keeping more full-resolution images decoded adds hundreds of MB of memory pressure.
const DISPLAY_IMAGE_CACHE_LIMIT = 3;

function retainDecodedDisplayImage(url: string, image: HTMLImageElement) {
  decodedDisplayImages.delete(url);
  decodedDisplayImages.set(url, image);

  while (decodedDisplayImages.size > DISPLAY_IMAGE_CACHE_LIMIT) {
    const oldestUrl = decodedDisplayImages.keys().next().value;
    if (!oldestUrl) break;
    decodedDisplayImages.delete(oldestUrl);
  }
}

export function trimPreparedDisplayImages(maxEntries = 2) {
  const safeLimit = Math.max(0, maxEntries);
  while (decodedDisplayImages.size > safeLimit) {
    const oldestUrl = decodedDisplayImages.keys().next().value;
    if (!oldestUrl) break;
    decodedDisplayImages.delete(oldestUrl);
  }
}

export function isDisplayImagePrepared(url: string) {
  return decodedDisplayImages.has(url);
}

export function prepareDisplayImage(url: string): Promise<boolean> {
  if (typeof Image === 'undefined') return Promise.resolve(false);

  const decodedImage = decodedDisplayImages.get(url);
  if (decodedImage) {
    retainDecodedDisplayImage(url, decodedImage);
    return Promise.resolve(true);
  }

  const existingRequest = displayImageRequests.get(url);
  if (existingRequest) return existingRequest;

  if (queuedImageUrls.delete(url)) {
    const queuedIndex = imageQueue.findIndex((request) => request.url === url);
    if (queuedIndex >= 0) imageQueue.splice(queuedIndex, 1);
  }

  const backgroundRequest = backgroundImageRequests.get(url);

  const request = (async () => {
    if (backgroundRequest) await backgroundRequest;
    loadingImageUrls.add(url);

    return new Promise<boolean>((resolve) => {
      const image = new Image();
      image.decoding = 'async';
      image.fetchPriority = 'high';

      let settled = false;
      let timeoutId = 0;
      const finish = async (loaded: boolean) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        image.onload = null;
        image.onerror = null;

        if (!loaded) {
          resolve(false);
          return;
        }

        try {
          await image.decode();
        } catch {
          // A successfully loaded image can still be displayed when decode() is unavailable.
        }

        loadedImageUrls.add(url);
        retainDecodedDisplayImage(url, image);
        resolve(true);
      };

      timeoutId = window.setTimeout(() => void finish(false), IMAGE_REQUEST_TIMEOUT_MS);
      image.onload = () => void finish(true);
      image.onerror = () => void finish(false);
      image.src = url;

      if (image.complete) void finish(image.naturalWidth > 0);
    });
  })().finally(() => {
    displayImageRequests.delete(url);
    loadingImageUrls.delete(url);
  });

  displayImageRequests.set(url, request);
  return request;
}

function processImageQueue() {
  while (
    activeImageRequests < MAX_CONCURRENT_IMAGE_REQUESTS
    && imageQueue.length > 0
  ) {
    const request = imageQueue.shift();
    if (!request) break;

    queuedImageUrls.delete(request.url);
    if (loadingImageUrls.has(request.url) || loadedImageUrls.has(request.url)) continue;

    activeImageRequests += 1;
    loadingImageUrls.add(request.url);

    const backgroundRequest = new Promise<boolean>((resolve) => {
      const image = new Image();
      image.decoding = 'async';
      image.fetchPriority = request.priority;

      let settled = false;
      let timeoutId = 0;
      const finish = (loaded: boolean) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        image.onload = null;
        image.onerror = null;
        resolve(loaded);
      };

      timeoutId = window.setTimeout(() => finish(false), IMAGE_REQUEST_TIMEOUT_MS);
      image.onload = () => finish(true);
      image.onerror = () => finish(false);
      image.src = request.url;
    }).then((loaded) => {
      if (loaded) loadedImageUrls.add(request.url);
      return loaded;
    }).finally(() => {
      backgroundImageRequests.delete(request.url);
      loadingImageUrls.delete(request.url);
      activeImageRequests -= 1;
      processImageQueue();
    });

    backgroundImageRequests.set(request.url, backgroundRequest);
  }
}

function enqueueImages(urls: readonly string[], priority: ImageRequestPriority) {
  urls.forEach((url) => {
    if (
      loadedImageUrls.has(url)
      || loadingImageUrls.has(url)
      || queuedImageUrls.has(url)
    ) return;
    queuedImageUrls.add(url);
    imageQueue.push({ url, priority });
  });

  processImageQueue();
}

function runWhenBrowserIsIdle(task: () => void, timeout: number) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(task, { timeout });
    return;
  }

  globalThis.setTimeout(task, Math.min(timeout, 500));
}

export async function preloadSiteImages() {
  if (typeof Image === 'undefined' || preloadStarted) return;
  preloadStarted = true;

  // Make sure the cache worker controls the page before the first bulk request.
  await registerPersistentImageCache();

  enqueueImages(IMMEDIATE_IMAGE_URLS, 'high');

  runWhenBrowserIsIdle(() => {
    enqueueImages(HOME_PANEL_IMAGE_URLS, 'low');

    runWhenBrowserIsIdle(() => {
      enqueueImages(DEFERRED_IMAGE_URLS, 'low');
    }, 6_000);
  }, 2_400);
}
