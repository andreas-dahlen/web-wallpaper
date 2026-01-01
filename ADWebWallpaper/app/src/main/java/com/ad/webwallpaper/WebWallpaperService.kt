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

        // Touch state for swipe axis detection
        private var swipeAxis: String? = null
        private var startX = 0f
        private var startY = 0f
        private var lastX = 0f
        private var lastY = 0f
        private var swipeStarted = false

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
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    startX = event.x
                    lastX = event.x
                    startY = event.y
                    lastY = event.y
                    swipeAxis = null
                    swipeStarted = false

                    GestureDebug.track("down")
                    GestureDebug.log("down", event.x, event.y)
                    sendToJS("down", event.x, event.y)
                }

                MotionEvent.ACTION_MOVE -> {
                    if (swipeAxis == null) {
                        val dx = event.x - startX
                        val dy = event.y - startY
                        swipeAxis = if (Math.abs(dx) > Math.abs(dy)) "horizontal" else "vertical"
                        GestureDebug.track("axisDecided")
                    }

                    if (!swipeStarted) {
                        swipeStarted = true
                        GestureDebug.track("swipeStart")
                    }

                    GestureDebug.track("moveStart")
                    // send all historical points first
                    for (i in 0 until event.historySize) {
                        sendToJS("move", event.getHistoricalX(i), event.getHistoricalY(i))
                        GestureDebug.log("move", event.getHistoricalX(i), event.getHistoricalY(i))
                    }
                    // send current
                    sendToJS("move", event.x, event.y)
                    GestureDebug.log("move", event.x, event.y)
                    GestureDebug.track("moveEnd")

                    lastX = event.x
                    lastY = event.y
                }

                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    GestureDebug.track("pointerUp")
                    GestureDebug.log("up", event.x, event.y)
                    sendToJS("up", event.x, event.y)

                    // Optional: dump lag report after each gesture
                    GestureDebug.logLag()
                }
            }
        }

        private fun sendToJS(type: String, x: Float, y: Float) {
            val surfaceWidth = surfaceHolder.surfaceFrame.width().toFloat()
            val surfaceHeight = surfaceHolder.surfaceFrame.height().toFloat()

            val normX = (x / surfaceWidth) * BASE_WIDTH
            val normY = (y / surfaceHeight) * BASE_HEIGHT

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

