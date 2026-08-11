import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { characters } from '../data/characters';
import { Organization, Character } from '../types';
import { ImagePlaceholder } from '../components/ImagePlaceholder';
import { cn } from '../utils';
import { BackButton } from '../components/BackButton';
import { CharacterImageViewer } from '../components/CharacterImageViewer';
import { getCharacterImageStyle, getCharacterImageUrl } from '../utils/characterImages';
import { trimPreparedDisplayImages } from '../utils/siteImagePreloader';

const ORGANIZATIONS: (Organization | 'ALL')[] = ['ALL', 'PACTUM', 'LADER', 'UNKNOWN', 'EASTER', 'ORIA', 'SOLARIA', 'NIVALI'];

function CharacterCard({
  character,
  priority,
  selected,
  onSelect,
}: {
  character: Character;
  priority: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${character.name} 상세 정보 보기`}
      className="category-route-card group relative aspect-[3192/2275] cursor-pointer overflow-hidden border border-[#293644] bg-[#121A23] text-left transition-colors focus-visible:outline-none focus-visible:ring-1"
      style={{ contain: 'layout paint style', contentVisibility: 'auto' }}
    >
      <ImagePlaceholder
        src={getCharacterImageUrl(character.id, 0)}
        loading={priority || selected ? 'eager' : 'lazy'}
        fetchPriority={priority || selected ? 'high' : 'auto'}
        width={3192}
        height={2275}
        alt={character.name}
        text="CHARACTER IMAGE"
        className="pointer-events-none h-full w-full select-none object-contain object-top"
        imageStyle={getCharacterImageStyle(character.id, 0)}
      />
      <span className="pointer-events-none absolute inset-0 bg-black/20 transition-colors duration-300 group-hover:bg-transparent" />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />

      <span className="absolute bottom-0 left-0 w-full translate-y-4 p-4 transition-transform group-hover:translate-y-0">
        <span className="mb-1 block text-lg font-bold text-white">{character.name}</span>
        <span className="flex gap-2 text-xs text-[#8AB8FF] opacity-0 transition-opacity delay-100 group-hover:opacity-100">
          <span>{character.organization}</span>
          <span>•</span>
          <span>{character.grade}등급</span>
        </span>
      </span>
    </button>
  );
}

export default function Characters() {
  const [filter, setFilter] = useState<Organization | 'ALL'>('ALL');
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);

  const filteredCharacters = filter === 'ALL' ? characters : characters.filter((c) => c.organization === filter);

  useEffect(() => {
    trimPreparedDisplayImages(2);
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full relative">
      <BackButton onClick={selectedChar ? () => setSelectedChar(null) : undefined} />
      {/* Header & Filter */}
      <div className="mb-8 flex flex-col gap-5">
        <div>
          <h2 className="category-route-title text-3xl font-bold tracking-widest text-white mb-1">CHARACTERS</h2>
          <p className="category-route-kicker text-sm uppercase tracking-widest">Hero Database</p>
        </div>
        <div className="category-route-panel border border-l-2 bg-[#08121D]/90 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between font-mono text-[9px] tracking-[0.22em] text-[#6E91AB]">
            <span>ORGANIZATION FILTER</span>
            <span className="text-[#8AB8FF]">{filteredCharacters.length.toString().padStart(2, '0')} RECORDS</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {ORGANIZATIONS.map((org) => (
              <button
                key={org}
                type="button"
                aria-pressed={filter === org}
                onClick={() => {
                  setFilter(org);
                  setSelectedChar(null);
                }}
                className={cn(
                  'category-filter-button min-h-12 min-w-[112px] border px-5 text-[13px] font-bold tracking-[0.13em] uppercase transition-all duration-200 sm:px-6',
                  filter === org ? 'is-active' : ''
                )}
              >
                {org}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 relative h-full">
        {/* Grid */}
        <div className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 flex-1 h-fit transition-all duration-300",
          selectedChar && "xl:grid-cols-2 2xl:grid-cols-3 md:pr-[424px] lg:pr-[524px]"
        )}>
          {filteredCharacters.map((char, index) => (
            <CharacterCard
              key={char.id}
              character={char}
              priority={index < 6}
              selected={selectedChar?.id === char.id}
              onSelect={() => setSelectedChar(char)}
            />
          ))}
          
          {filteredCharacters.length === 0 && (
            <div className="col-span-full py-20 flex justify-center text-[#8996A3]">
              해당 기관에 등록된 캐릭터가 없습니다.
            </div>
          )}
        </div>

        {/* Detail Side Panel */}
        <AnimatePresence>
          {selectedChar && (
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1, transitionEnd: { transform: 'none' } }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="category-route-panel fixed inset-0 z-[150] w-full overflow-y-auto overscroll-contain border-l bg-[#0B1016] shadow-2xl md:bottom-0 md:left-auto md:right-8 md:top-20 md:w-[400px] lg:w-[500px]"
            >
              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#293644] bg-[#0B1016]/95 px-5 py-4 backdrop-blur-md md:px-6">
                <div>
                  <p className="font-mono text-[9px] tracking-[0.22em] text-[#4D8DFF]">CHARACTER DETAIL</p>
                  <p className="mt-1 text-sm font-bold text-white">{selectedChar.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedChar(null)}
                  className="flex min-h-10 items-center gap-2 border border-[#41617C] bg-[#101B27] px-3 text-[11px] font-bold tracking-[0.08em] text-[#B9C7D4] transition-colors hover:border-[#8AB8FF] hover:bg-[#17283A] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#8AB8FF]"
                  aria-label="상세보기 닫기"
                >
                  <span>상세보기 닫기</span>
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 md:p-8">
                <CharacterImageViewer
                  key={selectedChar.id}
                  character={selectedChar}
                  className="mb-8"
                />

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="px-2 py-0.5 text-xs font-bold tracking-widest bg-[#293644] text-[#8AB8FF]">
                        {selectedChar.organization}
                      </span>
                      <span className="text-sm font-mono text-[#E05A63]">Grade {selectedChar.grade}</span>
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-2">{selectedChar.name}</h2>
                    <p className="text-[#8996A3] flex gap-2 text-sm">
                      <span>{selectedChar.gender}</span>
                      <span>•</span>
                      <span>{selectedChar.age}세</span>
                    </p>
                  </div>

                  <div className="h-px w-full bg-[#293644]" />

                  <div>
                    <h4 className="text-xs tracking-widest text-[#8996A3] mb-2 uppercase">Pulse</h4>
                    <p className="text-lg font-bold text-[#4D8DFF] mb-1">{selectedChar.pulse.name}</p>
                    <p className="text-sm text-[#E9EEF3] leading-relaxed">{selectedChar.pulse.description}</p>
                  </div>

                  <div>
                    <h4 className="text-xs tracking-widest text-[#8996A3] mb-2 uppercase">Personality</h4>
                    <p className="text-sm text-[#E9EEF3] leading-relaxed">{selectedChar.personality}</p>
                  </div>

                  <div>
                    <h4 className="text-xs tracking-widest text-[#8996A3] mb-2 uppercase">Features</h4>
                    <p className="text-sm text-[#E9EEF3] leading-relaxed whitespace-pre-wrap">{selectedChar.features}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
