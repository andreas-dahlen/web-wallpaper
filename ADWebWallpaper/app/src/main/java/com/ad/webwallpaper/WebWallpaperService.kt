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
        
        // Throttle move events to reduce IPC overhead
        private var lastMoveTime = 0L
        private val MOVE_THROTTLE_MS = 8L  // ~120fps max, reduces evaluateJavascript calls
        
        // Gesture sequence ID to ignore stale momentum updates
        private var gestureSeqId = 0

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
                        // Retry logic ensures bridge functions are available
                        initializeGestureEngine()
                    }
                }
                addJavascriptInterface(JSBridge(applicationContext), "Android")
                loadUrl("file:///android_asset/index.html")
            }
        }

        // PERF: Track if redraw is needed instead of constant 60fps loop
        private var needsRedraw = true
        private var isDrawScheduled = false

        override fun onVisibilityChanged(visible: Boolean) {
            super.onVisibilityChanged(visible)
            if (visible) {
                needsRedraw = true
                scheduleFrame()
            }
        }

        /**
         * Request a redraw on the next frame.
         * Call this when WebView content changes.
         */
        private fun requestRedraw() {
            needsRedraw = true
            scheduleFrame()
        }
        
        private fun scheduleFrame() {
            if (!isDrawScheduled && isVisible) {
                isDrawScheduled = true
                handler.post { drawFrame() }
            }
        }

        private fun drawFrame() {
            isDrawScheduled = false
            if (!needsRedraw || !isVisible) return
            needsRedraw = false
            
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
            
            // Schedule next frame during active interaction
            // WebView invalidates will trigger redraws automatically
            if (isVisible && needsRedraw) {
                scheduleFrame()
            }
        }

        override fun onTouchEvent(event: MotionEvent) {
            when (event.actionMasked) {

                MotionEvent.ACTION_DOWN -> {
                    GestureDebug.track("down")
                    // Increment gesture ID to invalidate any pending momentum updates from previous gesture
                    gestureSeqId++
                    
                    SwipeEngine.onDown(event.x, event.y)
                    sendToJS("down", event.x, event.y)
                }

                MotionEvent.ACTION_MOVE -> {
                    GestureDebug.track("moveStart")

                    SwipeEngine.onMove(event.x, event.y)

                    // PERF: Throttle JS updates to reduce evaluateJavascript IPC overhead
                    val now = android.os.SystemClock.uptimeMillis()
                    if (now - lastMoveTime >= MOVE_THROTTLE_MS) {
                        lastMoveTime = now
                        sendToJS("move", event.x, event.y)
                    }

                    GestureDebug.track("moveEnd")
                }

                MotionEvent.ACTION_UP,
                MotionEvent.ACTION_CANCEL -> {
                    GestureDebug.track("pointerUp")

                    // Ensure JS sees the final finger position even if move events were throttled.
                    sendToJS("move", event.x, event.y)
                    lastMoveTime = 0L
                    
                    // CRITICAL: Send 'up' IMMEDIATELY when finger lifts
                    // This lets the carousel exit dragging mode and re-enable CSS transitions
                    sendToJS("up", event.x, event.y)
                    
                    // Capture gesture ID for this momentum animation
                    val momentumGestureId = gestureSeqId

                    SwipeEngine.onUp(
                        onUpdate = { x, y ->
                            // CRITICAL: Ignore if a new gesture has started
                            if (momentumGestureId != gestureSeqId) return@onUp
                            
                            val w = surfaceHolder.surfaceFrame.width().toFloat()
                            val h = surfaceHolder.surfaceFrame.height().toFloat()

                            val normX = (x / w) * BASE_WIDTH
                            val normY = (y / h) * BASE_HEIGHT

                            handler.post {
                                // Double-check in handler in case gesture changed while queued
                                if (momentumGestureId != gestureSeqId) return@post
                                
                                // Use 'momentum' type so JS handles it differently from finger moves
                                webView.evaluateJavascript(
                                    "handleTouch('momentum', $normX, $normY, $momentumGestureId)",
                                    null
                                )
                                requestRedraw()  // Redraw after momentum update
                            }
                        },
                        onComplete = {
                            // Momentum finished - 'up' was already sent above
                            // Just log and redraw
                            handler.post {
                                requestRedraw()
                                GestureDebug.logLag()
                            }
                        }
                    )
                }
            }
        }

        private fun sendToJS(type: String, x: Float, y: Float) {
            val w = surfaceHolder.surfaceFrame.width().toFloat()
            val h = surfaceHolder.surfaceFrame.height().toFloat()

            val normX = (x / w) * BASE_WIDTH
            val normY = (y / h) * BASE_HEIGHT

            GestureDebug.log("kotlinBridge", "→ JS handleTouch('$type', ${normX.toInt()}, ${normY.toInt()}, seq=$gestureSeqId)")

            // Include gesture sequence ID so JS can reject stale events
            webView.evaluateJavascript(
                "handleTouch('$type', $normX, $normY, $gestureSeqId)",
                null
            )
            
            // Request redraw after JS update
            requestRedraw()
        }

        override fun onDestroy() {
            handler.removeCallbacksAndMessages(null)
            webView.destroy()
            super.onDestroy()
        }

        /**
         * Initialize gesture engine with retry logic to handle race conditions.
         * JS bridge functions may not be available immediately after page load.
         */
        private fun initializeGestureEngine(attempt: Int = 1) {
            webView.evaluateJavascript(
                """
                (function() {
                    if (typeof window.initAndroidEngine === 'function') {
                        window.initAndroidEngine();
                        return 'success';
                    }
                    return 'not_ready';
                })();
                """.trimIndent()
            ) { result ->
                when {
                    result?.contains("success") == true -> {
                        GestureDebug.log("kotlinBridge", "Gesture engine initialized successfully")
                    }
                    attempt < 5 -> {
                        // Retry after delay if bridge not ready
                        handler.postDelayed({ initializeGestureEngine(attempt + 1) }, 100L * attempt)
                        GestureDebug.log("kotlinBridge", "Bridge not ready, retry attempt $attempt")
                    }
                    else -> {
                        GestureDebug.log("kotlinBridge", "ERROR: Failed to initialize gesture engine after $attempt attempts")
                    }
                }
            }
        }
    }
}
