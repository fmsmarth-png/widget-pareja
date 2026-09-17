package com.widgetpareja.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.ComponentName
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.widget.RemoteViews
import com.widgetpareja.app.R
import com.widgetpareja.app.MainActivity
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

        private val ESTADO_ARCHIVO = mapOf(
            "TRABAJANDO" to "trabajando",
            "COMIENDO" to "comiendo",
            "DURMIENDO" to "durmiendo"
        )

        private val FRAME_SEQUENCE = mapOf(
            "TRABAJANDO" to intArrayOf(0, 2, 3),
            "COMIENDO" to intArrayOf(0, 1, 2, 3),
            "DURMIENDO" to intArrayOf(0, 1, 2, 3)
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
            try {
                updateWidget(context, appWidgetManager, widgetId)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun updateWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
        val views = RemoteViews(context.packageName, R.layout.widget_pareja)

        val openAppIntent = Intent(context, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            context, 0, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_flipper, pendingIntent)

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val estado = prefs.getString(KEY_ESTADO, null)

        if (estado == null) {
            views.setImageViewResource(R.id.frame_0, R.mipmap.ic_launcher)
            views.setImageViewResource(R.id.frame_1, R.mipmap.ic_launcher)
            views.setImageViewResource(R.id.frame_2, R.mipmap.ic_launcher)
            views.setTextViewText(R.id.widget_mensaje, "Abre la app")
            views.setViewVisibility(R.id.widget_mensaje, android.view.View.VISIBLE)
            manager.updateAppWidget(widgetId, views)
            return
        }

        val mensaje = prefs.getString(KEY_MENSAJE, "") ?: ""
        val carpeta = prefs.getString(KEY_PERSONAJE_CARPETA, "perro") ?: "perro"

        if (mensaje.isNotEmpty()) {
            views.setTextViewText(R.id.widget_mensaje, mensaje)
            views.setViewVisibility(R.id.widget_mensaje, android.view.View.VISIBLE)
        } else {
            views.setViewVisibility(R.id.widget_mensaje, android.view.View.GONE)
        }

        val archivo = ESTADO_ARCHIVO[estado]
        if (archivo != null) {
            val sequence = FRAME_SEQUENCE[estado] ?: intArrayOf(0, 1, 2)
            val frames = loadSpriteFrames(context, carpeta, archivo, 4, sequence)
            if (frames != null && frames.size >= 3) {
                views.setImageViewBitmap(R.id.frame_0, frames[0])
                views.setImageViewBitmap(R.id.frame_1, frames[1])
                views.setImageViewBitmap(R.id.frame_2, frames[2])
            } else {
                setAllFramesToIcon(views)
            }
        } else {
            setAllFramesToIcon(views)
        }

        manager.updateAppWidget(widgetId, views)
    }

    private fun setAllFramesToIcon(views: RemoteViews) {
        views.setImageViewResource(R.id.frame_0, R.mipmap.ic_launcher)
        views.setImageViewResource(R.id.frame_1, R.mipmap.ic_launcher)
        views.setImageViewResource(R.id.frame_2, R.mipmap.ic_launcher)
    }

    private fun loadSpriteFrames(context: Context, carpeta: String, archivo: String, totalFrames: Int, sequence: IntArray): List<Bitmap>? {
        return try {
            val assetPath = "characters/$carpeta/$archivo.jpg"
            val inputStream: InputStream = context.assets.open(assetPath)
            val spriteSheet = BitmapFactory.decodeStream(inputStream)
            inputStream.close()

            if (spriteSheet == null) return null

            val frameWidth = spriteSheet.width / totalFrames
            val frameHeight = spriteSheet.height
            val frames = mutableListOf<Bitmap>()

            for (idx in sequence) {
                val safeIdx = idx.coerceIn(0, totalFrames - 1)
                val frame = Bitmap.createBitmap(
                    spriteSheet,
                    safeIdx * frameWidth, 0,
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
