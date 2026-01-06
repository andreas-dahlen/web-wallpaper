
import { APP_SETTINGS } from './appSettings.js';

export function exportCSS() {
    const root = document.documentElement;


    root.style.setProperty('--phone-height', `${APP_SETTINGS.phone.height}px`);
    root.style.setProperty('--phone-width', `${APP_SETTINGS.phone.width}px`);

    root.style.setProperty('--Wallpaper-height', `${APP_SETTINGS.ui.wallpaperHeight}px`);
    root.style.setProperty('--Wallpaper-width', `${APP_SETTINGS.ui.wallpaperWidth}px`);

    root.style.setProperty('--lane-height', `${APP_SETTINGS.ui.laneHeight}px`);
    root.style.setProperty('--lane-width', `${APP_SETTINGS.ui.laneWidth}px`);

    //   Root for others can be added later
}