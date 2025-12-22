package com.ad.webwallpaper

import android.annotation.SuppressLint
import android.graphics.Canvas
import android.os.Handler
import android.os.Looper
import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder
import android.webkit.WebView
import android.webkit.WebViewClient
import android.view.MotionEvent

class WebWallpaperService : WallpaperService() {

    override fun onCreateEngine(): Engine = WebWallpaperEngine()

    inner class WebWallpaperEngine : Engine() {

        private lateinit var webView: WebView
        private val handler = Handler(Looper.getMainLooper())

        // Target logical coordinates
        private val BASE_WIDTH = 364f
        private val BASE_HEIGHT = 800f

        @SuppressLint("SetJavaScriptEnabled")
        override fun onCreate(surfaceHolder: SurfaceHolder) {
            super.onCreate(surfaceHolder)
            setTouchEventsEnabled(true)

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
            if (visible) drawFrame()
        }

        private fun drawFrame() {
            val holder = surfaceHolder ?: return
            val canvas: Canvas? = holder.lockCanvas()
            if (canvas != null) {
                // Layout WebView to fill canvas
                webView.measure(
                    android.view.View.MeasureSpec.makeMeasureSpec(canvas.width, android.view.View.MeasureSpec.EXACTLY),
                    android.view.View.MeasureSpec.makeMeasureSpec(canvas.height, android.view.View.MeasureSpec.EXACTLY)
                )
                webView.layout(0, 0, canvas.width, canvas.height)

                webView.draw(canvas)
                holder.unlockCanvasAndPost(canvas)
            }

            if (isVisible) handler.postDelayed({ drawFrame() }, 16)
        }

        override fun onTouchEvent(event: MotionEvent) {
            val surfaceWidth = surfaceHolder.surfaceFrame.width().toFloat()
            val surfaceHeight = surfaceHolder.surfaceFrame.height().toFloat()

            // Normalize coordinates to 364x800
            val normX = (event.x / surfaceWidth) * BASE_WIDTH
            val normY = (event.y / surfaceHeight) * BASE_HEIGHT

            val type = when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> "down"
                MotionEvent.ACTION_MOVE -> "move"
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> "up"
                else -> return
            }

            // Debug log
           // android.util.Log.i(
                "WALLPAPER_TOUCH" // ,
            //    "type=$type, eventX=${event.x}, eventY=${event.y}, normX=$normX, normY=$normY, surfaceW=$surfaceWidth, surfaceH=$surfaceHeight"
           // )

            // Send normalized coordinates to JS
            webView.evaluateJavascript(
                "handleTouch('$type', $normX, $normY)",
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

