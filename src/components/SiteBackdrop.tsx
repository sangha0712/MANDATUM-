import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SITE_BACKGROUND_IMAGE_URLS } from '../data/backgrounds';

const BACKGROUND_CHANGE_INTERVAL_MS = 12_000;

export function SiteBackdrop({ bright = false }: { bright?: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (
        currentIndex + 1
      ) % SITE_BACKGROUND_IMAGE_URLS.length);
    }, BACKGROUND_CHANGE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const activeImage = SITE_BACKGROUND_IMAGE_URLS[activeIndex];

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#070B10]" aria-hidden="true">
      <AnimatePresence initial={false}>
        <motion.img
          key={activeImage}
          src={activeImage}
          alt=""
          initial={{ opacity: 0, scale: 1.025 }}
          animate={{ opacity: bright ? 0.68 : 0.5, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8, ease: 'easeInOut' }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>

      <div className={`absolute inset-0 ${bright ? 'bg-[#07101A]/36' : 'bg-[#07101A]/55'}`} />
      <div
        className="absolute inset-0"
        style={{
          background: bright
            ? 'radial-gradient(circle at center, transparent 18%, rgba(4,8,13,0.22) 62%, rgba(3,6,10,0.72) 100%)'
            : 'radial-gradient(circle at center, transparent 15%, rgba(4,8,13,0.32) 58%, rgba(3,6,10,0.88) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: bright
            ? 'linear-gradient(180deg, rgba(5,9,14,0.52) 0%, rgba(5,9,14,0.08) 38%, rgba(5,9,14,0.34) 100%)'
            : 'linear-gradient(180deg, rgba(5,9,14,0.7) 0%, rgba(5,9,14,0.18) 36%, rgba(5,9,14,0.5) 100%)',
        }}
      />
    </div>
  );
}
