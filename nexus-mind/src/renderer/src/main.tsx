/**
 * Renderer entry. Fonts are bundled locally (no network, CSP-friendly):
 * Tajawal (Arabic + Latin), Inter (UI), Cal Sans (display), JetBrains Mono (code).
 */
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/500.css';
import '@fontsource/tajawal/700.css';
import '@fontsource/tajawal/800.css';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import 'cal-sans';
import './styles/globals.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { matchLocale } from '@shared/locale';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initI18n } from './i18n';

// Start in the OS language; the stored preference is applied as soon as settings load.
initI18n(matchLocale(navigator.language));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
  },
});

const root = document.getElementById('root');
if (!root) throw new Error('#root missing from index.html');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
