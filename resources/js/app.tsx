import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: async (name) => {
        // Conditionally load kiosk.css only for kiosk pages
        if (name.startsWith('kiosk/')) {
            await import('../css/kiosk.css');
        }

        return resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        );
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        // Coin-operated theme: amber/gold progress bar
        color: '#fbbf24', // amber-400
        delay: 250,
        includeCSS: true,
        showSpinner: false,
    },
});

// This will set light / dark mode on load...
initializeTheme();
