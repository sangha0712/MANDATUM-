import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Maximize2, X } from 'lucide-react';
import type { Character } from '../types';
import { getCharacterImageStyle, getCharacterImageUrl } from '../utils/characterImages';
import { cn } from '../utils';
import { ImagePlaceholder } from './ImagePlaceholder';

interface CharacterImageViewerProps {
  character: Character;
  className?: string;
  borderColor?: string;
}

const CHARACTER_IMAGE_ASPECT_RATIO = '3192 / 2275';

export function CharacterImageViewer({
  character,
  className,
  borderColor,
}: CharacterImageViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const imageUrl = getCharacterImageUrl(character.id, 0);
  const imageStyle = getCharacterImageStyle(character.id, 0);

  useEffect(() => {
    if (!expanded) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [expanded]);

  const expandedViewer = (
    <AnimatePresence>
      {expanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${character.name} 이미지 크게 보기`}
        >
          <button
            type="button"
            className="absolute inset-0 cursor-zoom-out bg-[#010409]/95 backdrop-blur-md"
            onClick={() => setExpanded(false)}
            aria-label="확대 이미지 닫기"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1, transitionEnd: { transform: 'none' } }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative overflow-hidden border bg-[#02070C] shadow-[0_0_80px_rgba(77,141,255,0.2)]"
            style={{
              aspectRatio: CHARACTER_IMAGE_ASPECT_RATIO,
              borderColor: borderColor ?? '#4D8DFF',
              width: 'min(94vw, 123.47vh)',
            }}
          >
            <ImagePlaceholder
              src={imageUrl}
              alt={character.name}
              text={character.name}
              revealWhenDecoded
              width={3192}
              height={2275}
              className="h-full w-full object-contain"
              imageStyle={imageStyle}
            />
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center border border-[#8AB8FF]/70 bg-[#030A12]/90 text-white transition-colors hover:border-white hover:bg-[#101D2B] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
              aria-label="확대 이미지 닫기"
            >
              <X size={19} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div className={cn('w-full', className)}>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="group/image relative block w-full cursor-zoom-in overflow-hidden border bg-[#02070C] text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#8AB8FF]"
          style={{
            aspectRatio: CHARACTER_IMAGE_ASPECT_RATIO,
            borderColor: borderColor ?? '#293644',
          }}
          aria-label={`${character.name} 이미지 크게 보기`}
        >
          <ImagePlaceholder
            src={imageUrl}
            alt={character.name}
            text={character.name}
            revealWhenDecoded
            width={3192}
            height={2275}
            className="h-full w-full object-contain"
            imageStyle={imageStyle}
          />
          <span className="pointer-events-none absolute right-3 top-3 flex h-9 w-9 items-center justify-center border border-[#8AB8FF]/50 bg-[#030A12]/75 text-[#B9D6FF] opacity-70 transition-all group-hover/image:border-white group-hover/image:text-white group-hover/image:opacity-100">
            <Maximize2 size={16} />
          </span>
        </button>
        <div className="category-tip-bubble relative mt-3 inline-flex max-w-full items-center gap-2.5 border px-3 py-2">
          <span
            aria-hidden="true"
            className="category-tip-tail absolute -top-[6px] left-5 h-3 w-3 rotate-45 border-l border-t"
          />
          <Maximize2 size={13} className="category-tip-icon relative shrink-0" />
          <span className="category-tip-label relative border-r pr-2 font-mono text-[8px] font-bold tracking-[0.18em]">
            TIP
          </span>
          <span className="relative text-[11px] font-medium tracking-[0.02em] text-[#D7F2FF]">
            이미지를 눌러 크게 볼 수 있어요
          </span>
        </div>
      </div>

      {typeof document !== 'undefined' && createPortal(expandedViewer, document.body)}
    </>
  );
}
