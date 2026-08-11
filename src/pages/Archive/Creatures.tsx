import React from 'react';
import { creatures } from '../../data/archive';
import { ImagePlaceholder } from '../../components/ImagePlaceholder';

export default function ArchiveCreatures() {
  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="mb-10 border-b border-[#293644] pb-6">
        <h1 className="text-4xl font-bold tracking-widest text-white mb-2">CREATURES</h1>
        <p className="text-[#8996A3]">에이저 및 괴물 도감</p>
      </header>

      {creatures.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border border-dashed border-[#293644] bg-[#121A23] p-12 min-h-[400px]">
          <div className="text-center">
            <p className="text-[#8996A3] tracking-widest uppercase">등록된 에이저 데이터가 없습니다.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {creatures.map((creature) => (
            <div key={creature.id} className="border border-[#293644] bg-[#121A23] overflow-hidden group">
              <div className="aspect-square relative">
                <ImagePlaceholder src={creature.image} text="CREATURE" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/80 border border-[#E05A63] text-[#E05A63] text-xs font-mono font-bold">
                  Lv.{creature.riskLevel}
                </div>
              </div>
              <div className="p-3 border-t border-[#293644]">
                <h3 className="text-sm font-bold text-white group-hover:text-[#4D8DFF] transition-colors">
                  {creature.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
