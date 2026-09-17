import WidgetKit
import SwiftUI

struct ParejaEntry: TimelineEntry {
    let date: Date
    let estado: String
    let mensaje: String
    let carpeta: String
    let frameIndex: Int
}

struct ParejaProvider: TimelineProvider {
    let appGroupId = "group.com.widgetpareja.app"

    func placeholder(in context: Context) -> ParejaEntry {
        ParejaEntry(date: Date(), estado: "LIBRE", mensaje: "", carpeta: "perro", frameIndex: 0)
    }

    func getSnapshot(in context: Context, completion: @escaping (ParejaEntry) -> Void) {
        let entry = readEntry(frameIndex: 0)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ParejaEntry>) -> Void) {
        var entries: [ParejaEntry] = []
        let now = Date()

        // Create entries for frame animation - cycle through 3 frames every second
        for i in 0..<90 {
            let entryDate = Calendar.current.date(byAdding: .second, value: i, to: now)!
            let entry = readEntry(date: entryDate, frameIndex: i % 3)
            entries.append(entry)
        }

        let nextUpdate = Calendar.current.date(byAdding: .second, value: 90, to: now)!
        let timeline = Timeline(entries: entries, policy: .after(nextUpdate))
        completion(timeline)
    }

    private func readEntry(date: Date = Date(), frameIndex: Int = 0) -> ParejaEntry {
        let defaults = UserDefaults(suiteName: appGroupId)
        let estado = defaults?.string(forKey: "partner_estado") ?? ""
        let mensaje = defaults?.string(forKey: "partner_mensaje") ?? ""
        let carpeta = defaults?.string(forKey: "partner_personaje_carpeta") ?? "perro"

        return ParejaEntry(date: date, estado: estado, mensaje: mensaje, carpeta: carpeta, frameIndex: frameIndex)
    }
}

struct ParejaWidgetEntryView: View {
    var entry: ParejaEntry

    private let estadoArchivo: [String: String] = [
        "TRABAJANDO": "trabajando",
        "COMIENDO": "comiendo",
        "DURMIENDO": "durmiendo",
    ]

    var body: some View {
        ZStack {
            // Background
            Color(red: 0.996, green: 0.961, blue: 0.961)

            if let archivo = estadoArchivo[entry.estado],
               let image = loadSpriteFrame(carpeta: entry.carpeta, archivo: archivo, frameIndex: entry.frameIndex) {
                VStack(spacing: 0) {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fill)

                    if !entry.mensaje.isEmpty {
                        Text(entry.mensaje)
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 4)
                            .padding(.horizontal, 8)
                            .background(Color.gray)
                    }
                }
            } else if entry.estado.isEmpty {
                VStack(spacing: 4) {
                    Text("❤️")
                        .font(.system(size: 32))
                    Text("Abre la app")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(Color(red: 0.35, green: 0.24, blue: 0.26))
                }
            } else {
                // Estado without animation - show app icon like Android
                VStack(spacing: 0) {
                    Spacer()
                    if let appIcon = UIImage(named: "AppIcon") {
                        Image(uiImage: appIcon)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 60, height: 60)
                    } else {
                        Text(emojiForEstado(entry.estado))
                            .font(.system(size: 40))
                    }
                    Spacer()

                    if !entry.mensaje.isEmpty {
                        Text(entry.mensaje)
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 4)
                            .padding(.horizontal, 8)
                            .background(Color.gray)
                    }
                }
            }
        }
        .widgetURL(URL(string: "widgetpareja://open"))
    }

    private func emojiForEstado(_ estado: String) -> String {
        switch estado {
        case "TRABAJANDO": return "🏗️"
        case "EN_CASA": return "🏠"
        case "COMIENDO": return "🍕"
        case "DURMIENDO": return "😴"
        case "LIBRE": return "🙂"
        case "PENSANDO_EN_TI": return "❤️"
        default: return "✨"
        }
    }

    private func loadSpriteFrame(carpeta: String, archivo: String, frameIndex: Int) -> UIImage? {
        guard let bundleURL = Bundle.main.url(forResource: archivo, withExtension: "jpg"),
              let spriteSheet = UIImage(contentsOfFile: bundleURL.path) else {
            return nil
        }

        let totalFrames = 4
        let frameWidth = spriteSheet.size.width / CGFloat(totalFrames)
        let frameHeight = spriteSheet.size.height
        let safeIndex = min(frameIndex, totalFrames - 1)

        let cropRect = CGRect(
            x: CGFloat(safeIndex) * frameWidth * spriteSheet.scale,
            y: 0,
            width: frameWidth * spriteSheet.scale,
            height: frameHeight * spriteSheet.scale
        )

        guard let cgImage = spriteSheet.cgImage?.cropping(to: cropRect) else {
            return nil
        }

        return UIImage(cgImage: cgImage, scale: spriteSheet.scale, orientation: .up)
    }
}

@main
struct ParejaWidget: Widget {
    let kind: String = "ParejaWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ParejaProvider()) { entry in
            ParejaWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Mi Pareja")
        .description("Muestra el estado de tu pareja")
        .supportedFamilies([.systemSmall, .systemMedium])
        .contentMarginsDisabled()
    }
}
