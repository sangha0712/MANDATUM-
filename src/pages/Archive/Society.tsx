import React from 'react';

const GENERATIONS = [
  {
    generation: '0',
    title: '미발현자',
    description: '현재 발현된 능력은 없으나, 모든 인간과 마찬가지로 언제든 펄스가 발현할 수 있다.',
    marker: 'LATENT',
    color: '#64788A',
  },
  {
    generation: '1',
    title: '초기 발현',
    description: '펄스가 처음 발현된 단계. 능력의 형태와 출력이 아직 충분히 정립되지 않았다.',
    marker: 'AWAKENED',
    color: '#4D8DFF',
  },
  {
    generation: '2',
    title: '전투 활용',
    description: '자신의 능력을 이해하고 전투 상황에서 효율적으로 활용할 수 있는 단계.',
    marker: 'TACTICAL',
    color: '#39B9E6',
  },
  {
    generation: '3',
    title: '고출력 능력자',
    description: '전투력과 출력이 크게 강화된 단계. 단독으로 하나의 마을을 괴멸시킬 수 있다.',
    marker: 'TOWN-LEVEL',
    color: '#D8A44B',
  },
  {
    generation: '4',
    title: '지역 전복급',
    description: '단독으로 하나의 지역 질서와 지배 체계를 전복할 수 있는 단계.',
    marker: 'REGION-LEVEL',
    color: '#E4775E',
  },
  {
    generation: '5',
    title: '국가 전복급',
    description: '단독 국가 전복이 가능한 최고위 단계. 이 단계의 능력자는 노화하지 않는다.',
    marker: 'NATION-LEVEL',
    color: '#F05262',
  },
] as const;

const CURRENT_ISSUES = [
  {
    code: 'CIVIL-01',
    severity: 'UNSTABLE',
    title: '치안 불신과 반히어로 여론',
    description: '관리되지 않는 능력 범죄와 치안 공백에 시민 불만이 폭주하고 있으며, 히어로에 대한 사회적 여론 역시 좋지 않다.',
  },
  {
    code: 'MISSING-02',
    severity: 'CRITICAL',
    title: '능력자 연쇄 실종',
    description: '근 몇 년 동안 매년 수백 명 규모의 능력자가 실종되고 있다. 정확한 원인과 생존 여부는 확인되지 않았다.',
  },
  {
    code: 'BROADCAST-03',
    severity: 'CRITICAL',
    title: '임효린 피살 생중계 사건',
    description: '실종자 구출 작전에 투입된 임하린의 동생 임효린이 빌런 리더에게 살해당하는 장면이 생중계되었다.',
  },
  {
    code: 'LOCAL-04',
    severity: 'SEVERE',
    title: '지방섬 히어로 인력난',
    description: '중앙과 비교해 지방 공중섬의 히어로 인력이 현저히 부족해 구조·치안 대응의 공백이 지속되고 있다.',
  },
  {
    code: 'AGER-05',
    severity: 'ESCALATING',
    title: '공중섬 내 에이저 출몰',
    description: '본래 공중섬 하부에 밀집한 것으로 알려진 에이저가 인간 거주 공중섬에 출몰하는 사례가 빈번해지고 있다.',
  },
] as const;

function SectionHeading({ code, title, description }: {
  code: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 border-b border-[#274358] pb-4">
      <div className="mb-2 font-mono text-[9px] tracking-[0.2em] text-[#4D8DFF]">{code}</div>
      <h2 className="text-xl font-bold tracking-[0.12em] text-white sm:text-2xl">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8496A5]">{description}</p>
    </div>
  );
}

export default function ArchiveSociety() {
  return (
    <div className="w-full max-w-6xl">
      <header className="mb-8 border-b border-[#293644] pb-6">
        <div className="mb-3 flex items-center gap-2 font-mono text-[9px] tracking-[0.24em] text-[#4D8DFF]">
          <span className="h-1.5 w-1.5 bg-[#4D8DFF] shadow-[0_0_8px_rgba(77,141,255,0.8)]" />
          CIVILIZATION STATUS DATABASE
        </div>
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h1 className="mb-2 text-4xl font-bold tracking-widest text-white">SOCIETY</h1>
            <p className="text-[#8996A3]">사회 구조, 펄스 세대 분류 및 현재 위기 기록</p>
          </div>
          <div className="grid grid-cols-3 border border-[#293644] bg-[#09111A]/85 font-mono text-[8px] tracking-[0.12em] text-[#7890A3] sm:text-[9px]">
            <div className="border-r border-[#293644] px-3 py-2.5 text-center">
              <b className="mb-1 block text-xs text-[#8AB8FF]">ALL</b>LATENT
            </div>
            <div className="border-r border-[#293644] px-3 py-2.5 text-center">
              <b className="mb-1 block text-xs text-[#8AB8FF]">05</b>ISLANDS
            </div>
            <div className="px-3 py-2.5 text-center">
              <b className="mb-1 block text-xs text-[#8AB8FF]">0—5</b>GENERATION
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-7">
        <section className="border border-[#293644] bg-[#0B141E]/88 p-5 sm:p-7">
          <SectionHeading
            code="SECTOR 01 / SOCIAL ORDER"
            title="능력 발현 사회"
            description="이 세계에서 능력자와 비능력자는 고정된 신분이 아니다. 모든 인간이 잠재적 능력자이며, 미발현 상태도 언제든 변할 수 있다."
          />

          <div className="grid gap-3 lg:grid-cols-3">
            <article className="border-l-2 border-[#4D8DFF] bg-[#111C27] p-5">
              <div className="mb-3 font-mono text-[9px] tracking-[0.18em] text-[#66849A]">01 / LATENT HUMANITY</div>
              <h3 className="mb-2 text-base font-bold text-white">전 인류가 잠재적 능력자</h3>
              <p className="text-sm leading-6 text-[#B5C2CD]">
                아직 능력이 없는 인간도 0세대 미발현자로 분류된다. 펄스는 예고 없이 발현할 수 있다.
              </p>
            </article>
            <article className="border-l-2 border-[#D88D4B] bg-[#111C27] p-5">
              <div className="mb-3 font-mono text-[9px] tracking-[0.18em] text-[#66849A]">02 / PUBLIC SAFETY</div>
              <h3 className="mb-2 text-base font-bold text-white">상시 불안정한 질서</h3>
              <p className="text-sm leading-6 text-[#B5C2CD]">
                돌발 발현과 폭주, 펄스를 이용한 범죄가 반복되며 기존 치안 체계가 모든 사건을 통제하지 못한다.
              </p>
            </article>
            <article className="border-l-2 border-[#47B7DC] bg-[#111C27] p-5">
              <div className="mb-3 font-mono text-[9px] tracking-[0.18em] text-[#66849A]">03 / HABITATION</div>
              <h3 className="mb-2 text-base font-bold text-white">다섯 개의 거대 공중섬</h3>
              <p className="text-sm leading-6 text-[#B5C2CD]">
                인류는 중앙·동·서·남·북의 공중섬에 거주한다. 공중섬 아래에는 수많은 에이저가 존재한다.
              </p>
            </article>
          </div>
        </section>

        <section className="grid gap-7 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="border border-[#293644] bg-[#0B141E]/88 p-5 sm:p-7">
            <SectionHeading
              code="SECTOR 02 / HERO LICENSE"
              title="히어로 면허 체계"
              description="펄스의 발현만으로 히어로가 될 수는 없다. 정식 활동에는 특수 고등학교 재학 중 자격 시험에 합격해 취득하는 히어로 면허가 필요하다."
            />

            <div className="relative grid gap-3 sm:grid-cols-3">
              <div className="hidden sm:absolute sm:left-[16%] sm:right-[16%] sm:top-5 sm:block sm:border-t sm:border-dashed sm:border-[#31516A]" />
              {[
                ['01', '특수 고등학교', '히어로 면허 취득 과정이 운영되는 특수 고등학교에 재학한다.'],
                ['02', '자격증 취득 시험', '재학 중 정식 히어로 자격증 취득 시험에 응시한다.'],
                ['03', '히어로 면허', '시험 합격자에게만 정식 활동이 가능한 면허가 발급된다.'],
              ].map(([step, title, description]) => (
                <article key={step} className="relative z-10 bg-[#101A25] p-4 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[#4D8DFF] bg-[#08121D] font-mono text-[10px] text-[#8AB8FF] shadow-[0_0_14px_rgba(77,141,255,0.18)]">
                    {step}
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs leading-5 text-[#8E9FAC]">{description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="border border-[#293644] bg-[#0B141E]/88 p-5 sm:p-7">
            <SectionHeading
              code="SECTOR 03 / PULSE COST"
              title="펄스와 에테르"
              description="펄스는 초능력의 공식 명칭이며, 모든 사용에는 체내 에테르가 소모된다."
            />

            <div className="space-y-3">
              <article className="border border-[#294258] bg-[#101A25] p-4">
                <div className="mb-2 font-mono text-[9px] tracking-[0.18em] text-[#4D8DFF]">GROWTH LIMIT</div>
                <h3 className="mb-2 text-sm font-bold text-white">선천적 성장 한계 없음</h3>
                <p className="text-sm leading-6 text-[#AAB8C3]">
                  이론상 펄스에는 선천적인 성장 상한이 없다. 다만 상위 단계로 갈수록 도달 난이도가 폭증한다.
                </p>
              </article>
              <article className="border border-[#395A70] bg-[linear-gradient(100deg,rgba(23,80,108,0.22),rgba(16,26,37,0.96))] p-4">
                <div className="mb-2 font-mono text-[9px] tracking-[0.18em] text-[#66CFF2]">AETHER BURN</div>
                <h3 className="mb-2 text-sm font-bold text-white">에테르 번</h3>
                <p className="text-sm leading-6 text-[#AFC4D0]">
                  펄스를 남발하면 혈관이 푸르게 물들고 점차 경화된다. 반복 사용이 신체에 남기는 명확한 위험 신호다.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="border border-[#293644] bg-[#0B141E]/88 p-5 sm:p-7">
          <SectionHeading
            code="SECTOR 04 / GENERATION SCALE"
            title="펄스 세대 분류"
            description="세대는 능력의 위력과 사회적 영향력을 나타내는 분류 체계다. 동일 세대라도 숙련도와 연마 기간에 따라 실제 실력차는 막대하다."
          />

          <div className="grid gap-2 md:grid-cols-2">
            {GENERATIONS.map((item) => (
              <article
                key={item.generation}
                className="grid min-h-[118px] grid-cols-[76px_1fr] border bg-[#101923]"
                style={{ borderColor: `${item.color}66` }}
              >
                <div
                  className="flex flex-col items-center justify-center border-r text-center"
                  style={{
                    borderColor: `${item.color}55`,
                    background: `linear-gradient(145deg, ${item.color}20, rgba(5, 13, 21, 0.8))`,
                  }}
                >
                  <span className="font-mono text-[8px] tracking-[0.14em]" style={{ color: item.color }}>GEN</span>
                  <strong className="text-3xl text-white">{item.generation}</strong>
                </div>
                <div className="p-4">
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold text-white">{item.title}</h3>
                    <span className="font-mono text-[8px] tracking-[0.13em]" style={{ color: item.color }}>{item.marker}</span>
                  </div>
                  <p className="text-xs leading-5 text-[#9DACB8] sm:text-sm sm:leading-6">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border border-[#4E3339] bg-[#150F14]/92 p-5 sm:p-7">
          <SectionHeading
            code="SECTOR 05 / ACTIVE SOCIAL THREATS"
            title="현재 사회 이슈"
            description="공개 기록과 사건 보고에서 확인된 사회 불안 요소. 다수 항목이 현재 진행 중이다."
          />

          <div className="divide-y divide-[#3D2B31] border-y border-[#3D2B31]">
            {CURRENT_ISSUES.map((issue, index) => (
              <article key={issue.code} className="grid gap-3 py-4 sm:grid-cols-[44px_130px_1fr] sm:items-start">
                <span className="font-mono text-[10px] text-[#6E7780]">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <span className="block font-mono text-[8px] tracking-[0.13em] text-[#D96873]">{issue.severity}</span>
                  <span className="mt-1 block font-mono text-[8px] tracking-[0.1em] text-[#776169]">{issue.code}</span>
                </div>
                <div>
                  <h3 className="mb-1.5 text-sm font-bold text-white sm:text-base">{issue.title}</h3>
                  <p className="text-sm leading-6 text-[#B8AAB0]">{issue.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="relative overflow-hidden border border-[#8C2937] bg-[#12080C] p-5 shadow-[inset_0_0_45px_rgba(132,22,41,0.12)] sm:p-7"
          style={{
            backgroundImage: 'repeating-linear-gradient(135deg, rgba(159, 39, 58, 0.035) 0, rgba(159, 39, 58, 0.035) 8px, transparent 8px, transparent 18px)',
          }}
        >
          <div className="absolute right-4 top-4 border border-[#8C2937] px-2 py-1 font-mono text-[8px] tracking-[0.16em] text-[#D75B6A]">
            DISCLOSED
          </div>
          <div className="mb-4 font-mono text-[9px] tracking-[0.2em] text-[#C04455]">LEVEL BLACK / AGER RECORD</div>
          <h2 className="mb-4 text-2xl font-bold tracking-[0.16em] text-white">에이저</h2>
          <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <p className="text-sm leading-7 text-[#C8B6BB]">
              에테르를 받아들이지 못해 인간의 형태를 잃고 괴물이 된 존재. 펄스 각성에 실패했을 때 발생한다.
              에이저의 발생 원인과 인간과의 연관성은 세간에 공표되지 않았다.
            </p>
            <div className="border-l-2 border-[#A73546] bg-[#1B0D12] p-4">
              <div className="mb-2 font-mono text-[8px] tracking-[0.17em] text-[#B44A5A]">PUBLIC DISCLOSURE STATUS</div>
              <strong className="block text-lg tracking-wider text-[#F1D9DE]">아카이브 열람 가능</strong>
              <p className="mt-2 text-xs leading-5 text-[#94787F]">
                각성 실패와 에이저 발생 사이의 인과관계가 본 아카이브에는 공개되어 있다. 세계관 내 일반 시민에게는 아직 알려지지 않은 정보다.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

