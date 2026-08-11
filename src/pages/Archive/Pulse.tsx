import React from 'react';
import { characters } from '../../data/characters';

export default function ArchivePulse() {
  return (
    <div className="max-w-4xl">
      <header className="mb-10 border-b border-[#293644] pb-6">
        <h1 className="text-4xl font-bold tracking-widest text-white mb-2">PULSE</h1>
        <p className="text-[#8996A3]">초능력 발현 메커니즘 및 펄스 인덱스</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section>
          <h2 className="text-2xl font-bold text-[#4D8DFF] mb-6">설정 아카이브</h2>
          <div className="space-y-6">
            <div className="bg-[#121A23] p-5 border-l-2 border-[#4D8DFF]">
              <h3 className="text-sm tracking-widest text-[#8996A3] mb-2 uppercase">펄스(Pulse)란 무엇인가</h3>
              <p className="text-sm text-[#E9EEF3] leading-relaxed">
                [데이터 접근 제한: 상세 설정 미공개]
              </p>
            </div>
            <div className="bg-[#121A23] p-5 border-l-2 border-[#4D8DFF]">
              <h3 className="text-sm tracking-widest text-[#8996A3] mb-2 uppercase">발현 및 등급</h3>
              <p className="text-sm text-[#E9EEF3] leading-relaxed">
                [데이터 접근 제한: 상세 설정 미공개]
              </p>
            </div>
            <div className="bg-[#121A23] p-5 border-l-2 border-[#4D8DFF]">
              <h3 className="text-sm tracking-widest text-[#8996A3] mb-2 uppercase">제한 및 사회적 취급</h3>
              <p className="text-sm text-[#E9EEF3] leading-relaxed">
                [데이터 접근 제한: 상세 설정 미공개]
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#4D8DFF] mb-6">PULSE INDEX</h2>
          <div className="space-y-3">
            {characters.map((char) => (
              <div key={char.id} className="border border-[#293644] p-4 bg-[#121A23] hover:border-[#8AB8FF] transition-colors">
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="text-lg font-bold text-white">{char.pulse.name}</h3>
                  <span className="text-xs tracking-widest text-[#8996A3]">User: {char.name}</span>
                </div>
                <p className="text-sm text-[#E9EEF3]">{char.pulse.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
