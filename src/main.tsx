import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {MediaLoadNotice} from './components/MediaLoadNotice';
import {registerPersistentImageCache} from './utils/persistentImageCache';

void registerPersistentImageCache();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MediaLoadNotice>
      <App />
    </MediaLoadNotice>
  </StrictMode>,
);
