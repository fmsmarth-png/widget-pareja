import { NativeModules, Platform } from 'react-native';

const ParejaWidget = Platform.OS === 'android'
  ? NativeModules.ParejaWidget
  : NativeModules.ParejaWidgetModule;

export async function updateWidget(
  estado: string,
  mensaje: string,
  personajeId: string,
  carpeta: string,
): Promise<void> {
  if (!ParejaWidget) return;
  try {
    await ParejaWidget.updateWidgetData(estado, mensaje, personajeId, carpeta);
  } catch (_) {}
}
