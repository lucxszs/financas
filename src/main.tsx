import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import fonteBandeiras from 'country-flag-emoji-polyfill/dist/TwemojiCountryFlags.woff2?url';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

// O Windows não desenha bandeiras emoji (mostra "BR", "US"). Nesses casos carrega uma
// fonte só com as bandeiras, servida pelo próprio site. Nos demais sistemas não faz nada.
polyfillCountryFlagEmojis('Twemoji Country Flags', fonteBandeiras);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
