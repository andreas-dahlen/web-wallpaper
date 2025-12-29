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

            val sendToJS: (type: String, x: Float, y: Float) -> Unit = { type, x, y ->
                val normX = (x / surfaceWidth) * BASE_WIDTH
                val normY = (y / surfaceHeight) * BASE_HEIGHT

//                android.util.Log.d("WALLPAPER_TOUCH", "$type $normX $normY")

                webView.evaluateJavascript("handleTouch('$type', $normX, $normY)", null)
            }

            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    sendToJS("down", event.x, event.y)
                }
                MotionEvent.ACTION_MOVE -> {
                    // Send all historical points first
                    for (i in 0 until event.historySize) {
                        sendToJS("move", event.getHistoricalX(i), event.getHistoricalY(i))
                    }
                    // Then send the current point
                    sendToJS("move", event.x, event.y)
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    sendToJS("up", event.x, event.y)
                }
            }
        }


        override fun onDestroy() {
            super.onDestroy()
            handler.removeCallbacksAndMessages(null)
            webView.destroy()
        }
    }
}

