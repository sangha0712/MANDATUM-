/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';

const Characters = lazy(() => import('./pages/Characters'));
const Webtoon = lazy(() => import('./pages/Webtoon'));
const Archive = lazy(() => import('./pages/Archive'));
const World = lazy(() => import('./pages/World'));

function RouteLoading() {
  return (
    <div className="flex min-h-[50vh] flex-1 items-center justify-center">
      <div className="border border-[#294055] bg-[#07101A]/90 px-5 py-3 font-mono text-[10px] tracking-[0.24em] text-[#8AB8FF]">
        LOADING SECTOR...
      </div>
    </div>
  );
}

function DeferredRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteLoading />}>{children}</Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="world" element={<DeferredRoute><World /></DeferredRoute>} />
          <Route path="characters" element={<DeferredRoute><Characters /></DeferredRoute>} />
          <Route path="webtoon" element={<DeferredRoute><Webtoon /></DeferredRoute>} />
          <Route path="archive/*" element={<DeferredRoute><Archive /></DeferredRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
