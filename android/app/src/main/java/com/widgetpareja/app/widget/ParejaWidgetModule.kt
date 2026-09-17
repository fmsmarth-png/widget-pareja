package com.widgetpareja.app.widget

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class ParejaWidgetModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ParejaWidget"

    @ReactMethod
    fun updateWidgetData(estado: String, mensaje: String, personajeId: String, carpeta: String, promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences(
                ParejaWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE
            )
            prefs.edit()
                .putString(ParejaWidgetProvider.KEY_ESTADO, estado)
                .putString(ParejaWidgetProvider.KEY_MENSAJE, mensaje)
                .putString(ParejaWidgetProvider.KEY_PERSONAJE_ID, personajeId)
                .putString(ParejaWidgetProvider.KEY_PERSONAJE_CARPETA, carpeta)
                .apply()

            ParejaWidgetProvider.updateAllWidgets(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("WIDGET_ERROR", e.message, e)
        }
    }
}
