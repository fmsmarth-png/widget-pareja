package com.widgetpareja.app.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.ComponentName
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.widget.RemoteViews
import com.widgetpareja.app.R
import java.io.InputStream

class ParejaWidgetProvider : AppWidgetProvider() {

    companion object {
        const val PREFS_NAME = "ParejaWidgetPrefs"
        const val KEY_ESTADO = "partner_estado"
        const val KEY_MENSAJE = "partner_mensaje"
        const val KEY_PERSONAJE_ID = "partner_personaje_id"
        const val KEY_PERSONAJE_CARPETA = "partner_personaje_carpeta"

        private val ESTADO_DISPLAY = mapOf(
            "TRABAJANDO" to "Trabajando",
            "EN_CASA" to "En casa",
            "COMIENDO" to "Comiendo",
            "DURMIENDO" to "Durmiendo",
            "LIBRE" to "Libre",
            "PENSANDO_EN_TI" to "Pensando en ti"
        )

        private val ESTADO_EMOJI = mapOf(
            "TRABAJANDO" to "🏗️",
            "EN_CASA" to "🏠",
            "COMIENDO" to "🍕",
            "DURMIENDO" to "😴",
            "LIBRE" to "🙂",
            "PENSANDO_EN_TI" to "❤️"
        )

        private val ESTADO_ARCHIVO = mapOf(
            "TRABAJANDO" to "trabajando",
            "COMIENDO" to "comiendo",
            "DURMIENDO" to "durmiendo"
        )

        fun updateAllWidgets(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val component = ComponentName(context, ParejaWidgetProvider::class.java)
            val ids = manager.getAppWidgetIds(component)
            if (ids.isNotEmpty()) {
                val provider = ParejaWidgetProvider()
                provider.onUpdate(context, manager, ids)
            }
        }
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (widgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, widgetId)
        }
    }

    private fun updateWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val estado = prefs.getString(KEY_ESTADO, "") ?: ""
        val mensaje = prefs.getString(KEY_MENSAJE, "") ?: ""
        val carpeta = prefs.getString(KEY_PERSONAJE_CARPETA, "perro") ?: "perro"

        val views = RemoteViews(context.packageName, R.layout.widget_pareja)

        val displayText = ESTADO_EMOJI.getOrDefault(estado, "") + " " +
                ESTADO_DISPLAY.getOrDefault(estado, "Sin estado")
        views.setTextViewText(R.id.widget_estado, displayText)

        if (mensaje.isNotEmpty()) {
            views.setTextViewText(R.id.widget_mensaje, "\"$mensaje\"")
            views.setViewVisibility(R.id.widget_mensaje, android.view.View.VISIBLE)
        } else {
            views.setViewVisibility(R.id.widget_mensaje, android.view.View.GONE)
        }

        val archivo = ESTADO_ARCHIVO[estado]
        if (archivo != null) {
            val frames = loadSpriteFrames(context, carpeta, archivo, 4)
            if (frames != null && frames.size == 4) {
                views.setImageViewBitmap(R.id.frame_0, frames[0])
                views.setImageViewBitmap(R.id.frame_1, frames[1])
                views.setImageViewBitmap(R.id.frame_2, frames[2])
                views.setImageViewBitmap(R.id.frame_3, frames[3])

                views.setInt(R.id.widget_flipper, "setFlipInterval", 333)
                views.setBoolean(R.id.widget_flipper, "setAutoStart", true)
                views.setViewVisibility(R.id.widget_flipper, android.view.View.VISIBLE)
            }
        } else {
            val emoji = ESTADO_EMOJI.getOrDefault(estado, "✨")
            setEmojiPlaceholder(views, emoji)
        }

        manager.updateAppWidget(widgetId, views)
    }

    private fun setEmojiPlaceholder(views: RemoteViews, emoji: String) {
        views.setViewVisibility(R.id.widget_flipper, android.view.View.VISIBLE)
    }

    private fun loadSpriteFrames(context: Context, carpeta: String, archivo: String, frameCount: Int): List<Bitmap>? {
        return try {
            val assetPath = "characters/$carpeta/$archivo.jpg"
            val inputStream: InputStream = context.assets.open(assetPath)
            val spriteSheet = BitmapFactory.decodeStream(inputStream)
            inputStream.close()

            if (spriteSheet == null) return null

            val frameWidth = spriteSheet.width / frameCount
            val frameHeight = spriteSheet.height
            val frames = mutableListOf<Bitmap>()

            for (i in 0 until frameCount) {
                val frame = Bitmap.createBitmap(
                    spriteSheet,
                    i * frameWidth, 0,
                    frameWidth, frameHeight
                )
                frames.add(frame)
            }

            spriteSheet.recycle()
            frames
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
