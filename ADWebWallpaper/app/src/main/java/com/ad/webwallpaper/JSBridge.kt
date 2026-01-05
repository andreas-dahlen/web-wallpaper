package com.ad.webwallpaper  // keep your package

import android.content.Context
import android.content.Intent
import android.webkit.JavascriptInterface

/**
 * JS bridge for Android → JS calls.
 */
class JSBridge(private val context: Context) {

    @JavascriptInterface
    fun openApp(packageName: String) {
        val intent = context.packageManager.getLaunchIntentForPackage(packageName)
        intent?.let {
            it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(it)
        }
    }

}