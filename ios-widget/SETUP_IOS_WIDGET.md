# Setup iOS Widget - Instrucciones para Mac

## 1. Generar proyecto iOS
```bash
cd /ruta/al/proyecto/widget-pareja
npx expo prebuild --platform ios
```

## 2. Abrir en Xcode
```bash
open ios/widgetpareja.xcworkspace
```

## 3. Agregar App Group
- Selecciona el target principal "widgetpareja" > Signing & Capabilities
- Click "+" > App Groups
- Agrega: `group.com.widgetpareja.app`

## 4. Agregar el Widget Extension
- En Xcode: File > New > Target
- Selecciona "Widget Extension"
- Nombre: `ParejaWidget`
- Bundle Identifier: `com.widgetpareja.app.ParejaWidget`
- NO marques "Include Configuration App Intent"
- Click Finish

## 5. Reemplazar archivos del Widget
- Borra los archivos que Xcode generó en la carpeta ParejaWidget/
- Copia los archivos de `ios-widget/ParejaWidget/` al target ParejaWidget en Xcode:
  - `ParejaWidget.swift`
  - `Info.plist`

## 6. Agregar App Group al Widget
- Selecciona el target "ParejaWidget" > Signing & Capabilities
- Click "+" > App Groups
- Agrega el mismo: `group.com.widgetpareja.app`

## 7. Agregar el Native Module al target principal
- Arrastra estos archivos de `ios-widget/ParejaWidgetModule/` al target principal en Xcode:
  - `ParejaWidgetModule.swift`
  - `ParejaWidgetModule.m`
- Cuando pregunte, asegura que pertenecen al target "widgetpareja"
- Si pide crear un Bridging Header, acepta

## 8. Copiar sprites al bundle
- Copia la carpeta `assets/characters/` al target del widget en Xcode
- Asegura que los archivos JPG estén incluidos en el target "ParejaWidget"

## 9. Compilar y probar
```bash
# Desde terminal
cd ios && pod install
```
- En Xcode: selecciona tu dispositivo y dale Run
- Agrega el widget desde la pantalla de inicio del iPhone

## Notas
- El App Group ID debe ser identico en ambos targets
- El widget necesita el mismo Team de desarrollo que la app principal
- Los sprites deben estar en el bundle del widget, no solo en el de la app
