import { useState } from 'react';
import { preloadSiteImages } from '../utils/siteImagePreloader';
import {
  playTitleRevealSequence,
  playUiSelectSound,
  startBackgroundMusic,
} from '../utils/audio';
import { requestPersistentImageStorage } from '../utils/persistentImageCache';

export function MediaLoadNotice({ children }: { children: React.ReactNode }) {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    void requestPersistentImageStorage();
    void preloadSiteImages();
    void playUiSelectSound();
    const forceIntro = new URLSearchParams(window.location.search).get('intro') === '1';
    const hasEntered = window.sessionStorage.getItem('mandatum_site_entered') === 'true';
    const titleWillShow = window.location.pathname === '/' && (forceIntro || !hasEntered);
    void startBackgroundMusic(false, titleWillShow ? 5_200 : 1_800);
    if (titleWillShow) {
      void playTitleRevealSequence();
    }
    setConfirmed(true);
  };

  if (confirmed) return children;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05080C] px-5 py-12 text-[#E9EEF3]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(77,141,255,0.11),transparent_48%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#4D8DFF]/70 to-transparent" />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-notice-title"
        aria-describedby="media-notice-description"
        className="relative z-10 w-full max-w-[560px] border border-[#293644] bg-[#0B1016]/96 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.48)] sm:p-9"
      >
        <div className="mb-7 flex items-center gap-3 font-mono text-[10px] tracking-[0.24em] text-[#4D8DFF]">
          <span className="h-1.5 w-1.5 bg-[#4D8DFF]" />
          NETWORK DATA NOTICE
        </div>

        <h1
          id="media-notice-title"
          className="mb-5 text-2xl font-bold tracking-[0.08em] text-white sm:text-3xl"
        >
          대용량 이미지 로딩 안내
        </h1>

        <div
          id="media-notice-description"
          className="space-y-3 text-sm leading-7 text-[#B5C0CB] sm:text-base"
        >
          <p>해당 웹사이트는 높은 용량의 이미지를 다량 포함하고 있습니다.</p>
          <p>
            모바일 데이터 사용 시 모바일 데이터가 과도하게 사용될 수 있습니다.
            확인을 누를 경우 이미지 로딩이 시작됩니다.
          </p>
        </div>

        <div className="my-7 h-px bg-gradient-to-r from-[#293644] via-[#4D8DFF]/55 to-[#293644]" />

        <button
          type="button"
          onClick={handleConfirm}
          className="group relative flex h-14 w-full items-center justify-center overflow-hidden border border-[#4D8DFF]/70 bg-[#111B27] text-sm font-bold tracking-[0.22em] text-white transition-colors hover:border-[#8AB8FF] hover:bg-[#16263A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8AB8FF]"
        >
          <span className="relative z-10">확인</span>
          <span className="absolute inset-y-0 left-0 w-0 bg-[#4D8DFF]/12 transition-all duration-500 group-hover:w-full" />
        </button>

        <p className="mt-4 text-center font-mono text-[9px] tracking-[0.16em] text-[#667687]">
          CONFIRM TO INITIALIZE MEDIA CACHE
        </p>
      </section>
    </main>
  );
}
