import React from 'react';

export default function ArchiveHistory() {
  return (
    <div className="max-w-3xl">
      <header className="mb-10 border-b border-[#293644] pb-6">
        <h1 className="text-4xl font-bold tracking-widest text-white mb-2">HISTORY</h1>
        <p className="text-[#8996A3]">세계의 기록된 역사</p>
      </header>

      <div className="relative py-10">
        <div className="absolute left-[7px] top-0 bottom-0 w-px bg-[#293644]" />
        
        <div className="space-y-12">
          <div className="relative pl-8">
            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-[#4D8DFF] bg-[#0B1016]" />
            <span className="text-xs font-mono text-[#8996A3] tracking-widest mb-2 block">[ 기원 미상 ]</span>
            <h3 className="text-xl font-bold text-white mb-2">최초의 에이저 '아담' 등장</h3>
            <p className="text-sm text-[#E9EEF3] leading-relaxed">
              기록상 확인된 최초의 에이저 '아담'이 세계에 등장했다. 출현 배경과 구체적인 시기는 유실되었다.
            </p>
          </div>

          <div className="relative pl-8">
            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-[#4D8DFF] bg-[#0B1016]" />
            <span className="text-xs font-mono text-[#8996A3] tracking-widest mb-2 block">[ 발현 이후 ]</span>
            <h3 className="text-xl font-bold text-white mb-2">아담의 진화 및 유전자 확산</h3>
            <p className="text-sm text-[#E9EEF3] leading-relaxed">
              아담은 얼마 지나지 않아 완전한 인간의 형태로 진화하였다. 이후 그의 펄스 유전자가 점차 인류 전체로 퍼져나가기 시작했다.
            </p>
          </div>

          <div className="relative pl-8">
            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-[#8996A3] bg-[#0B1016]" />
            <span className="text-xs font-mono text-[#8996A3] tracking-widest mb-2 block">[ 현재 ]</span>
            <h3 className="text-xl font-bold text-white mb-2">능력자 사회의 형성</h3>
            <p className="text-sm text-[#E9EEF3] leading-relaxed opacity-70">
              아담에게서 시작된 펄스 유전자가 인류 전반으로 확산되며 현재의 초능력 사회가 형성되었다.
              초기 연대의 일부 기록은 소실되었으나, 현재 복원된 자료는 제한 없이 열람할 수 있다.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-12 p-6 border border-[#293644] bg-[#121A23] text-center">
        <p className="text-xs tracking-widest text-[#8AB8FF] uppercase">현재 복원된 역사 기록 전체가 공개되어 있습니다.</p>
      </div>
    </div>
  );
}

