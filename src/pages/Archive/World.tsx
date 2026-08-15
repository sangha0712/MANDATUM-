import React from 'react';
import { heroOrganizationDetails, islands } from '../../data/world';

function getIslandOrganizations(organization: string) {
  return organization === 'LADER & PACTUM'
    ? [heroOrganizationDetails.LADER, heroOrganizationDetails.PACTUM]
    : [heroOrganizationDetails[organization as keyof typeof heroOrganizationDetails]];
}

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
            인류는 중앙섬을 중심으로 동·서·남·북에 형성된 다섯 개의 거대 공중섬에 거주한다. 공중섬 아래에는 수많은 에이저가 존재하며, 최근에는 인간 거주 구역까지 출몰하는 사례가 빈번해지고 있다.
          </p>
          <p className="text-[#E9EEF3] leading-relaxed">
            중앙섬의 LADER와 PACTUM은 국가 공인 조직이다. 반면 지방섬의 ORIA·SOLARIA·EASTER·NIVALI는 국가 공인 조직이 아닌 민간 히어로 조직이며, 지역 사정에 맞춘 독자 판단으로 중앙섬보다 빠르게 초기 대응하는 경우가 많다.
          </p>
        </section>

        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-[#4D8DFF] mb-4 border-b border-[#293644] pb-2">지역별 구조</h2>
          
          {islands.map((island) => (
            <div key={island.id} className="border border-[#293644] bg-[#121A23] p-5 sm:p-6">
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
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

              <div className="mt-4 border-t border-[#293644] pt-4">
                <p className="text-sm leading-6 text-[#D4DEE6]">{island.description}</p>
                <p className="mt-2 border-l border-[#4D8DFF] pl-3 text-xs leading-5 text-[#8FA6B8]">{island.securityNote}</p>
              </div>

              <div className="mt-5 grid gap-3">
                {getIslandOrganizations(island.organization).map((organization) => (
                  <article key={organization.name} className="border border-[#294258] bg-[#0B141E] p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <strong className="tracking-[0.16em] text-white">{organization.name}</strong>
                      <span className={organization.status === '국가 공인'
                        ? 'border border-[#4D8DFF]/60 bg-[#4D8DFF]/10 px-2 py-1 font-mono text-[9px] tracking-widest text-[#8AB8FF]'
                        : 'border border-[#D8A44B]/60 bg-[#D8A44B]/10 px-2 py-1 font-mono text-[9px] tracking-widest text-[#E8BE72]'}>
                        {organization.status}
                      </span>
                    </div>
                    <div className="grid gap-2 text-xs sm:grid-cols-2">
                      <p className="text-[#8996A3]">LEADER <span className="ml-2 text-[#E9EEF3]">{organization.leader}</span></p>
                      <p className="text-[#8996A3]">AREA <span className="ml-2 text-[#E9EEF3]">{organization.jurisdiction}</span></p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#B8C6D1]">{organization.role}</p>
                    <p className="mt-2 text-xs leading-5 text-[#7895A9]">{organization.response}</p>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

