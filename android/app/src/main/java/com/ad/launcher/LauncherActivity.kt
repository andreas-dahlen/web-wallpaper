package com.ad.launcher

import android.annotation.SuppressLint
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.Choreographer
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import java.util.Locale

class LauncherActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val handler = Handler(Looper.getMainLooper())
    private val choreographer = Choreographer.getInstance()

    private var deviceWidthPx = 0f
    private var deviceHeightPx = 0f
    private var deviceDensity = 1f

    // =========================================================================
    // PERFORMANCE: Throttle move events to reduce JS bridge overhead
    // =========================================================================
    private var lastMoveTime = 0L
    private val moveThrottleMs = 16L  // ~60fps for move events

    // Gesture sequence ID to ignore stale events
    private var gestureSeqId = 0

    // Track if we're in an active gesture (for frame scheduling)
    private var isGestureActive = false

    // Frame throttling to keep battery usage low while allowing animations
    private val frameThrottleMs = 33L  // ~30fps cap for CSS animations
    private var lastFrameTimeMs = 0L
    private var frameCallback: Choreographer.FrameCallback? = null

    private var isForeground = false

    // =========================================================================
    // Lifecycle
    // =========================================================================
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        captureDeviceMetrics()
        enterImmersiveMode()
        setupWebView()
    }

    override fun onResume() {
        super.onResume()
        captureDeviceMetrics()
        injectDeviceMetrics()
        isForeground = true
        webView.onResume()
        startFrameLoop()
    }

    override fun onPause() {
        stopFrameLoop()
        webView.onPause()
        isForeground = false
        super.onPause()
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        stopFrameLoop()
        webView.destroy()
        super.onDestroy()
    }

    // =========================================================================
    // UI setup
    // =========================================================================
    private fun enterImmersiveMode() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView = WebView(this).apply {
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
                    injectDeviceMetrics()
                    initializeGestureEngine()
                }
            }
            webChromeClient = WebChromeClient()

            addJavascriptInterface(JSBridge(applicationContext), "Android")
            loadUrl("file:///android_asset/index.html")
        }

        webView.setOnTouchListener { _, event ->
            handleTouch(event)
            true
        }

        val container = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            addView(webView, FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ))
        }

        setContentView(container)
    }

    // =========================================================================
    // Touch handling mirrors previous launcher gesture pipeline
    // =========================================================================
    private fun handleTouch(event: MotionEvent) {
        val w = (webView.width.takeIf { it > 0 } ?: webView.measuredWidth).toFloat()
        val h = (webView.height.takeIf { it > 0 } ?: webView.measuredHeight).toFloat()

        // Fallback to display metrics if layout is still measuring
        val width = if (w > 0f) w else resources.displayMetrics.widthPixels.toFloat()
        val height = if (h > 0f) h else resources.displayMetrics.heightPixels.toFloat()

        val safeWidth = if (width > 0f) width else 1f
        val safeHeight = if (height > 0f) height else 1f

        val targetWidth = deviceWidthPx.takeIf { it > 0f } ?: width
        val targetHeight = deviceHeightPx.takeIf { it > 0f } ?: height

        val normX = (event.x / safeWidth) * targetWidth
        val normY = (event.y / safeHeight) * targetHeight

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
                if (!isGestureActive) return
                val now = SystemClock.uptimeMillis()
                if (now - lastMoveTime >= moveThrottleMs) {
                    lastMoveTime = now
                    sendToJS("move", normX, normY)
                }
            }

            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                // Send final position (in case last move was throttled)
                sendToJS("move", normX, normY)

                // JS commits or rejects the swipe; CSS transitions handle animation
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
     * Capture current device metrics once per resume.
     */
private fun captureDeviceMetrics() {
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
        val metrics = windowManager.currentWindowMetrics
        val bounds = metrics.bounds
        deviceWidthPx = bounds.width().toFloat()
        deviceHeightPx = bounds.height().toFloat()
        deviceDensity = resources.displayMetrics.density
    } else {
        val metrics = resources.displayMetrics
        deviceWidthPx = metrics.widthPixels.toFloat()
        deviceHeightPx = metrics.heightPixels.toFloat()
        deviceDensity = metrics.density
    }
}

    /**
     * Inject device dimensions into the WebView for JS to consume.
     */
    private fun injectDeviceMetrics() {
        val width = deviceWidthPx.toInt()
        val height = deviceHeightPx.toInt()
        val density = String.format(Locale.US, "%.4f", deviceDensity)

        val js = """
            (function() {
                const metrics = { width: $width, height: $height, scale: $density };
                window.__ANDROID_SCREEN__ = metrics;
                if (typeof window.__applyAndroidScreen === 'function') {
                    window.__applyAndroidScreen(metrics);
                }
            })();
        """.trimIndent()

        webView.evaluateJavascript(js, null)
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

    // =========================================================================
    // PERFORMANCE: Continuous but throttled rendering for CSS animations
    // =========================================================================
    private var needsRedraw = true

    /**
     * Start a light frame loop driven by Choreographer to keep CSS animations alive.
     */
    private fun startFrameLoop() {
        if (frameCallback != null) return

        frameCallback = Choreographer.FrameCallback {
            val now = SystemClock.uptimeMillis()
            if (now - lastFrameTimeMs >= frameThrottleMs) {
                lastFrameTimeMs = now
                if (needsRedraw) {
                    webView.invalidate() 

// This works (webView.invalidate() — but note:

// WebView already schedules its own draws

// Invalidating manually is fine only because you throttle it

// 🟡 Keep this, but:

// If you later see redundant frames, this is the first place to look

// Never call this unthrottled




                    needsRedraw = false
                }
            }

            if (isForeground) {
                choreographer.postFrameCallback(frameCallback!!)
            } else {
                frameCallback = null
            }
        }

        choreographer.postFrameCallback(frameCallback!!)
    }

    /**
     * Stop the frame loop when the launcher is backgrounded.
     */
    private fun stopFrameLoop() {
        frameCallback?.let { choreographer.removeFrameCallback(it) }
        frameCallback = null
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
                    needsRedraw = true
                    startFrameLoop()
                }
                attempt < 3 -> {
                    handler.postDelayed({ initializeGestureEngine(attempt + 1) }, 100L * attempt)
                }
            }
        }
    }
}
