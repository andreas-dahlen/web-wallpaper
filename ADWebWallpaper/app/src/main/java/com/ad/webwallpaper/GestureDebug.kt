package com.ad.webwallpaper

import android.util.Log
import kotlin.system.measureNanoTime
import kotlin.math.roundToInt

object GestureDebug {

    // -----------------------------
    // Debug settings
    // -----------------------------
    object DEBUG {
        var enabled = true
        object input {
            var inputLag = true
        }
    }

    // -----------------------------
    // Lag tracking
    // -----------------------------
    private data class LagEntry(val label: String, val timeMs: Double)

    private val timeList = mutableListOf<LagEntry>()

    fun track(label: String) {
        if (!DEBUG.enabled || !DEBUG.input.inputLag) return

        val now = System.nanoTime() / 1_000_000.0 // convert ns → ms
        timeList.add(LagEntry(label, now))
    }

    fun logLag() {
        if (!DEBUG.enabled || !DEBUG.input.inputLag) return

        for (i in 0 until timeList.size - 1) {
            val a = timeList[i]
            val b = timeList[i + 1]
            val delta = (b.timeMs - a.timeMs).roundToInt()
            Log.d("LAG", "${a.label} → ${b.label}: $delta ms")
        }
        timeList.clear()
    }

    // Optional: convenience function to log normal debug events
    fun log(type: String, x: Float, y: Float) {
        if (!DEBUG.enabled) return
        Log.d("GESTURE_NATIVE", "$type x=$x y=$y")
    }
}
