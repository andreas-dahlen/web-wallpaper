package com.ad.webwallpaper

import android.os.SystemClock
import kotlin.math.abs
import kotlin.math.sign

object SwipeEngine {

    private var startX = 0f
    private var startY = 0f
    private var lastX = 0f
    private var lastY = 0f
    private var velocityX = 0f
    private var velocityY = 0f
    private var lastTime = 0L
    private var isActive = false

    // Configuration
    private const val DECAY = 0.9f // friction for fling
    private const val MIN_VELOCITY = 0.5f // stop threshold

    fun onDown(x: Float, y: Float) {
        startX = x
        startY = y
        lastX = x
        lastY = y
        velocityX = 0f
        velocityY = 0f
        lastTime = SystemClock.uptimeMillis()
        isActive = true
        GestureDebug.log("down", x, y)
    }

    fun onMove(x: Float, y: Float) {
        if (!isActive) return
        val now = SystemClock.uptimeMillis()
        val dt = (now - lastTime).coerceAtLeast(1L)

        // velocity = delta / dt
        velocityX = (x - lastX) / dt
        velocityY = (y - lastY) / dt

        lastX = x
        lastY = y
        lastTime = now

        GestureDebug.log("move", x, y)
    }

    fun onUp(onUpdate: (Float, Float) -> Unit) {
        if (!isActive) return
        isActive = false

        // start a fling animation
        var posX = lastX
        var posY = lastY
        var vX = velocityX
        var vY = velocityY

        Thread {
            while (abs(vX) > MIN_VELOCITY || abs(vY) > MIN_VELOCITY) {
                posX += vX * 16 // assume ~60fps
                posY += vY * 16
                onUpdate(posX, posY)

                vX *= DECAY
                vY *= DECAY

                Thread.sleep(16)
            }
        }.start()

        GestureDebug.log("up", lastX, lastY)
    }
}
