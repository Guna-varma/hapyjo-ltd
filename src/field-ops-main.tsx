/**
 * Entry point for the Field Operations app (/app).
 *
 * Separate from src/main.tsx on purpose: the marketing site is a multi-page static
 * build and this is a single-page app, so they get separate Vite entries and
 * therefore separate bundles. Nothing here is loaded by the marketing pages.
 */
import { createRoot } from 'react-dom/client';
import FieldOpsApp from '@/field-ops/FieldOpsApp';
import './field-ops/field-ops.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

// `fo-app` scopes the app-only CSS (scrollbars, focus rings, icon layout).
container.classList.add('fo-app');

createRoot(container).render(<FieldOpsApp />);
