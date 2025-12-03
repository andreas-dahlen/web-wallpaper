package com.ad.webwallpaper  // keep your actual package name

import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder

class WebWallpaperService : WallpaperService() {
    override fun onCreateEngine(): Engine {
        return WebWallpaperEngine()
    }
}