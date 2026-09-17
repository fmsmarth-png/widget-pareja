export const PERSONAJES_DATA: Record<string, { nombre: string; emoji: string; carpeta: string }> = {
  '1': { nombre: 'Oso Amoroso', emoji: '🐻', carpeta: 'oso' },
  '2': { nombre: 'Gatito Tiernito', emoji: '🐱', carpeta: 'gato' },
  '3': { nombre: 'Perrito Fiel', emoji: '🐶', carpeta: 'perro' },
  '4': { nombre: 'Panda Dormilón', emoji: '🐼', carpeta: 'panda' },
};

export interface AnimacionConfig {
  source: any;
  type: 'gif' | 'sprite';
  frameCount?: number;
  frameWidth?: number;
  frameHeight?: number;
  fps?: number;
  frameSequence?: number[];
}

// Para agregar animaciones pixel art:
//
// 1. Crea un sprite sheet PNG con los frames en fila horizontal
//    Ejemplo: 4 frames de 64x64 = imagen de 256x64
//
// 2. Exporta ya escalado a 2x-4x con nearest neighbor desde Aseprite/Piskel
//    Ejemplo: 4 frames de 128x128 = imagen de 512x128
//
// 3. Agrega la entrada aquí con type: 'sprite' y los datos del frame
//
// Ejemplo:
// '1_TRABAJANDO': {
//   source: require('../../assets/characters/oso/trabajando.png'),
//   type: 'sprite',
//   frameCount: 4,
//   frameWidth: 128,
//   frameHeight: 128,
//   fps: 4,
// },

export const ANIMACIONES_ESTADOS: Record<string, AnimacionConfig> = {
  // Perrito Fiel - sprite sheet pixel art (4 frames de 1032x1024, frame 2 saltado por artefacto JPG)
  '3_TRABAJANDO': {
    source: require('../../assets/characters/perro/trabajando.jpg'),
    type: 'sprite',
    frameCount: 4,
    frameWidth: 1032,
    frameHeight: 1024,
    fps: 3,
    frameSequence: [0, 2, 3, 2],
  },

  '3_COMIENDO': {
    source: require('../../assets/characters/perro/comiendo.jpg'),
    type: 'sprite',
    frameCount: 4,
    frameWidth: 1032,
    frameHeight: 1024,
    fps: 3,
  },

  '3_DURMIENDO': {
    source: require('../../assets/characters/perro/durmiendo.jpg'),
    type: 'sprite',
    frameCount: 4,
    frameWidth: 1032,
    frameHeight: 1024,
    fps: 3,
  },

};
