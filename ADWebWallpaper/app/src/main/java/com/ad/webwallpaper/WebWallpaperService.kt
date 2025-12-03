package com.ad.webwallpaper

import android.annotation.SuppressLint
import android.os.Handler
import android.os.Looper
import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder
import android.view.View
import android.webkit.WebView
import android.webkit.WebViewClient

class WebWallpaperService : WallpaperService() {

    override fun onCreateEngine(): Engine {
        return WebWallpaperEngine()
    }

    inner class WebWallpaperEngine : Engine() {

        private lateinit var webView: WebView
        private val handler = Handler(Looper.getMainLooper())

        @SuppressLint("SetJavaScriptEnabled")
        override fun onCreate(surfaceHolder: SurfaceHolder) {
            super.onCreate(surfaceHolder)

            // Create WebView
            webView = WebView(applicationContext)
            webView.settings.javaScriptEnabled = true
            webView.webViewClient = WebViewClient()
            webView.setBackgroundColor(0) // transparent background

            // Connect JSBridge
            webView.addJavascriptInterface(JSBridge(applicationContext), "Android")

            // Delay loading HTML slightly to ensure surface is ready
            handler.post {
                webView.loadUrl("file:///android_asset/index.html")
            }

            // Initial layout
            val width = surfaceHolder.surfaceFrame.width()
            val height = surfaceHolder.surfaceFrame.height()
            webView.measure(
                View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY)
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

            // Re-measure layout on surface change
            webView.measure(
                View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY)
            )
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