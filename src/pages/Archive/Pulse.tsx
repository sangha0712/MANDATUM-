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
                펄스는 이 세계에서 초능력을 가리키는 공식 명칭이다. 모든 인간은 잠재적으로 펄스를 발현할 수 있으며,
                능력을 사용할 때마다 체내 에테르가 소모된다.
              </p>
            </div>
            <div className="bg-[#121A23] p-5 border-l-2 border-[#4D8DFF]">
              <h3 className="text-sm tracking-widest text-[#8996A3] mb-2 uppercase">발현 및 세대 분류</h3>
              <p className="text-sm text-[#E9EEF3] leading-relaxed">
                미발현자는 0세대로 분류되며 발현 이후 능력의 위력과 사회적 영향력에 따라 1세대부터 5세대까지 구분된다.
                동일 세대라도 숙련도와 연마 기간에 따라 실제 전투력의 차이는 매우 크다.
              </p>
            </div>
            <div className="bg-[#121A23] p-5 border-l-2 border-[#4D8DFF]">
              <h3 className="text-sm tracking-widest text-[#8996A3] mb-2 uppercase">제한 및 사회적 취급</h3>
              <p className="text-sm text-[#E9EEF3] leading-relaxed">
                펄스에는 선천적인 성장 상한이 없지만 상위 단계일수록 도달 난이도가 급격히 높아진다. 능력을 남발하면
                혈관이 푸르게 물들고 경화되는 ‘에테르 번’이 발생한다. 히어로 조직은 펄스로 인해 발생하는 사건을 담당하며,
                중앙섬의 국가 공인 조직과 지방섬의 민간 조직으로 나뉜다.
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

