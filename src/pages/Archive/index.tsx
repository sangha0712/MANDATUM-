import React from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { archiveCategories } from '../../data/archive';
import { BackButton } from '../../components/BackButton';

// Sub-pages
import ArchiveWorld from './World';
import ArchivePulse from './Pulse';
import ArchiveHistory from './History';
import ArchiveIncidents from './Incidents';
import ArchiveCreatures from './Creatures';
import ArchiveSociety from './Society';
import ArchiveRelationships from './Relationships';

function ArchiveGrid() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="mb-5 sm:mb-8">
        <h2 className="category-route-title text-3xl font-bold tracking-widest text-white mb-1">ARCHIVE</h2>
        <p className="category-route-kicker text-sm uppercase tracking-widest">Internal Database System</p>
      </div>
      <div className="category-route-panel border-y bg-[#0B1016]/52 backdrop-blur-sm">
        {archiveCategories.map((cat, index) => (
          <Link
            key={cat.id}
            to={`/archive/${cat.id}`}
            className="category-archive-link group grid min-h-[68px] grid-cols-[38px_1fr_auto] items-center gap-2.5 border-b border-[#293644] px-3 transition-colors last:border-b-0 sm:min-h-[82px] sm:grid-cols-[72px_1fr_auto] sm:gap-4 sm:px-6"
          >
            <span className="category-route-kicker font-mono text-xs tracking-[0.18em] transition-colors">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold tracking-[0.12em] text-[#E9EEF3] transition-colors group-hover:text-white sm:text-lg sm:tracking-[0.16em]">
                {cat.title}
              </h3>
              <p className="mt-1 font-mono text-[9px] tracking-[0.18em] text-[#667687] sm:text-[10px]">
                DATABASE SECTOR / {cat.id.toUpperCase()}
              </p>
            </div>
            <span className="translate-x-0 font-mono text-lg text-[#526577] transition-all group-hover:translate-x-1 group-hover:text-[#8AB8FF]">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Archive() {
  const location = useLocation();
  const isRoot = location.pathname === '/archive' || location.pathname === '/archive/';
  const navigate = useNavigate();

  return (
    <div className="category-archive-content flex-1 flex flex-col max-w-6xl mx-auto w-full relative">
      <BackButton
        onClick={() => navigate(isRoot ? '/' : '/archive', { replace: true })}
      />
      <div className={isRoot ? "" : "mt-8"}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            <Routes>
              <Route index element={<ArchiveGrid />} />
              <Route path="world" element={<ArchiveWorld />} />
              <Route path="pulse" element={<ArchivePulse />} />
              <Route path="history" element={<ArchiveHistory />} />
              <Route path="incidents" element={<ArchiveIncidents />} />
              <Route path="creatures" element={<ArchiveCreatures />} />
              <Route path="society" element={<ArchiveSociety />} />
              <Route path="relationships" element={<ArchiveRelationships />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

