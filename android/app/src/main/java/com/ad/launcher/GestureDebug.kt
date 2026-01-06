package com.ad.launcher

import android.util.Log
import kotlin.math.roundToInt

object GestureDebug {

    // -----------------------------
    // Debug settings (matches JS appSettings.DEBUG)
    // -----------------------------
    object DEBUG {
        var enabled = true
        
        // Performance tracking
        var lagTime = true            // Input lag measurements
        
        // Kotlin-specific
        var swipeEngine = false       // SwipeEngine momentum logs (disable - kotlinBridge shows all events)
        var kotlinBridge = true       // JS bridge communication logs ✅ SHOWS NORMALIZED COORDS SENT TO JS
    }

    // -----------------------------
    // Lag tracking
    // -----------------------------
    private data class LagEntry(val label: String, val timeMs: Double)

    private val timeList = mutableListOf<LagEntry>()

    /**
     * Track performance lag between gesture events.
     * Matches JS debugLagTime() functionality.
     */
    fun track(label: String) {
        if (!DEBUG.enabled || !DEBUG.lagTime) return

        val now = System.nanoTime() / 1_000_000.0 // convert ns → ms
        timeList.add(LagEntry(label, now))
    }

    /**
     * Output lag measurements. Matches JS debugLagTime('log') format.
     */
    fun logLag() {
        if (!DEBUG.enabled || !DEBUG.lagTime) return

        for (i in 0 until timeList.size - 1) {
            val a = timeList[i]
            val b = timeList[i + 1]
            val delta = (b.timeMs - a.timeMs).roundToInt()
            Log.d("lagTime", "${a.label} → ${b.label}: ${delta}ms")
        }
        timeList.clear()
    }

    /**
     * Universal log function that respects DEBUG settings.
     * Matches JS log(key, ...args) functionality.
     * @param key Debug category key
     * @param args Variable arguments to log
     */
    fun log(key: String, vararg args: Any) {
        if (!DEBUG.enabled) return
        
        // Check if this category is enabled
        val enabled = when (key) {
            "swipeEngine" -> DEBUG.swipeEngine
            "kotlinBridge" -> DEBUG.kotlinBridge
            "lagTime" -> DEBUG.lagTime
            else -> false
        }
        
        if (enabled) {
            val message = args.joinToString(" ")
            Log.d(key, message)
        }
    }
}
