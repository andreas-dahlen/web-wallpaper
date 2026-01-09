// Inject platform before app code runs
if (typeof window !== 'undefined') {
    window.APP_SETTINGS = window.APP_SETTINGS || {};

    // Detect build-time platform
    const platform = import.meta.env.VITE_PLATFORM || 'web';
    window.APP_SETTINGS.platform = platform;

    console.log('[init] platform preloaded as', platform);
}