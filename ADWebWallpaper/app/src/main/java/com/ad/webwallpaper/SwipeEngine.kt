package com.ad.webwallpaper

import android.os.SystemClock
import kotlin.math.abs

object SwipeEngine {

    private var lastX = 0f
    private var lastY = 0f
    private var velocityX = 0f
    private var velocityY = 0f
    private var lastTime = 0L
    private var active = false

    private const val DECAY = 0.9f
    private const val MIN_VELOCITY = 0.5f
    private const val FRAME_MS = 16L

    fun onDown(x: Float, y: Float) {
        lastX = x
        lastY = y
        velocityX = 0f
        velocityY = 0f
        lastTime = SystemClock.uptimeMillis()
        active = true
        GestureDebug.log("down", x, y)
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

        GestureDebug.log("move", x, y)
    }

    fun onUp(onUpdate: (Float, Float) -> Unit) {
        if (!active) return
        active = false

        var posX = lastX
        var posY = lastY
        var vX = velocityX
        var vY = velocityY

        Thread {
            while (abs(vX) > MIN_VELOCITY || abs(vY) > MIN_VELOCITY) {
                posX += vX * FRAME_MS
                posY += vY * FRAME_MS

                onUpdate(posX, posY)

                vX *= DECAY
                vY *= DECAY

                Thread.sleep(FRAME_MS)
            }
        }.start()

        GestureDebug.log("up", lastX, lastY)
    }
}
