import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Minus, Plus, Volume2, VolumeX } from 'lucide-react';
import { SiteBackdrop } from './SiteBackdrop';
import {
  BACKGROUND_MUSIC_STATE_EVENT,
  getBackgroundMusicEnabled,
  getBackgroundMusicVolume,
  playUiHoverSound,
  playUiSelectSound,
  setBackgroundMusicVolume as applyBackgroundMusicVolume,
  toggleBackgroundMusic,
} from '../utils/audio';

const CATEGORY_THEMES = {
  world: { accent: '#2DD4FF', soft: 'rgba(45, 212, 255, 0.22)', faint: 'rgba(45, 212, 255, 0.07)' },
  characters: { accent: '#B77AFF', soft: 'rgba(183, 122, 255, 0.22)', faint: 'rgba(183, 122, 255, 0.07)' },
  webtoon: { accent: '#FFB45E', soft: 'rgba(255, 180, 94, 0.22)', faint: 'rgba(255, 180, 94, 0.07)' },
  archive: { accent: '#62E6A7', soft: 'rgba(98, 230, 167, 0.22)', faint: 'rgba(98, 230, 167, 0.07)' },
} as const;

const INTERACTIVE_ELEMENT_SELECTOR = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  'summary',
  'canvas',
  '[role="button"]',
  '[role="link"]',
  '[role="option"]',
  '[role="tab"]',
  '[tabindex]:not([tabindex="-1"])',
  '[data-ui-sound]',
  '[class*="cursor-pointer"]',
].join(',');

function getInteractiveElement(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const element = target.closest<HTMLElement>(INTERACTIVE_ELEMENT_SELECTOR);
  if (!element || element.getAttribute('aria-disabled') === 'true') return null;
  return element;
}

export const AppContext = React.createContext<{
  headerVisible: boolean;
  setHeaderVisible: (v: boolean) => void;
}>({
  headerVisible: true,
  setHeaderVisible: () => {},
});

export function Layout() {
  const location = useLocation();
  const [headerVisible, setHeaderVisible] = useState(true);
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(getBackgroundMusicEnabled);
  const [backgroundMusicVolume, setBackgroundMusicVolume] = useState(getBackgroundMusicVolume);
  const [volumePanelOpen, setVolumePanelOpen] = useState(false);
  const isWorldRoute = location.pathname === '/world' || location.pathname.startsWith('/world/');
  const categoryKey = (Object.keys(CATEGORY_THEMES) as Array<keyof typeof CATEGORY_THEMES>)
    .find((key) => location.pathname === `/${key}` || location.pathname.startsWith(`/${key}/`));
  const categoryTheme = categoryKey ? CATEGORY_THEMES[categoryKey] : null;
  const categoryStyle = categoryTheme ? ({
    '--category-accent': categoryTheme.accent,
    '--category-soft': categoryTheme.soft,
    '--category-faint': categoryTheme.faint,
  } as React.CSSProperties) : undefined;

  useEffect(() => {
    // Default to visible when navigating to other pages
    if (location.pathname !== '/') {
      setHeaderVisible(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    const updateBackgroundMusicState = (event: Event) => {
      const detail = (event as CustomEvent<{ enabled: boolean; volume: number }>).detail;
      setBackgroundMusicEnabled(detail.enabled);
      setBackgroundMusicVolume(detail.volume);
    };
    window.addEventListener(BACKGROUND_MUSIC_STATE_EVENT, updateBackgroundMusicState);
    setBackgroundMusicEnabled(getBackgroundMusicEnabled());
    setBackgroundMusicVolume(getBackgroundMusicVolume());
    return () => window.removeEventListener(
      BACKGROUND_MUSIC_STATE_EVENT,
      updateBackgroundMusicState,
    );
  }, []);

  useEffect(() => {
    const handlePointerOver = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const element = getInteractiveElement(event.target);
      if (!element) return;
      const previousTarget = event.relatedTarget;
      if (previousTarget instanceof Node && element.contains(previousTarget)) return;
      playUiHoverSound();
    };

    const handleSelection = (event: Event) => {
      if (!getInteractiveElement(event.target)) return;
      void playUiSelectSound();
    };

    document.addEventListener('pointerover', handlePointerOver, true);
    document.addEventListener('click', handleSelection, true);
    document.addEventListener('change', handleSelection, true);
    return () => {
      document.removeEventListener('pointerover', handlePointerOver, true);
      document.removeEventListener('click', handleSelection, true);
      document.removeEventListener('change', handleSelection, true);
    };
  }, []);

  const changeBackgroundMusicVolume = (nextVolume: number) => {
    setBackgroundMusicVolume(applyBackgroundMusicVolume(nextVolume));
  };

  return (
    <AppContext.Provider value={{ headerVisible, setHeaderVisible }}>
      <div
        className={`relative isolate min-h-screen bg-[#0B1016] text-[#E9EEF3] font-sans selection:text-white flex flex-col overflow-x-hidden${categoryTheme ? ' category-route' : ''}`}
        data-category-theme={categoryKey}
        style={categoryStyle}
      >
      {!isWorldRoute && <SiteBackdrop bright={location.pathname === '/'} />}

        {categoryTheme && (
          <div className="category-route-chrome pointer-events-none absolute inset-x-0 top-0 z-40 h-[100svh]" aria-hidden="true">
            <span className="category-route-line absolute inset-x-0 top-16 h-px sm:top-[72px]" />
            <span className="category-route-corner category-route-corner-left absolute left-3 top-[76px] h-6 w-6 sm:left-8 sm:top-[88px] sm:h-7 sm:w-7" />
            <span className="category-route-corner category-route-corner-right absolute right-3 top-[76px] h-6 w-6 sm:right-8 sm:top-[88px] sm:h-7 sm:w-7" />
            <span className="category-route-channel absolute bottom-8 left-4 hidden font-mono text-[8px] tracking-[0.22em] sm:left-8 lg:block">
              {categoryKey?.toUpperCase()} / AETHER CHANNEL
            </span>
          </div>
        )}

        {/* Header / Logo */}
        {headerVisible && (
          <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 pointer-events-none sm:p-6">
            <Link to="/" className="pointer-events-auto group">
              <div className="flex items-center justify-center">
                <span className="text-[1.05rem] font-cinzel font-semibold tracking-[0.13em] uppercase transition-colors hover:text-[#8AB8FF] sm:text-[1.38rem] sm:tracking-[0.15em] md:text-[1.65rem]">
                  MANDATUM
                </span>
              </div>
            </Link>
          </header>
        )}

        <div className="global-bgm-control fixed right-2 top-2 z-[160] transition-[opacity,transform] duration-200 sm:right-6 sm:top-5">
          <div className="flex h-10 border border-[#31516A] bg-[#07111B]/90 font-mono text-[8px] tracking-[0.12em] text-[#7F9AAF] shadow-[0_0_22px_rgba(54,157,210,0.1)] backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setBackgroundMusicEnabled(toggleBackgroundMusic())}
              aria-label={backgroundMusicEnabled ? '배경음악 끄기' : '배경음악 켜기'}
              aria-pressed={backgroundMusicEnabled}
              className="flex w-10 items-center justify-center transition-colors hover:bg-[#102235] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#66D5FF]"
            >
              {backgroundMusicEnabled && backgroundMusicVolume > 0
                ? <Volume2 size={15} />
                : <VolumeX size={15} />}
            </button>
            <button
              type="button"
              onClick={() => setVolumePanelOpen((open) => !open)}
              aria-label="배경음악 볼륨 조절 열기"
              aria-expanded={volumePanelOpen}
              className="border-l border-[#31516A] px-2 transition-colors hover:bg-[#102235] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#66D5FF] sm:px-2.5"
            >
              <span className="hidden min-[430px]:inline">BGM </span>{Math.round(backgroundMusicVolume * 100)}%
            </button>
          </div>

          {volumePanelOpen && (
            <div className="absolute right-0 top-12 w-[210px] border border-[#31516A] bg-[#06111B]/96 p-3 shadow-[0_14px_34px_rgba(0,0,0,0.42)] backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between font-mono text-[8px] tracking-[0.16em] text-[#63849A]">
                <span>CINEMATIC BGM</span>
                <span className="text-[#8DDCFA]">{Math.round(backgroundMusicVolume * 100)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeBackgroundMusicVolume(backgroundMusicVolume - 0.1)}
                  aria-label="배경음악 볼륨 줄이기"
                  className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#294D65] text-[#7898AC] transition-colors hover:border-[#5BBFE8] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#66D5FF]"
                >
                  <Minus size={12} />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={backgroundMusicVolume}
                  onChange={(event) => changeBackgroundMusicVolume(Number(event.target.value))}
                  aria-label="배경음악 볼륨"
                  className="h-1.5 min-w-0 flex-1 cursor-pointer accent-[#66CFFF]"
                />
                <button
                  type="button"
                  onClick={() => changeBackgroundMusicVolume(backgroundMusicVolume + 0.1)}
                  aria-label="배경음악 볼륨 높이기"
                  className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#294D65] text-[#7898AC] transition-colors hover:border-[#5BBFE8] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#66D5FF]"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <main className="relative z-10 mx-auto flex w-full max-w-[1920px] flex-1 flex-col px-3 pb-5 pt-20 sm:px-8 sm:pb-8 sm:pt-24">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transitionEnd: { transform: 'none' } }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </AppContext.Provider>
  );
}

