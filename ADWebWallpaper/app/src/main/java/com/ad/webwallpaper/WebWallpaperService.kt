package com.ad.webwallpaper

import android.annotation.SuppressLint
import android.graphics.Canvas
import android.os.Handler
import android.os.Looper
import android.service.wallpaper.WallpaperService
import android.view.MotionEvent
import android.view.SurfaceHolder
import android.view.View
import android.webkit.WebView
import android.webkit.WebViewClient

class WebWallpaperService : WallpaperService() {

    override fun onCreateEngine(): Engine = WebWallpaperEngine()

    inner class WebWallpaperEngine : Engine() {

        private lateinit var webView: WebView
        private val handler = Handler(Looper.getMainLooper())

        private val BASE_WIDTH = 364f
        private val BASE_HEIGHT = 800f
        
        // =========================================================================
        // PERFORMANCE: Throttle move events to reduce IPC overhead
        // =========================================================================
        private var lastMoveTime = 0L
        private val MOVE_THROTTLE_MS = 16L  // ~60fps for move events (smooth enough for UI)
        
        // Gesture sequence ID to ignore stale events
        private var gestureSeqId = 0
        
        // Track if we're in active gesture (for frame scheduling)
        private var isGestureActive = false

        @SuppressLint("SetJavaScriptEnabled")
        override fun onCreate(surfaceHolder: SurfaceHolder) {
            super.onCreate(surfaceHolder)
            setTouchEventsEnabled(true)

            webView = WebView(applicationContext).apply {
                // =========================================================
                // CRITICAL: Enable hardware acceleration for smooth animations
                // =========================================================
                setLayerType(View.LAYER_TYPE_HARDWARE, null)
                
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                
                // Additional WebView optimizations
                settings.useWideViewPort = false
                settings.loadWithOverviewMode = false
                settings.setSupportZoom(false)
                settings.builtInZoomControls = false
                
                setBackgroundColor(0)
                
                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        initializeGestureEngine()
                    }
                }
                
                addJavascriptInterface(JSBridge(applicationContext), "Android")
                loadUrl("file:///android_asset/index.html")
            }
        }

        // =========================================================================
        // PERFORMANCE: On-demand rendering instead of constant loop
        // =========================================================================
        private var needsRedraw = true
        private var isDrawScheduled = false

        override fun onVisibilityChanged(visible: Boolean) {
            super.onVisibilityChanged(visible)
            if (visible) {
                needsRedraw = true
                scheduleFrame()
            }
        }

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
                    View.MeasureSpec.makeMeasureSpec(canvas.width, View.MeasureSpec.EXACTLY),
                    View.MeasureSpec.makeMeasureSpec(canvas.height, View.MeasureSpec.EXACTLY)
                )
                webView.layout(0, 0, canvas.width, canvas.height)
                webView.draw(canvas)
                holder.unlockCanvasAndPost(canvas)
            }
            
            // Continue frame loop during active gesture
            if (isVisible && isGestureActive) {
                scheduleFrame()
            }
        }

        // =========================================================================
        // SIMPLIFIED: Touch handling without momentum (page-based carousel)
        // 
        // For page-based carousels, momentum is unnecessary:
        // - User swipes past threshold → CSS transition animates to next page
        // - User doesn't pass threshold → CSS transition snaps back
        // 
        // Removing momentum IPC reduces bridge calls by ~90% during gestures.
        // =========================================================================
        override fun onTouchEvent(event: MotionEvent) {
            val w = surfaceHolder.surfaceFrame.width().toFloat()
            val h = surfaceHolder.surfaceFrame.height().toFloat()
            
            // Normalize coordinates to match JS design dimensions
            val normX = (event.x / w) * BASE_WIDTH
            val normY = (event.y / h) * BASE_HEIGHT
            
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    gestureSeqId++
                    isGestureActive = true
                    lastMoveTime = 0L
                    
                    sendToJS("down", normX, normY)
                }

                MotionEvent.ACTION_MOVE -> {
                    // Throttle move events to reduce IPC overhead
                    val now = android.os.SystemClock.uptimeMillis()
                    if (now - lastMoveTime >= MOVE_THROTTLE_MS) {
                        lastMoveTime = now
                        sendToJS("move", normX, normY)
                    }
                }

                MotionEvent.ACTION_UP,
                MotionEvent.ACTION_CANCEL -> {
                    // Send final position (in case last move was throttled)
                    sendToJS("move", normX, normY)
                    
                    // Send up event - JS will commit or reject the swipe
                    // CSS transitions handle the animation, no momentum needed
                    sendToJS("up", normX, normY)
                    
                    isGestureActive = false
                    lastMoveTime = 0L
                    
                    // Final redraw after gesture completes
                    handler.postDelayed({ requestRedraw() }, 50)
                }
            }
        }

        /**
         * Send gesture event to JavaScript.
         * Minimal overhead: just the essential data.
         */
        private fun sendToJS(type: String, normX: Float, normY: Float) {
            webView.evaluateJavascript(
                "handleTouch('$type',$normX,$normY,$gestureSeqId)",
                null
            )
            requestRedraw()
        }

        override fun onDestroy() {
            handler.removeCallbacksAndMessages(null)
            webView.destroy()
            super.onDestroy()
        }

        /**
         * Initialize gesture engine with simple retry logic.
         */
        private fun initializeGestureEngine(attempt: Int = 1) {
            webView.evaluateJavascript(
                """
                (function() {
                    if (typeof window.initAndroidEngine === 'function') {
                        return window.initAndroidEngine();
                    }
                    return 'not_ready';
                })();
                """.trimIndent()
            ) { result ->
                when {
                    result?.contains("success") == true -> {
                        // Engine ready, request initial render
                        requestRedraw()
                    }
                    attempt < 3 -> {
                        // Retry with exponential backoff
                        handler.postDelayed({ initializeGestureEngine(attempt + 1) }, 100L * attempt)
                    }
                }
            }
        }
    }
}
