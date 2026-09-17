import { NativeModules, Platform } from 'react-native';

const { ParejaWidget } = NativeModules;

export async function updateWidget(
  estado: string,
  mensaje: string,
  personajeId: string,
  carpeta: string,
): Promise<void> {
  if (Platform.OS !== 'android' || !ParejaWidget) return;
  try {
    await ParejaWidget.updateWidgetData(estado, mensaje, personajeId, carpeta);
  } catch (_) {}
}
