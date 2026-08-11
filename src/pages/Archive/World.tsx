import React from 'react';
import { islands } from '../../data/world';

export default function ArchiveWorld() {
  return (
    <div className="max-w-3xl">
      <header className="mb-10 border-b border-[#293644] pb-6">
        <h1 className="text-4xl font-bold tracking-widest text-white mb-2">WORLD</h1>
        <p className="text-[#8996A3]">세계 전체 개요 및 각 섬의 구조</p>
      </header>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-[#4D8DFF] mb-4">세계 전체 개요</h2>
          <p className="text-[#E9EEF3] leading-relaxed mb-4">
            본 세계관은 크게 5개의 섬으로 이루어져 있다. 중앙섬을 중심으로 동, 서, 남, 북에 각각 하나의 섬이 자리 잡고 있는 형태이다. 각 섬은 기후, 문화, 인프라 등에서 독특한 특징을 가지며, 이를 관리하는 독립적인 히어로 조직이 존재한다.
          </p>
          <p className="text-[#E9EEF3] leading-relaxed">
            중앙섬과 외곽 섬 사이에는 뚜렷한 인프라 및 기술 격차가 존재하며, 이는 인구 이동과 히어로 배치에도 큰 영향을 미치고 있다.
          </p>
        </section>

        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-[#4D8DFF] mb-4 border-b border-[#293644] pb-2">지역별 구조</h2>
          
          {islands.map((island) => (
            <div key={island.id} className="bg-[#121A23] p-6 border border-[#293644]">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">{island.name}</h3>
                <span className="px-3 py-1 bg-[#18232F] text-xs tracking-widest text-[#8AB8FF] border border-[#293644]">
                  {island.organization}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-[#8996A3] uppercase tracking-widest mb-1 text-xs">Climate</span>
                  <span className="text-[#E9EEF3]">{island.climate}</span>
                </div>
                <div>
                  <span className="block text-[#8996A3] uppercase tracking-widest mb-1 text-xs">Infrastructure</span>
                  <span className="text-[#E9EEF3]">{island.cityLevel}</span>
                </div>
              </div>
              
              {island.id === 'center' && (
                <div className="mt-4 pt-4 border-t border-[#293644]">
                  <p className="text-sm text-[#E9EEF3] leading-relaxed">
                    현대 도시의 인프라가 완전히 갖춰진 대도시형 섬. 고층 건물, 대형 도로, 상업 시설 등이 밀집해 있어 다른 네 섬에 비해 압도적으로 발전된 형태를 띤다.
                  </p>
                </div>
              )}
              {island.id === 'north' && (
                <div className="mt-4 pt-4 border-t border-[#293644]">
                  <p className="text-sm text-[#E9EEF3] leading-relaxed">
                    눈, 냉기 등 차가운 자연환경이 지배적인 곳. 인력이 부족한 상황이 자주 발생한다.
                  </p>
                </div>
              )}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
