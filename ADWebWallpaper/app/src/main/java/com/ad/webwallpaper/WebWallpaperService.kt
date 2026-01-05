package com.ad.webwallpaper

import android.annotation.SuppressLint
import android.graphics.Canvas
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.service.wallpaper.WallpaperService
import android.view.MotionEvent
import android.view.SurfaceHolder
import android.view.View
import android.view.Choreographer
import android.webkit.WebView
import android.webkit.WebViewClient

class WebWallpaperService : WallpaperService() {

    override fun onCreateEngine(): Engine = WebWallpaperEngine()

    inner class WebWallpaperEngine : Engine() {

        private lateinit var webView: WebView
        private val handler = Handler(Looper.getMainLooper())
        private val choreographer = Choreographer.getInstance()

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

        // Frame throttling to keep battery usage low while allowing animations
        private val FRAME_THROTTLE_MS = 33L  // ~30fps cap for CSS animations
        private var lastFrameTimeMs = 0L
        private var frameCallback: Choreographer.FrameCallback? = null

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
        // PERFORMANCE: Continuous but throttled rendering for CSS animations
        // =========================================================================
        private var needsRedraw = true

        /**
         * Start a light frame loop driven by Choreographer. Always keeps CSS
         * animations ticking while visible, throttled to ~30fps for battery.
         */
        private fun startFrameLoop() {
            if (frameCallback != null || !isVisible) return

            frameCallback = Choreographer.FrameCallback {
                val now = SystemClock.uptimeMillis()
                if (now - lastFrameTimeMs >= FRAME_THROTTLE_MS) {
                    lastFrameTimeMs = now
                    needsRedraw = true
                    drawFrame()
                }

                // Continue while needed
                if (isVisible) {
                    choreographer.postFrameCallback(frameCallback!!)
                } else {
                    frameCallback = null
                }
            }

            choreographer.postFrameCallback(frameCallback!!)
        }

        /**
         * Stop the frame loop when wallpaper is not visible.
         */
        private fun stopFrameLoop() {
            frameCallback?.let { choreographer.removeFrameCallback(it) }
            frameCallback = null
        }

        private fun drawFrame() {
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
            
            // For gesture-driven redraws, ensure loop is alive
            if (isVisible && isGestureActive && frameCallback == null) {
                startFrameLoop()
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

                    // Ensure frame loop is running during interaction
                    startFrameLoop()
                    
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
                    handler.postDelayed({
                        needsRedraw = true
                    }, 50)
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
            needsRedraw = true
            // Ensure animations keep running during gesture-driven updates
            if (isGestureActive) startFrameLoop()
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
                        needsRedraw = true
                        // Start animation frames so CSS animations run
                        startFrameLoop()
                    }
                    attempt < 3 -> {
                        // Retry with exponential backoff
                        handler.postDelayed({ initializeGestureEngine(attempt + 1) }, 100L * attempt)
                    }
                }
            }
        }

        // Frame loop lifecycle tied to visibility
        override fun onVisibilityChanged(visible: Boolean) {
            super.onVisibilityChanged(visible)
            if (visible) {
                needsRedraw = true
                startFrameLoop()
            } else {
                stopFrameLoop()
            }
        }
    }
}
