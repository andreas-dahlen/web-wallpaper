package com.ad.webwallpaper

import android.annotation.SuppressLint
import android.graphics.Canvas
import android.os.Handler
import android.os.Looper
import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder
import android.webkit.WebView
import android.webkit.WebViewClient
import android.util.Log

class WebWallpaperService : WallpaperService() {

    override fun onCreateEngine(): Engine {
        return WebWallpaperEngine()
    }

    inner class WebWallpaperEngine : Engine() {

        private lateinit var webView: WebView
        private val handler = Handler(Looper.getMainLooper()) // ✅ Add this

        @SuppressLint("SetJavaScriptEnabled")
        override fun onCreate(surfaceHolder: SurfaceHolder) {
            super.onCreate(surfaceHolder)

            setTouchEventsEnabled(true)

            // Create offscreen WebView
            webView = WebView(applicationContext).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.allowFileAccess = true
                settings.allowContentAccess = true
                webViewClient = WebViewClient()
                setBackgroundColor(0)
                addJavascriptInterface(JSBridge(applicationContext), "Android")
                loadUrl("file:///android_asset/index.html")
            }
        }

        override fun onVisibilityChanged(visible: Boolean) {
            super.onVisibilityChanged(visible)
            if (visible) drawFrame() // Draw when visible
        }

        private fun drawFrame() {
            val holder = surfaceHolder ?: return

            val canvas: Canvas? = holder.lockCanvas()
            if (canvas != null) {
                // Measure and layout WebView to match canvas
                webView.measure(
                    android.view.View.MeasureSpec.makeMeasureSpec(canvas.width, android.view.View.MeasureSpec.EXACTLY),
                    android.view.View.MeasureSpec.makeMeasureSpec(canvas.height, android.view.View.MeasureSpec.EXACTLY)
                )
                webView.layout(0, 0, canvas.width, canvas.height)

                // Draw WebView to canvas
                webView.draw(canvas)
                holder.unlockCanvasAndPost(canvas)
            }

            // Keep redrawing every 16ms (~60fps) while visible
            if (isVisible) {
                handler.postDelayed({ drawFrame() }, 16)
            }
        }
        override fun onTouchEvent(event: android.view.MotionEvent) {
            super.onTouchEvent(event)

            val x = event.x
            val y = event.y

            val type = when (event.action) {
                android.view.MotionEvent.ACTION_DOWN -> "down"
                android.view.MotionEvent.ACTION_MOVE -> "move"
                android.view.MotionEvent.ACTION_UP -> "up"
                else -> return
            }

            webView.evaluateJavascript(
                "handleTouch('$type', $x, $y)",
                null
            )
        }

        override fun onDestroy() {
            super.onDestroy()
            handler.removeCallbacksAndMessages(null)
            webView.destroy()
        }
    }
}
