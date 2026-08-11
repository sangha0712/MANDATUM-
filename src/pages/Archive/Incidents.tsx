import React from 'react';
import { incidents } from '../../data/archive';
import { ImagePlaceholder } from '../../components/ImagePlaceholder';

export default function ArchiveIncidents() {
  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="mb-10 border-b border-[#293644] pb-6">
        <h1 className="text-4xl font-bold tracking-widest text-white mb-2">INCIDENTS</h1>
        <p className="text-[#8996A3]">사건 및 재해 아카이브</p>
      </header>

      {incidents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border border-dashed border-[#293644] bg-[#121A23] p-12 min-h-[400px]">
          <div className="text-center">
            <p className="text-[#8996A3] tracking-widest uppercase">등록된 사건 기록이 없습니다.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {incidents.map((incident) => (
            <div key={incident.id} className="border border-[#293644] bg-[#121A23] flex overflow-hidden">
              <div className="w-32 sm:w-48 flex-shrink-0">
                <ImagePlaceholder src={incident.image} text="INCIDENT" className="w-full h-full object-cover" />
              </div>
              <div className="p-4 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white">{incident.title}</h3>
                  <span className="text-xs bg-[#E05A63]/10 text-[#E05A63] border border-[#E05A63]/30 px-2 py-0.5">
                    {incident.location}
                  </span>
                </div>
                <p className="text-sm text-[#E9EEF3] mb-4 line-clamp-2">{incident.summary}</p>
                <div className="flex justify-between items-end">
                  <div className="text-xs text-[#8996A3]">
                    <span className="block uppercase mb-1">Related</span>
                    {incident.relatedCharacters.join(', ')}
                  </div>
                  <div className="text-xs text-right">
                    <span className="block uppercase text-[#8996A3] mb-1">Result</span>
                    <span className="text-[#4D8DFF]">{incident.result}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
