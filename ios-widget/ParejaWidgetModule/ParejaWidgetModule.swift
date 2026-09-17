import Foundation
import React
import WidgetKit

@objc(ParejaWidgetModule)
class ParejaWidgetModule: NSObject {
    static let appGroupId = "group.com.widgetpareja.app"

    @objc
    func updateWidgetData(_ estado: String, mensaje: String, personajeId: String, carpeta: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let defaults = UserDefaults(suiteName: ParejaWidgetModule.appGroupId)
        defaults?.set(estado, forKey: "partner_estado")
        defaults?.set(mensaje, forKey: "partner_mensaje")
        defaults?.set(personajeId, forKey: "partner_personaje_id")
        defaults?.set(carpeta, forKey: "partner_personaje_carpeta")
        defaults?.synchronize()

        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }

        resolve(true)
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
