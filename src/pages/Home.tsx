import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { ImagePlaceholder } from '../components/ImagePlaceholder';
import { IntroSequence } from '../components/IntroSequence';
import { FloatingParticles } from '../components/FloatingParticles';
import { AppContext } from '../components/Layout';
import { playStartMechanical, stopAllAudio } from '../utils/audio';
import { CharacterScanImage } from '../components/CharacterScanImage';
import { WebtoonScanImage } from '../components/WebtoonScanImage';
import { WorldScanImage } from '../components/WorldScanImage';
import { ARCHIVE_PANEL_IMAGE_URL } from '../data/backgrounds';

const PANELS = [
  {
    id: 'world',
    title: 'WORLD',
    desc: '세계의 구조와 각 섬의 현황을 탐색합니다.',
    img: '',
    link: '/world',
    accent: '#2DD4FF',
    accentDim: 'rgba(45, 212, 255, 0.34)',
    accentGlow: 'rgba(45, 212, 255, 0.2)',
  },
  {
    id: 'characters',
    title: 'CHARACTERS',
    desc: '소속 기관별 히어로 데이터베이스.',
    img: '',
    link: '/characters',
    accent: '#B77AFF',
    accentDim: 'rgba(183, 122, 255, 0.34)',
    accentGlow: 'rgba(183, 122, 255, 0.2)',
  },
  {
    id: 'webtoon',
    title: 'WEBTOON',
    desc: '세계관 단편 코믹스 감상.',
    img: '',
    link: '/webtoon',
    accent: '#FFB45E',
    accentDim: 'rgba(255, 180, 94, 0.34)',
    accentGlow: 'rgba(255, 180, 94, 0.2)',
  },
  {
    id: 'archive',
    title: 'ARCHIVE',
    desc: '펄스, 역사, 사회에 대한 기록 열람.',
    img: ARCHIVE_PANEL_IMAGE_URL,
    link: '/archive',
    accent: '#62E6A7',
    accentDim: 'rgba(98, 230, 167, 0.34)',
    accentGlow: 'rgba(98, 230, 167, 0.2)',
  },
];

const TUTORIAL_STEPS = [
  {
    id: 'world',
    label: 'WORLD',
    title: '공중섬 네트워크 탐색',
    description: '홀로그램 월드맵에서 다섯 공중섬과 조직의 배치를 확인합니다.',
    details: [
      '드래그로 시점을 바꾸고 스크롤로 거리를 조절할 수 있습니다.',
      '섬을 선택하면 기후·조직·인프라 정보와 배치 히어로가 열립니다.',
    ],
    accent: '#2DD4FF',
  },
  {
    id: 'characters',
    label: 'CHARACTERS',
    title: '히어로 데이터베이스 열람',
    description: '소속 조직별로 히어로를 분류하고 각 인물의 상세 기록을 확인합니다.',
    details: [
      '조직 필터로 원하는 소속의 캐릭터만 빠르게 모아볼 수 있습니다.',
      '캐릭터를 선택하면 등급·펄스·성격·특징과 이미지를 볼 수 있습니다.',
    ],
    accent: '#B77AFF',
  },
  {
    id: 'webtoon',
    label: 'WEBTOON',
    title: '세로 스크롤 웹툰 감상',
    description: 'MANDATUM 세계관의 단편 웹툰을 한 흐름으로 감상합니다.',
    details: [
      '감상할 항목을 선택하면 원고가 순서대로 이어집니다.',
      '총 29장의 원고를 끊김 없는 세로 스크롤로 읽을 수 있습니다.',
    ],
    accent: '#FFB45E',
  },
  {
    id: 'archive',
    label: 'ARCHIVE',
    title: '세계관 내부 기록 조사',
    description: '세계·펄스·역사·사건·생물·사회·관계 기록을 분류별로 조사합니다.',
    details: [
      '목록에서 원하는 데이터베이스 섹터를 선택할 수 있습니다.',
      '각 문서에서 공개된 설정과 인물 관계를 자세히 확인할 수 있습니다.',
    ],
    accent: '#62E6A7',
  },
] as const;

const LONG_PRESS_DELAY_MS = 280;
const LONG_PRESS_RELEASE_DELAY_MS = 140;

export default function Home() {
  const { setHeaderVisible } = useContext(AppContext);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pressedPanelId, setPressedPanelId] = useState<string | null>(null);
  
  const [hasEntered] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('intro') === '1') return false;
    return sessionStorage.getItem('mandatum_site_entered') === 'true';
  });

  const [stage, setStage] = useState<'title' | 'intro' | 'home'>(hasEntered ? 'home' : 'title');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const tutorialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressReleaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const suppressPanelClickRef = useRef(false);
  const lastPointerTypeRef = useRef('mouse');
  const hoveredPanelRef = useRef<string | null>(null);
  const pendingHoveredPanelRef = useRef<string | null>(null);
  const hoverFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Hide header during Intro and Start Screen, show it once started
    setHeaderVisible(stage === 'home');
    if (stage === 'home') {
      stopAllAudio();
    }
  }, [stage, setHeaderVisible]);

  useEffect(() => {
    if (tutorialStep === null) return;

    const handleTutorialKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTutorialStep(null);
      } else if (event.key === 'ArrowLeft') {
        setTutorialStep((step) => step === null ? null : Math.max(0, step - 1));
      } else if (event.key === 'ArrowRight' || event.key === 'Enter') {
        setTutorialStep((step) => (
          step === null || step >= TUTORIAL_STEPS.length - 1 ? null : step + 1
        ));
      }
    };

    window.addEventListener('keydown', handleTutorialKeyDown);
    return () => window.removeEventListener('keydown', handleTutorialKeyDown);
  }, [tutorialStep]);

  useEffect(() => () => {
    if (tutorialTimerRef.current) clearTimeout(tutorialTimerRef.current);
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    if (longPressReleaseTimerRef.current) clearTimeout(longPressReleaseTimerRef.current);
    if (hoverFrameRef.current !== null) cancelAnimationFrame(hoverFrameRef.current);
  }, []);

  const queueHoveredPanel = (panelId: string | null) => {
    pendingHoveredPanelRef.current = panelId;
    if (hoverFrameRef.current !== null) return;

    hoverFrameRef.current = requestAnimationFrame(() => {
      hoverFrameRef.current = null;
      const nextPanelId = pendingHoveredPanelRef.current;
      if (hoveredPanelRef.current === nextPanelId) return;

      hoveredPanelRef.current = nextPanelId;
      setHovered(nextPanelId);
    });
  };

  const clearLongPressTimer = () => {
    if (!longPressTimerRef.current) return;
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  const beginPanelLongPress = (panelId: string, pointerType: string) => {
    lastPointerTypeRef.current = pointerType;
    if (pointerType === 'mouse') return;

    clearLongPressTimer();
    if (longPressReleaseTimerRef.current) {
      clearTimeout(longPressReleaseTimerRef.current);
      longPressReleaseTimerRef.current = null;
    }

    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      longPressTriggeredRef.current = true;
      suppressPanelClickRef.current = true;
      setPressedPanelId(panelId);
    }, LONG_PRESS_DELAY_MS);
  };

  const endPanelLongPress = () => {
    clearLongPressTimer();
    if (!longPressTriggeredRef.current) return;

    longPressTriggeredRef.current = false;
    longPressReleaseTimerRef.current = setTimeout(() => {
      setPressedPanelId(null);
      suppressPanelClickRef.current = false;
      longPressReleaseTimerRef.current = null;
    }, LONG_PRESS_RELEASE_DELAY_MS);
  };

  const handleIntroComplete = () => {
    sessionStorage.setItem('mandatum_site_entered', 'true');
    setStage('home');
    tutorialTimerRef.current = setTimeout(() => {
      setTutorialStep(0);
      tutorialTimerRef.current = null;
    }, 700);
  };

  const advanceTutorial = () => {
    setTutorialStep((step) => (
      step === null || step >= TUTORIAL_STEPS.length - 1 ? null : step + 1
    ));
  };

  const currentTutorial = tutorialStep === null ? null : TUTORIAL_STEPS[tutorialStep];

  const handleStart = () => {
    if (isTransitioning || stage !== 'title') return;
    setIsTransitioning(true);
    playStartMechanical();
    setTimeout(() => {
      setStage('intro');
      setIsTransitioning(false);
    }, 150);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {stage === 'title' && (
          <motion.div
            key="start-screen"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
          >
            <FloatingParticles isAccelerating={isTransitioning} />
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(77,141,255,0.05),transparent_45%)] pointer-events-none" />

            <motion.div
              initial={{ gap: 80 }}
              animate={{ gap: 116 }}
              transition={{ duration: 0.9, delay: 2.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 -mt-10 flex w-full flex-col items-center px-4 sm:-mt-16"
            >
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="flex items-center justify-center relative"
              >
                <span className="w-full text-center font-cinzel text-[#F2F2F0]" style={{ fontSize: 'clamp(36px, 9.6vw, 110px)', fontWeight: 400, letterSpacing: 'clamp(0.08em, 1.2vw, 0.14em)', lineHeight: 1 }}>
                  MANDATUM
                </span>
                <motion.p
                  initial={{ opacity: 0, y: -7, letterSpacing: '0.18em' }}
                  animate={{ opacity: 0.82, y: 0, letterSpacing: '0.34em' }}
                  transition={{ duration: 0.75, delay: 1.55, ease: 'easeOut' }}
                  className="absolute left-1/2 top-full mt-4 -translate-x-1/2 whitespace-nowrap text-[11px] font-light text-[#B8C8D8] sm:text-xs"
                >
                  -히어로 이야기-
                </motion.p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 2.0 }}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={handleStart}
                disabled={isTransitioning}
                className={cn(
                  "relative flex h-[58px] w-[min(220px,calc(100vw-48px))] min-w-0 items-center justify-center overflow-hidden rounded-[2px] border border-[rgba(138,184,255,0.55)] bg-[rgba(10,15,21,0.35)] transition-all duration-300 group focus:outline-none sm:h-[62px] sm:min-w-[220px]",
                  "hover:border-[#4D8DFF] hover:bg-[rgba(77,141,255,0.08)] text-[#E9EEF3] hover:text-white",
                  isTransitioning && "opacity-0 scale-[0.985] border-[#4D8DFF] bg-[rgba(77,141,255,0.15)]"
                )}
              >
                <span className="relative z-10 font-medium tracking-[0.24em] uppercase text-[18px]">
                  START
                </span>
                
                {/* Subtle blue light swipe on hover */}
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-[#4D8DFF] to-transparent opacity-0 group-hover:opacity-[0.15] -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-in-out" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <IntroSequence key="intro" onComplete={handleIntroComplete} />
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: stage === 'home' ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className={cn(
          "flex-1 flex flex-col items-center justify-center py-6 sm:py-10 md:py-16 w-full h-full",
          stage !== 'home' && "pointer-events-none" // Prevent interactions while start screen is visible
        )}
      >
        <div className="flex h-[min(680px,calc(100svh-112px))] min-h-[540px] w-full max-w-[1480px] flex-col gap-2 px-1 sm:w-[calc(100%-40px)] sm:px-0 md:w-[calc(100%-80px)] lg:h-[clamp(520px,68vh,720px)] lg:flex-row lg:gap-4">
          {PANELS.map((panel) => {
        const tutorialPanelId = currentTutorial?.id ?? null;
        const activePanelId = tutorialPanelId ?? pressedPanelId ?? hovered;
        const isHovered = activePanelId === panel.id;
        const isOthersHovered = activePanelId !== null && activePanelId !== panel.id;
        const isTutorialTarget = tutorialPanelId === panel.id;

        return (
          <Link
            key={panel.id}
            to={panel.link}
            onPointerEnter={(event) => {
              lastPointerTypeRef.current = event.pointerType;
              if (event.pointerType === 'mouse') queueHoveredPanel(panel.id);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === 'mouse') queueHoveredPanel(null);
              else endPanelLongPress();
            }}
            onFocus={() => queueHoveredPanel(panel.id)}
            onBlur={() => queueHoveredPanel(null)}
            onPointerDown={(event) => beginPanelLongPress(panel.id, event.pointerType)}
            onPointerUp={endPanelLongPress}
            onPointerCancel={endPanelLongPress}
            onContextMenu={(event) => {
              if (lastPointerTypeRef.current !== 'mouse') event.preventDefault();
            }}
            onClick={(event) => {
              if (suppressPanelClickRef.current) {
                event.preventDefault();
                suppressPanelClickRef.current = false;
                return;
              }
              if (tutorialStep === null) return;
              event.preventDefault();
              advanceTutorial();
            }}
            className="group relative flex min-h-[118px] select-none items-end overflow-hidden border p-4 transition-[flex-basis,border-color,box-shadow] duration-500 ease-out focus-visible:outline-none sm:p-5 lg:min-h-0 lg:p-6"
            style={{
              flexBasis: activePanelId === null ? '25%' : isHovered ? '38%' : '20.6667%',
              flexGrow: 0,
              flexShrink: 1,
              zIndex: isTutorialTarget ? 60 : isHovered ? 2 : 0,
              touchAction: 'manipulation',
              WebkitTouchCallout: 'none',
              borderColor: isHovered
                ? panel.accent
                : isOthersHovered
                  ? '#1B2833'
                  : panel.accentDim,
              boxShadow: isHovered
                ? `inset 0 0 0 1px ${panel.accentGlow}, 0 0 26px ${panel.accentGlow}`
                : `inset 0 0 0 1px ${panel.accentGlow}, 0 0 12px rgba(0, 0, 0, 0.18)`,
              outline: isTutorialTarget ? `1px solid ${panel.accent}` : 'none',
              outlineOffset: isTutorialTarget ? '5px' : '0',
            }}
          >
            {/* Background Image Container */}
            <div className="absolute inset-0 z-0">
              {panel.id === 'characters' || panel.id === 'webtoon' || panel.id === 'world' ? (
                <div className={cn(
                  'absolute inset-0 transition-all duration-700 ease-out opacity-80',
                  isHovered ? 'scale-105 opacity-100' : 'scale-100',
                  isOthersHovered && 'opacity-20'
                )}>
                  {panel.id === 'characters' ? (
                    <CharacterScanImage active={isHovered} />
                  ) : panel.id === 'world' ? (
                    <WorldScanImage active={isHovered} />
                  ) : (
                    <WebtoonScanImage active={isHovered} />
                  )}
                </div>
              ) : (
                <ImagePlaceholder
                  src={panel.img}
                  text={`${panel.title} VISUAL`}
                  className={cn(
                    'w-full h-full transition-transform duration-700 ease-out opacity-40',
                    isHovered ? 'scale-105 opacity-80' : 'scale-100',
                    isOthersHovered && 'opacity-20 grayscale'
                  )}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1016] via-transparent to-transparent opacity-80" />
            </div>

            {/* Accent Line */}
            <div
              className={cn(
                'absolute top-0 left-0 w-full h-1 transform origin-left transition-all duration-500',
                isHovered ? 'scale-x-100 opacity-100' : 'scale-x-[0.34] opacity-55'
              )}
              style={{
                backgroundColor: panel.accent,
                boxShadow: `0 0 14px ${panel.accentGlow}`,
              }}
            />

            {/* Content */}
            <div className={cn(
              "relative z-10 w-full min-w-0 transition-transform duration-500",
              isHovered ? "-translate-y-4" : "translate-y-0"
            )}>
              <h2 className={cn(
                "text-[clamp(1.25rem,2vw,2.25rem)] font-bold tracking-wider whitespace-nowrap mb-2 transition-colors duration-300",
                panel.id === 'characters' && "tracking-[0.035em]",
                isHovered ? "text-white" : "text-[#E9EEF3]"
              )}
                style={{ textShadow: isHovered ? `0 0 18px ${panel.accentGlow}` : 'none' }}
              >
                {panel.title}
              </h2>
              <div
                className={cn(
                  'grid transition-all duration-500 ease-out',
                  isHovered ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 lg:hidden' // Show desc on mobile by default or hide it? Hide it on desktop unless hovered.
                )}
              >
                <p
                  className="text-sm md:text-base overflow-hidden whitespace-normal break-keep"
                  style={{ color: panel.accent }}
                >
                  {panel.desc}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
        </div>
      </motion.div>

      <AnimatePresence>
        {stage === 'home' && currentTutorial && tutorialStep !== null && (
          <>
            <motion.div
              key="tutorial-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 bg-[#02060B]/72 backdrop-blur-[2px]"
              aria-hidden="true"
            />

            <motion.section
              key="tutorial-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="home-tutorial-title"
              initial={{ opacity: 0, y: 20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 14, x: '-50%' }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="fixed bottom-5 left-1/2 z-[80] max-h-[calc(100vh-40px)] w-[calc(100%-32px)] max-w-[590px] overflow-y-auto border bg-[#07101A]/[0.97] p-5 shadow-2xl backdrop-blur-xl sm:bottom-8 sm:p-7"
              style={{
                borderColor: currentTutorial.accent,
                boxShadow: `0 0 36px ${currentTutorial.accent}24, 0 24px 80px rgba(0, 0, 0, 0.58)`,
              }}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.22em]">
                  <span
                    className="h-1.5 w-1.5"
                    style={{
                      backgroundColor: currentTutorial.accent,
                      boxShadow: `0 0 10px ${currentTutorial.accent}`,
                    }}
                  />
                  <span style={{ color: currentTutorial.accent }}>AETHER NAVIGATION GUIDE</span>
                </div>
                <span className="shrink-0 font-mono text-[10px] tracking-[0.18em] text-[#778899]">
                  {String(tutorialStep + 1).padStart(2, '0')} / {String(TUTORIAL_STEPS.length).padStart(2, '0')}
                </span>
              </div>

              <div className="mb-3 font-mono text-xs tracking-[0.2em]" style={{ color: currentTutorial.accent }}>
                {currentTutorial.label}
              </div>
              <h2 id="home-tutorial-title" className="mb-3 text-2xl font-bold tracking-[0.04em] text-white sm:text-3xl">
                {currentTutorial.title}
              </h2>
              <p className="text-sm leading-6 text-[#C0CAD4] sm:text-base sm:leading-7">
                {currentTutorial.description}
              </p>

              <ul className="my-5 space-y-2 border-y border-[#253647] py-4">
                {currentTutorial.details.map((detail) => (
                  <li key={detail} className="flex gap-3 text-xs leading-5 text-[#96A7B8] sm:text-sm sm:leading-6">
                    <span className="mt-[0.56em] h-1 w-1 shrink-0" style={{ backgroundColor: currentTutorial.accent }} />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>

              <div className="mb-5 flex items-center gap-2">
                {TUTORIAL_STEPS.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setTutorialStep(index)}
                    aria-label={`${step.label} 튜토리얼로 이동`}
                    className="h-1.5 flex-1 bg-[#253647] transition-colors"
                    style={{ backgroundColor: index <= tutorialStep ? currentTutorial.accent : undefined }}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setTutorialStep(null)}
                  className="px-2 py-3 text-xs tracking-[0.16em] text-[#7E8E9E] transition-colors hover:text-white"
                >
                  건너뛰기
                </button>

                <div className="flex items-center gap-2">
                  {tutorialStep > 0 && (
                    <button
                      type="button"
                      onClick={() => setTutorialStep((step) => step === null ? null : Math.max(0, step - 1))}
                      className="border border-[#31465A] px-4 py-3 text-xs tracking-[0.14em] text-[#A9B7C5] transition-colors hover:border-[#66839F] hover:text-white"
                    >
                      이전
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={advanceTutorial}
                    className="border px-5 py-3 text-xs font-bold tracking-[0.16em] text-white transition-colors"
                    style={{
                      borderColor: currentTutorial.accent,
                      backgroundColor: `${currentTutorial.accent}18`,
                      boxShadow: `inset 0 0 18px ${currentTutorial.accent}12`,
                    }}
                  >
                    {tutorialStep === TUTORIAL_STEPS.length - 1 ? '둘러보기 시작' : '다음'}
                  </button>
                </div>
              </div>

              <p className="mt-4 hidden text-center font-mono text-[9px] tracking-[0.14em] text-[#5F7182] sm:block">
                ← → KEY TO NAVIGATE · ESC TO SKIP
              </p>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

