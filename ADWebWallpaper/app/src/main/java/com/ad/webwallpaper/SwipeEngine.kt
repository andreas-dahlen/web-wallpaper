package com.ad.webwallpaper

import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.Choreographer
import kotlin.math.abs

object SwipeEngine {

    private var lastX = 0f
    private var lastY = 0f
    private var velocityX = 0f
    private var velocityY = 0f
    private var lastTime = 0L
    private var active = false
    private var isMomentumActive = false  // Track if momentum is running
    private val mainHandler = Handler(Looper.getMainLooper())
    private val choreographer = Choreographer.getInstance()

    private const val DECAY = 0.92f  // Slightly smoother decay
    private const val MIN_VELOCITY = 0.3f  // Lower threshold for smoother stop

    fun onDown(x: Float, y: Float) {
        // Cancel any running momentum animation
        isMomentumActive = false
        
        lastX = x
        lastY = y
        velocityX = 0f
        velocityY = 0f
        lastTime = SystemClock.uptimeMillis()
        active = true
    }

    fun onMove(x: Float, y: Float) {
        if (!active) return

        val now = SystemClock.uptimeMillis()
        val dt = (now - lastTime).coerceAtLeast(1)

        velocityX = (x - lastX) / dt
        velocityY = (y - lastY) / dt

        lastX = x
        lastY = y
        lastTime = now
    }

    fun onUp(onUpdate: (Float, Float) -> Unit, onComplete: () -> Unit) {
        if (!active) return
        active = false

        var posX = lastX
        var posY = lastY
        // Scale velocity to per-frame values (assuming ~16ms frames)
        var vX = velocityX * 16f
        var vY = velocityY * 16f

        GestureDebug.log("swipeEngine", "Momentum start: vx=${String.format("%.2f", vX)} vy=${String.format("%.2f", vY)}")

        // Use Choreographer for frame-perfect momentum animation
        isMomentumActive = true
        
        val frameCallback = object : Choreographer.FrameCallback {
            override fun doFrame(frameTimeNanos: Long) {
                if (!isMomentumActive) {
                    // Animation was cancelled (user touched again)
                    return
                }
                
                if (abs(vX) < MIN_VELOCITY && abs(vY) < MIN_VELOCITY) {
                    isMomentumActive = false
                    onComplete()
                    return
                }
                
                posX += vX
                posY += vY
                vX *= DECAY
                vY *= DECAY
                
                onUpdate(posX, posY)
                
                // Continue animation
                choreographer.postFrameCallback(this)
            }
        }
        
        choreographer.postFrameCallback(frameCallback)
    }
}
