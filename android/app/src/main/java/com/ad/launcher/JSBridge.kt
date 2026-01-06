package com.ad.launcher  // launcher host package

import android.content.Context
import android.content.Intent
import android.util.Log
import android.webkit.JavascriptInterface

/**
 * JS bridge for Android → JS calls in the launcher host.
 */
class JSBridge(private val context: Context) {


    /**
     * Launch another app by package name
     */
    @JavascriptInterface
    fun openApp(packageName: String) {
        val intent = context.packageManager.getLaunchIntentForPackage(packageName)
        if (intent != null) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        } else {
            // Optional debug hook
            Log.w("JSBridge", "No launch intent for package: $packageName")
        }
    }

    /**
     * Placeholder hook for future launcher actions JS can trigger.
     */
    @JavascriptInterface
    fun launchPlaceholder(action: String?) {
        // Intentionally empty: reserved for upcoming launch actions from JS.
    }
    fun performAction(action: String, payload: String?) {
    when (action) {
        "openApp" -> payload?.let { openApp(it) }
        // future: "openSettings", "showRecents", etc.
    }
}
}