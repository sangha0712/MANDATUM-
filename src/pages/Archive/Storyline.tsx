const storyActs = [
  {
    code: 'PROLOGUE',
    title: '도심의 초대형 에이저',
    summary: '도심에 출현한 정체불명의 초대형 에이저를 저지하기 위해 PACTUM이 투입된다.',
    records: [
      '핵을 파괴해도 재생하는 에이저에게서 인위적인 에테르 흐름이 감지된다.',
      '5세대로 각성한 지 얼마 되지 않은 임하린은 불안정한 상태로 작전을 지휘한다.',
      '소환자를 추적한 결과 윤세아의 위치가 특정되고, PC와 타비가 저지 임무를 맡는다.',
    ],
  },
  {
    code: 'ACT 01',
    title: '조작된 재난',
    summary: '재난의 배후를 쫓던 일행은 윤세아와 세이지, 그리고 붙잡힌 각성자들과 마주한다.',
    records: [
      '윤세아와 세이지는 1세대 각성자들의 에테르를 흡수해 펄스를 증강한다.',
      '미리 준비된 전장에서 두 빌런이 우위를 점하고, 수집한 변수를 바탕으로 후퇴를 준비한다.',
      '남은 인질을 노린 공격을 타비가 대신 막아 치명상을 입는다.',
    ],
  },
  {
    code: 'ACT 02',
    title: '압박받는 히어로',
    summary: '작전 이후 비난 여론이 거세지고, 정부는 PACTUM에 공식 기자회견 참석을 요구한다.',
    records: [
      '한유나와 하시연은 연쇄 실종 사건이 언노운 및 크리스와 연결되어 있다고 알린다.',
      '기자회견의 질문은 희생자와 신입 대원의 책임을 문제 삼으며 PC에게 집중된다.',
      '인파 속에 나타난 크리스와 두 에이저가 현장을 습격하고, LADER가 전투에 합류한다.',
    ],
  },
  {
    code: 'ACT 03',
    title: '천공의 관',
    summary: 'LADER가 수집한 정보로 실종 능력자들과 언노운의 공중 요새에 관한 진실이 드러난다.',
    records: [
      '천공의 관은 실종자들의 에테르를 저장한 고출력 병기를 탑재하고 있다.',
      '완충된 병기는 중앙섬과 지방섬 전체를 파괴할 수 있으며 중앙섬 상공에 은신 중이다.',
      '지방 조직들이 각 섬의 에이저와 교전하는 동안 PACTUM과 LADER가 연합 작전을 시작한다.',
    ],
  },
  {
    code: 'FINAL ACT',
    title: '사각지대의 인간들',
    summary: '천공의 관에서 히어로 연합과 언노운의 전면전이 벌어진다.',
    records: [
      '크리스는 파괴된 코어에서 흩어진 에테르를 흡수하고 언노운 구성원들을 각성시킨다.',
      '치명상을 입은 히어로들이 처형당하기 직전, 지방섬 방어를 마친 조직들이 전장에 도착한다.',
      '세계 붕괴가 시작된 가운데 임하린과 크리스가 히어로의 의무와 사회의 사각지대를 두고 결착을 낸다.',
    ],
  },
  {
    code: 'EPILOGUE',
    title: '전투 이후',
    summary: '천공의 관 전투가 끝나고, 공개된 기록은 사회가 외면해 온 진실을 드러낸다.',
    records: [
      '언노운은 해체되고 살아남은 히어로들은 각자의 조직으로 돌아간다.',
      '전투 영상이 확산되며 히어로를 소모품으로 취급했던 여론과 제도를 향한 비판이 시작된다.',
      '에이저가 본래 인간이었다는 사실과 이를 은폐한 정부의 책임이 세상에 공개된다.',
    ],
  },
] as const;

export default function ArchiveStoryline() {
  return (
    <div className="max-w-4xl">
      <header className="mb-8 border-b border-[#293644] pb-6 sm:mb-10">
        <div className="mb-3 flex items-center gap-3 font-mono text-[9px] tracking-[0.24em] text-[#8AB8FF]">
          <span className="h-1.5 w-1.5 bg-[#4D8DFF] shadow-[0_0_10px_#4D8DFF]" />
          NARRATIVE RECORD / SECTOR 01
        </div>
        <h1 className="mb-2 text-3xl font-bold tracking-widest text-white sm:text-4xl">STORYLINE</h1>
        <p className="text-sm leading-6 text-[#8996A3]">MANDATUM 메인 스토리 기록 · 기밀 문서 포함</p>
      </header>

      <section className="mb-10 border border-[#31506A] bg-[linear-gradient(135deg,rgba(77,141,255,0.12),rgba(8,16,25,0.94))] p-5 shadow-[0_0_24px_rgba(77,141,255,0.08)] sm:p-7">
        <p className="mb-3 font-mono text-[10px] tracking-[0.2em] text-[#8AB8FF]">STORY OVERVIEW</p>
        <h2 className="mb-4 text-xl font-bold leading-8 text-white sm:text-2xl">영웅을 인간으로 남겨두지 않는 세계</h2>
        <div className="space-y-3 text-sm leading-7 text-[#C6D1DA] sm:text-[15px]">
          <p>다섯 개의 공중섬만이 인류가 살아갈 수 있는 세계. 빌런과 에이저의 위협 속에서 히어로들은 시민을 지키기 위해 끊임없이 현장으로 향한다.</p>
          <p>이야기는 세간의 압박과 무례, 과로, 동료와 혈육의 죽음 속에서도 구조를 멈출 수 없는 히어로들을 따라간다. 누군가를 구하는 직업의 의무와 한 인간이 보장받아야 할 권리가 충돌하는 순간을 다룬다.</p>
        </div>
      </section>

      <div className="mb-4 flex items-end justify-between gap-4 border-b border-[#293644] pb-3">
        <div>
          <p className="font-mono text-[9px] tracking-[0.22em] text-[#667687]">OPERATION TIMELINE</p>
          <h2 className="mt-1 text-lg font-bold tracking-[0.14em] text-white">MAIN RECORDS</h2>
        </div>
        <span className="border border-[#A94E5B]/50 bg-[#A94E5B]/10 px-2 py-1 font-mono text-[8px] tracking-[0.18em] text-[#E18591]">SPOILER / CLASSIFIED</span>
      </div>

      <div className="space-y-3">
        {storyActs.map((act, index) => (
          <details key={act.code} className="group border border-[#293644] bg-[#0B1016]/88 open:border-[#4D8DFF]/60 open:shadow-[0_0_20px_rgba(77,141,255,0.08)]">
            <summary className="grid cursor-pointer list-none grid-cols-[38px_1fr_auto] items-center gap-3 p-4 marker:hidden sm:grid-cols-[58px_1fr_auto] sm:p-5">
              <span className="font-mono text-[10px] tracking-[0.18em] text-[#4D8DFF]">{String(index + 1).padStart(2, '0')}</span>
              <div className="min-w-0">
                <p className="mb-1 font-mono text-[8px] tracking-[0.22em] text-[#7895A9] sm:text-[9px]">{act.code}</p>
                <h3 className="text-sm font-bold tracking-[0.08em] text-[#E9EEF3] sm:text-base">{act.title}</h3>
              </div>
              <span className="font-mono text-lg text-[#607A8E] transition-transform group-open:rotate-45 group-open:text-[#8AB8FF]">＋</span>
            </summary>

            <div className="border-t border-[#293644] px-4 pb-5 pt-4 sm:px-5 sm:pb-6">
              <p className="mb-5 border-l-2 border-[#4D8DFF] pl-3 text-sm leading-6 text-[#B8C6D1]">{act.summary}</p>
              <div className="space-y-3">
                {act.records.map((record, recordIndex) => (
                  <div key={record} className="grid grid-cols-[28px_1fr] gap-2 text-sm leading-6 text-[#97A8B6]">
                    <span className="font-mono text-[9px] text-[#4D8DFF]">{String(recordIndex + 1).padStart(2, '0')}</span>
                    <p>{record}</p>
                  </div>
                ))}
              </div>
            </div>
          </details>
        ))}
      </div>

      <p className="mt-6 text-center font-mono text-[8px] tracking-[0.2em] text-[#526577]">SELECT A RECORD TO DECRYPT CLASSIFIED DATA</p>
    </div>
  );
}
