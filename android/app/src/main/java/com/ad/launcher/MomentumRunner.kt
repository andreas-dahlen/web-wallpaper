package com.ad.launcher

import android.os.SystemClock
import android.view.Choreographer
import kotlin.math.abs
import kotlin.math.pow

object MomentumRunner {

    private var lastX = 0f
    private var lastY = 0f
    private var velocityX = 0f
    private var velocityY = 0f
    private var lastTime = 0L
    private var active = false
    private var isMomentumActive = false  // Track if momentum is running
    private val choreographer = Choreographer.getInstance()

    private const val DECAY = 0.92f  // Slightly smoother decay
    private const val MIN_VELOCITY = 0.3f  // Lower threshold for smoother stop
    private const val VELOCITY_BLEND = 0.8f // Low-pass filter: favors older velocity to smooth jittery input

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

        val newVX = (x - lastX) / dt
        val newVY = (y - lastY) / dt

        velocityX = velocityX * VELOCITY_BLEND + newVX * (1f - VELOCITY_BLEND)
        velocityY = velocityY * VELOCITY_BLEND + newVY * (1f - VELOCITY_BLEND)

        lastX = x
        lastY = y
        lastTime = now
    }

    fun onUp(onUpdate: (Float, Float) -> Unit, onComplete: () -> Unit) {
        if (!active) return
        active = false

        var posX = lastX
        var posY = lastY
        // Convert velocity from px/ms → px/frame (~16ms)
        var vX = velocityX * 16f
        var vY = velocityY * 16f

        // Safety clamp against spikes
        vX = vX.coerceIn(-100f, 100f)
        vY = vY.coerceIn(-100f, 100f)

        GestureDebug.log("swipeEngine", "Momentum start: vx=${String.format("%.2f", vX)} vy=${String.format("%.2f", vY)}")

        // Use Choreographer for frame-perfect momentum animation
        isMomentumActive = true
        
        var lastFrameTimeMs = SystemClock.uptimeMillis()

        val frameCallback = object : Choreographer.FrameCallback {
            override fun doFrame(frameTimeNanos: Long) {
                if (!isMomentumActive) {
                    // Animation was cancelled (user touched again)
                    return
                }
                
                val now = SystemClock.uptimeMillis()
                val frameDeltaMs = (now - lastFrameTimeMs).coerceAtLeast(1).toFloat()
                lastFrameTimeMs = now

                if (abs(vX) < MIN_VELOCITY && abs(vY) < MIN_VELOCITY) {
                    isMomentumActive = false
                    onComplete()
                    return
                }
                
                posX += vX
                posY += vY

                val frameDecay = DECAY.pow(frameDeltaMs / 16f)
                vX *= frameDecay
                vY *= frameDecay
                
                onUpdate(posX, posY)
                
                // Continue animation
                choreographer.postFrameCallback(this)
            }
        }
        
        choreographer.postFrameCallback(frameCallback)
    }
}
