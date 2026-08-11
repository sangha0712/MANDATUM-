import { memo, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ImagePlaceholder } from './ImagePlaceholder';
import { cn } from '../utils';
import {
  createRandomBattleImage,
  getCharacterImageStyleById,
} from '../utils/characterImages';
import { prepareDisplayImage } from '../utils/siteImagePreloader';

type ScanState = 'gray' | 'revealing' | 'color' | 'changing';

export interface ScanPanelImage {
  url: string;
  imageStyle?: CSSProperties;
}

interface RandomScanImageProps {
  active: boolean;
  createRandomImage: (excludeUrl?: string) => ScanPanelImage;
  placeholderText: string;
  objectPositionClassName?: string;
  scanColor?: string;
}

interface CharacterScanImageProps {
  active: boolean;
}

const SCAN_DURATION = 620;
const LIGHTWEIGHT_SCAN_DURATION = 400;
const HIDDEN_DIAGONAL_CLIP = 'polygon(-32% 0, -12% 0, -32% 100%, -52% 100%)';
const VISIBLE_DIAGONAL_CLIP = 'polygon(0 0, 132% 0, 112% 100%, -20% 100%)';

function shouldUseLightweightScan() {
  if (typeof window === 'undefined') return false;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return window.matchMedia('(pointer: coarse)').matches
    || (deviceMemory !== undefined && deviceMemory <= 4);
}

export const RandomScanImage = memo(function RandomScanImage({
  active,
  createRandomImage,
  placeholderText,
  objectPositionClassName = 'object-top',
  scanColor = '#4D8DFF',
}: RandomScanImageProps) {
  const [currentImage, setCurrentImage] = useState(() => createRandomImage());
  const [nextImage, setNextImage] = useState<ScanPanelImage | null>(null);
  const [scanState, setScanState] = useState<ScanState>('gray');
  const [useLightweightScan] = useState(shouldUseLightweightScan);
  const scanDuration = useLightweightScan ? LIGHTWEIGHT_SCAN_DURATION : SCAN_DURATION;

  const mountedRef = useRef(true);
  const activeRef = useRef(active);
  const currentImageRef = useRef(currentImage);
  const createRandomImageRef = useRef(createRandomImage);
  const scanStateRef = useRef<ScanState>('gray');
  const preparedNextRef = useRef<ScanPanelImage | null>(null);
  const changingImageRef = useRef<ScanPanelImage | null>(null);
  const preparingNextRef = useRef(false);
  const pendingChangeRef = useRef(false);
  const prepareTokenRef = useRef(0);
  const revealTokenRef = useRef(0);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameTimerRef = useRef<number | null>(null);
  const beginChangeRef = useRef<() => void>(() => undefined);
  const beginRevealRef = useRef<() => void>(() => undefined);
  const prepareUpcomingRef = useRef<(excludeUrl: string) => void>(() => undefined);

  createRandomImageRef.current = createRandomImage;

  const updateScanState = (state: ScanState) => {
    scanStateRef.current = state;
    setScanState(state);
  };

  const clearAnimationTimer = () => {
    if (!animationTimerRef.current) return;
    clearTimeout(animationTimerRef.current);
    animationTimerRef.current = null;
  };

  const startChangingTo = (target: ScanPanelImage) => {
    if (!mountedRef.current || activeRef.current || scanStateRef.current !== 'color') return;

    changingImageRef.current = target;
    setNextImage(target);
    frameTimerRef.current = requestAnimationFrame(() => {
      frameTimerRef.current = requestAnimationFrame(() => {
        frameTimerRef.current = null;
        if (!mountedRef.current) return;
        if (activeRef.current) {
          setNextImage(null);
          return;
        }
        if (scanStateRef.current !== 'color') {
          changingImageRef.current = null;
          setNextImage(null);
          return;
        }

        updateScanState('changing');
        clearAnimationTimer();
        animationTimerRef.current = setTimeout(() => {
          if (!mountedRef.current) return;

          changingImageRef.current = null;
          preparedNextRef.current = null;
          currentImageRef.current = target;
          setCurrentImage(target);
          setNextImage(null);
          updateScanState('gray');
          prepareUpcomingRef.current(target.url);

          if (activeRef.current) beginRevealRef.current();
        }, scanDuration);
      });
    });
  };

  const prepareUpcoming = (excludeUrl: string) => {
    if (preparingNextRef.current || preparedNextRef.current) return;

    const candidate = createRandomImageRef.current(excludeUrl);
    const token = ++prepareTokenRef.current;
    preparingNextRef.current = true;

    void prepareDisplayImage(candidate.url).then((ready) => {
      if (!mountedRef.current || token !== prepareTokenRef.current) return;
      preparingNextRef.current = false;
      if (!ready) {
        pendingChangeRef.current = false;
        return;
      }

      preparedNextRef.current = candidate;
      if (
        pendingChangeRef.current
        && !activeRef.current
        && scanStateRef.current === 'color'
      ) {
        pendingChangeRef.current = false;
        preparedNextRef.current = null;
        startChangingTo(candidate);
      }
    });
  };

  const beginChange = () => {
    if (activeRef.current || scanStateRef.current !== 'color') return;

    const preparedImage = preparedNextRef.current;
    if (preparedImage) {
      preparedNextRef.current = null;
      startChangingTo(preparedImage);
      return;
    }

    pendingChangeRef.current = true;
    prepareUpcoming(currentImageRef.current.url);
  };

  const beginReveal = () => {
    if (
      scanStateRef.current !== 'gray'
      || (!activeRef.current && !pendingChangeRef.current)
    ) return;

    const token = ++revealTokenRef.current;
    void prepareDisplayImage(currentImageRef.current.url).then((ready) => {
      if (
        !ready
        || !mountedRef.current
        || token !== revealTokenRef.current
        || (!activeRef.current && !pendingChangeRef.current)
        || scanStateRef.current !== 'gray'
      ) return;

      updateScanState('revealing');
      clearAnimationTimer();
      animationTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;

        updateScanState('color');
        if (!activeRef.current) beginChangeRef.current();
      }, scanDuration);
    });
  };

  beginChangeRef.current = beginChange;
  beginRevealRef.current = beginReveal;
  prepareUpcomingRef.current = prepareUpcoming;

  useEffect(() => {
    activeRef.current = active;

    if (active) {
      pendingChangeRef.current = false;

      if (frameTimerRef.current) {
        cancelAnimationFrame(frameTimerRef.current);
        frameTimerRef.current = null;
      }

      const interruptedImage = changingImageRef.current;
      if (interruptedImage) {
        clearAnimationTimer();
        changingImageRef.current = null;
        preparedNextRef.current = null;
        currentImageRef.current = interruptedImage;
        setCurrentImage(interruptedImage);
        setNextImage(null);
        updateScanState('color');
        prepareUpcomingRef.current(interruptedImage.url);
        return;
      }

      prepareUpcomingRef.current(currentImageRef.current.url);

      if (scanStateRef.current === 'gray') beginRevealRef.current();
    } else {
      if (scanStateRef.current === 'revealing') {
        pendingChangeRef.current = true;
        return;
      }

      if (scanStateRef.current === 'gray') {
        pendingChangeRef.current = true;
        beginRevealRef.current();
        return;
      }

      if (scanStateRef.current === 'color') beginChangeRef.current();
    }
  }, [active]);

  useEffect(() => {
    mountedRef.current = true;
    void prepareDisplayImage(currentImageRef.current.url);

    return () => {
      mountedRef.current = false;
      pendingChangeRef.current = false;
      preparingNextRef.current = false;
      preparedNextRef.current = null;
      changingImageRef.current = null;
      ++prepareTokenRef.current;
      ++revealTokenRef.current;
      clearAnimationTimer();
      if (frameTimerRef.current) cancelAnimationFrame(frameTimerRef.current);
    };
  }, []);

  const isRevealing = scanState === 'revealing';
  const isChanging = scanState === 'changing';
  const isScanning = isRevealing || isChanging;
  const colorVisible = scanState !== 'gray';
  const imageClassName = cn(
    'h-full w-full object-cover',
    objectPositionClassName,
  );
  const scanClipTransition = isScanning
    ? `clip-path ${scanDuration}ms cubic-bezier(0.22, 1, 0.36, 1)`
    : 'none';
  const lightweightLayerTransition = isScanning
    ? `opacity ${scanDuration}ms cubic-bezier(0.22, 1, 0.36, 1)`
    : 'none';

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[#0B1016] [contain:paint]"
      aria-hidden="true"
    >
      <ImagePlaceholder
        src={currentImage.url}
        alt=""
        text={placeholderText}
        className={cn(
          'absolute inset-0 grayscale brightness-[0.62] contrast-105',
          imageClassName,
        )}
        imageStyle={currentImage.imageStyle}
      />

      <div
        className="absolute inset-0 [backface-visibility:hidden]"
        style={{
          visibility: colorVisible ? 'visible' : 'hidden',
          clipPath: useLightweightScan
            ? 'none'
            : scanState === 'color' || scanState === 'changing'
              ? 'none'
              : colorVisible
                ? VISIBLE_DIAGONAL_CLIP
                : HIDDEN_DIAGONAL_CLIP,
          opacity: useLightweightScan ? (colorVisible ? 1 : 0) : 1,
          transition: isRevealing
            ? (useLightweightScan ? lightweightLayerTransition : scanClipTransition)
            : 'none',
          willChange: isRevealing
            ? (useLightweightScan ? 'opacity' : 'clip-path')
            : 'auto',
        }}
      >
        <ImagePlaceholder
          src={currentImage.url}
          alt=""
          text={placeholderText}
          className={cn('transform-gpu', imageClassName)}
          imageStyle={currentImage.imageStyle}
        />
      </div>

      {nextImage && (
        <div
          className="absolute inset-0 [backface-visibility:hidden]"
          style={{
            clipPath: useLightweightScan
              ? 'none'
              : isChanging ? VISIBLE_DIAGONAL_CLIP : HIDDEN_DIAGONAL_CLIP,
            opacity: useLightweightScan ? (isChanging ? 1 : 0) : 1,
            transition: isChanging
              ? (useLightweightScan ? lightweightLayerTransition : scanClipTransition)
              : 'none',
            willChange: useLightweightScan ? 'opacity' : 'clip-path',
          }}
        >
          <ImagePlaceholder
            src={nextImage.url}
            alt=""
            text={placeholderText}
            className={cn(
              'grayscale brightness-[0.62] contrast-105',
              imageClassName,
            )}
            imageStyle={nextImage.imageStyle}
          />
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0 z-10 transform-gpu"
        style={{
          opacity: isScanning ? 1 : 0,
          transform: isScanning ? 'translate3d(100%, 0, 0)' : 'translate3d(-100%, 0, 0)',
          transition: isScanning
            ? `transform ${scanDuration}ms cubic-bezier(0.22, 1, 0.36, 1), opacity 90ms ease`
            : 'none',
          willChange: isScanning ? 'transform, opacity' : 'auto',
          background: `linear-gradient(
            104deg,
            transparent 42%,
            ${scanColor}00 43%,
            ${scanColor}66 47%,
            ${scanColor}D9 49%,
            #F3FBFF 50%,
            ${scanColor}D9 51%,
            ${scanColor}66 53%,
            ${scanColor}00 57%,
            transparent 58%
          )`,
          filter: `drop-shadow(0 0 12px ${scanColor}A6)`,
        }}
      />
    </div>
  );
});

function createRandomCharacterPanelImage(excludeUrl?: string): ScanPanelImage {
  const image = createRandomBattleImage(excludeUrl);
  return {
    url: image.url,
    imageStyle: getCharacterImageStyleById(image.characterId, image.imageNumber),
  };
}

export function CharacterScanImage({ active }: CharacterScanImageProps) {
  return (
    <RandomScanImage
      active={active}
      createRandomImage={createRandomCharacterPanelImage}
      placeholderText="CHARACTER VISUAL"
      objectPositionClassName="object-top"
      scanColor="#B77AFF"
    />
  );
}
