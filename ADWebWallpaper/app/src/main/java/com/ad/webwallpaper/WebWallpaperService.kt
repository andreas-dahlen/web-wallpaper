package com.ad.webwallpaper

import android.annotation.SuppressLint
import android.graphics.Canvas
import android.os.Handler
import android.os.Looper
import android.service.wallpaper.WallpaperService
import android.view.MotionEvent
import android.view.SurfaceHolder
import android.webkit.WebView
import android.webkit.WebViewClient

class WebWallpaperService : WallpaperService() {

    override fun onCreateEngine(): Engine = WebWallpaperEngine()

    inner class WebWallpaperEngine : Engine() {

        private lateinit var webView: WebView
        private val handler = Handler(Looper.getMainLooper())

        private val BASE_WIDTH = 364f
        private val BASE_HEIGHT = 800f

        @SuppressLint("SetJavaScriptEnabled")
        override fun onCreate(surfaceHolder: SurfaceHolder) {
            super.onCreate(surfaceHolder)
            setTouchEventsEnabled(true)

            webView = WebView(applicationContext).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                setBackgroundColor(0)
                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        // Initialize Android gesture engine after page loads
                        webView.evaluateJavascript("window.initAndroidEngine()", null)
                    }
                }
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
                    GestureDebug.track("down")
                    SwipeEngine.onDown(event.x, event.y)
                    sendToJS("down", event.x, event.y)
                }

                MotionEvent.ACTION_MOVE -> {
                    GestureDebug.track("moveStart")

                    SwipeEngine.onMove(event.x, event.y)

                    // 🔑 IMPORTANT: keep JS visually in sync
                    sendToJS("move", event.x, event.y)

                    GestureDebug.track("moveEnd")
                }

                MotionEvent.ACTION_UP,
                MotionEvent.ACTION_CANCEL -> {
                    GestureDebug.track("pointerUp")

                    SwipeEngine.onUp { x, y ->
                        val w = surfaceHolder.surfaceFrame.width().toFloat()
                        val h = surfaceHolder.surfaceFrame.height().toFloat()

                        val normX = (x / w) * BASE_WIDTH
                        val normY = (y / h) * BASE_HEIGHT

                        handler.post {
                            webView.evaluateJavascript(
                                "handleTouch('move', $normX, $normY)",
                                null
                            )
                        }
                    }

                    sendToJS("up", event.x, event.y)
                    GestureDebug.logLag()
                }
            }
        }

        private fun sendToJS(type: String, x: Float, y: Float) {
            val w = surfaceHolder.surfaceFrame.width().toFloat()
            val h = surfaceHolder.surfaceFrame.height().toFloat()

            val normX = (x / w) * BASE_WIDTH
            val normY = (y / h) * BASE_HEIGHT

            webView.evaluateJavascript(
                "handleTouch('$type', $normX, $normY)",
                null
            )
        }

        override fun onDestroy() {
            handler.removeCallbacksAndMessages(null)
            webView.destroy()
            super.onDestroy()
        }
    }
}
