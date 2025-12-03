package com.ad.webwallpaper  // keep your package

import android.graphics.Canvas
import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder
import android.webkit.WebView
import android.webkit.WebViewClient

class WebWallpaperEngine : WallpaperService.Engine() {

    private lateinit var webView: WebView

    override fun onCreate(surfaceHolder: SurfaceHolder) {
        super.onCreate(surfaceHolder)

        webView = WebView(applicationContext)
        webView.settings.javaScriptEnabled = true
        webView.webViewClient = WebViewClient()

        webView.addJavascriptInterface(JSBridge(applicationContext), "Android")
        webView.loadUrl("file:///android_asset/index.html")
        webView.setBackgroundColor(0)
    }

    override fun onVisibilityChanged(visible: Boolean) {
        super.onVisibilityChanged(visible)
        if (visible) webView.onResume() else webView.onPause()
    }

    override fun onDestroy() {
        super.onDestroy()
        webView.destroy()
    }

    override fun onSurfaceChanged(holder: SurfaceHolder?, format: Int, width: Int, height: Int) {
        super.onSurfaceChanged(holder, format, width, height)
        webView.layout(0, 0, width, height)
    }

    override fun onSurfaceRedrawNeeded(holder: SurfaceHolder?) {
        super.onSurfaceRedrawNeeded(holder)
        holder?.let {
            val canvas: Canvas = it.lockCanvas()
            webView.draw(canvas)
            it.unlockCanvasAndPost(canvas)
        }
    }
}