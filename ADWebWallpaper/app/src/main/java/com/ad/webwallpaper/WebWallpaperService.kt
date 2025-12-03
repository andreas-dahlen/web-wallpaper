package com.ad.webwallpaper

import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder
import android.webkit.WebView
import android.webkit.WebViewClient
import android.annotation.SuppressLint

class WebWallpaperService : WallpaperService() {

    override fun onCreateEngine(): Engine {
        return WebWallpaperEngine()
    }

    inner class WebWallpaperEngine : Engine() {

        private lateinit var webView: WebView

        @SuppressLint("SetJavaScriptEnabled")
        override fun onCreate(surfaceHolder: SurfaceHolder) {
            super.onCreate(surfaceHolder)

            // Create WebView
            webView = WebView(applicationContext)
            webView.settings.javaScriptEnabled = true
            webView.webViewClient = WebViewClient()

            // Connect JSBridge
            webView.addJavascriptInterface(JSBridge(applicationContext), "Android")

            // Load your HTML
            webView.loadUrl("file:///android_asset/index.html")
            webView.setBackgroundColor(0)

            // Initial layout
            val width = surfaceHolder.surfaceFrame.width()
            val height = surfaceHolder.surfaceFrame.height()
            webView.measure(
                android.view.View.MeasureSpec.makeMeasureSpec(width, android.view.View.MeasureSpec.EXACTLY),
                android.view.View.MeasureSpec.makeMeasureSpec(height, android.view.View.MeasureSpec.EXACTLY)
            )
            webView.layout(0, 0, width, height)
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
                val canvas = it.lockCanvas()
                webView.draw(canvas)
                it.unlockCanvasAndPost(canvas)
            }
        }
    }
}