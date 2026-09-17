import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, TouchableOpacity,
  Animated, Image, ScrollView, RefreshControl, StatusBar, Pressable,
  ImageBackground, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { supabase } from '../services/supabase/supabase';
import { PERSONAJES_DATA, ANIMACIONES_ESTADOS, AnimacionConfig } from '../services/animationsMap';
import SpriteAnimator from '../components/SpriteAnimator';
import { updateWidget } from '../services/widgetBridge';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_SIZE = (SCREEN_W - 40 - 8) / 3;

const ESTADOS = [
  { id: 'TRABAJANDO', texto: 'Trabajando', image: require('../../assets/ui/cards/trabajando.png') },
  { id: 'EN_CASA', texto: 'En casa', image: require('../../assets/ui/cards/en_casa.png') },
  { id: 'COMIENDO', texto: 'Comiendo', image: require('../../assets/ui/cards/comiendo.png') },
  { id: 'DURMIENDO', texto: 'Durmiendo', image: require('../../assets/ui/cards/durmiendo.png') },
  { id: 'LIBRE', texto: 'Libre', image: require('../../assets/ui/cards/libre.png') },
  { id: 'PENSANDO_EN_TI', texto: 'Pensando en ti', image: require('../../assets/ui/cards/pensando_en_ti.png') },
];

const ESTADO_EMOJI: Record<string, string> = {
  TRABAJANDO: '🏗️',
  EN_CASA: '🏠',
  COMIENDO: '🍕',
  DURMIENDO: '😴',
  LIBRE: '🙂',
  PENSANDO_EN_TI: '❤️',
};

function tiempoRelativo(fecha: string): string {
  const ahora = Date.now();
  const entonces = new Date(fecha).getTime();
  const diffSeg = Math.floor((ahora - entonces) / 1000);
  if (diffSeg < 60) return 'hace un momento';
  const diffMin = Math.floor(diffSeg / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `hace ${diffHoras}h`;
  const diffDias = Math.floor(diffHoras / 24);
  return `hace ${diffDias}d`;
}

export default function HomeScreen({ navigation }: any) {
  const [fontsLoaded] = useFonts({
    'PressStart2P': require('../../assets/fonts/PressStart2P-Regular.ttf'),
  });

  const [estadoActual, setEstadoActual] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [coupleId, setCoupleId] = useState('');
  const [userId, setUserId] = useState('');
  const [miPersonajeId, setMiPersonajeId] = useState('1');
  const [miEstado, setMiEstado] = useState<any>(null);

  const [estadoPareja, setEstadoPareja] = useState<any>(null);
  const [personajeParejaId, setPersonajeParejaId] = useState<string>('1');
  const [nombrePareja, setNombrePareja] = useState('Tu pareja');
  const [partnerId, setPartnerId] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    cargarDatosYPareja();
  }, []);

  useEffect(() => {
    if (!coupleId) return;

    const channel = supabase
      .channel('statuses-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'statuses', filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          const nuevo = payload.new as any;
          if (nuevo && nuevo.user_id !== userId) {
            setEstadoPareja(nuevo);
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
            const pData = PERSONAJES_DATA[personajeParejaId];
            if (pData) updateWidget(nuevo.estado, nuevo.mensaje || '', personajeParejaId, pData.carpeta);
          }
          if (nuevo && nuevo.user_id === userId) {
            setMiEstado(nuevo);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, userId]);

  async function cargarDatosYPareja() {
    const { data: userAuth } = await supabase.auth.getUser();
    const uid = userAuth.user?.id;
    if (!uid) return;
    setUserId(uid);

    const { data: miPerfil } = await supabase
      .from('profiles')
      .select('personaje_id')
      .eq('id', uid)
      .single();
    if (miPerfil?.personaje_id) setMiPersonajeId(miPerfil.personaje_id);

    const { data: memberData } = await supabase
      .from('couple_members')
      .select('couple_id')
      .eq('user_id', uid)
      .single();

    if (memberData) {
      const cId = memberData.couple_id;
      setCoupleId(cId);

      const { data: miStatus } = await supabase
        .from('statuses')
        .select('*')
        .eq('user_id', uid)
        .single();
      if (miStatus) {
        setMiEstado(miStatus);
        setEstadoActual(miStatus.estado);
        setMensaje(miStatus.mensaje || '');
      }

      await consultarDatosPareja(cId, uid);
    }
  }

  async function consultarDatosPareja(cId: string, currentUid: string) {
    const { data: partners } = await supabase
      .from('couple_members')
      .select('user_id')
      .eq('couple_id', cId)
      .neq('user_id', currentUid);

    if (partners && partners.length > 0) {
      const pId = partners[0].user_id;
      setPartnerId(pId);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('personaje_id, nombre')
        .eq('id', pId)
        .single();

      if (profileData) {
        if (profileData.personaje_id) setPersonajeParejaId(profileData.personaje_id);
        if (profileData.nombre) setNombrePareja(profileData.nombre);
      }

      const { data: statusData } = await supabase
        .from('statuses')
        .select('*')
        .eq('user_id', pId)
        .single();

      if (statusData) {
        setEstadoPareja(statusData);
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        const pId2 = profileData?.personaje_id || '1';
        const pData = PERSONAJES_DATA[pId2];
        if (pData) updateWidget(statusData.estado, statusData.mensaje || '', pId2, pData.carpeta);
      }
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarDatosYPareja();
    setRefreshing(false);
  }, []);

  async function enviarEstado() {
    if (!estadoActual) {
      Alert.alert('Elige un estado primero');
      return;
    }
    if (!coupleId) {
      Alert.alert('Error', 'No se encontró tu pareja.');
      return;
    }

    setLoading(true);

    const { data: statusData } = await supabase
      .from('statuses')
      .select('id')
      .eq('user_id', userId)
      .single();

    let errorObj;

    if (statusData) {
      const { error } = await supabase
        .from('statuses')
        .update({ estado: estadoActual, mensaje, updated_at: new Date().toISOString() })
        .eq('id', statusData.id);
      errorObj = error;
    } else {
      const { error } = await supabase
        .from('statuses')
        .insert([{ couple_id: coupleId, user_id: userId, estado: estadoActual, mensaje }]);
      errorObj = error;
    }

    setLoading(false);

    if (errorObj) {
      Alert.alert('Error', errorObj.message);
    } else {
      setMiEstado({ estado: estadoActual, mensaje, updated_at: new Date().toISOString() });
    }
  }

  async function cerrarSesion() {
    Alert.alert('Cerrar sesión', '¿Estás segura?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
        },
      },
    ]);
  }

  const infoPersonajePareja = PERSONAJES_DATA[personajeParejaId] || { nombre: 'Tu Pareja', emoji: '✨' };
  const infoEstadoPareja = ESTADOS.find(e => e.id === estadoPareja?.estado);
  const infoMiPersonaje = PERSONAJES_DATA[miPersonajeId] || { nombre: 'Yo', emoji: '✨' };
  const infoMiEstado = ESTADOS.find(e => e.id === miEstado?.estado);

  const claveAnimacionPareja = `${personajeParejaId}_${estadoPareja?.estado}`;
  const animPareja = ANIMACIONES_ESTADOS[claveAnimacionPareja] as AnimacionConfig | undefined;

  const claveAnimacionMia = `${miPersonajeId}_${miEstado?.estado}`;
  const animMia = ANIMACIONES_ESTADOS[claveAnimacionMia] as AnimacionConfig | undefined;

  const PF = fontsLoaded ? 'PressStart2P' : undefined;

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A3E" translucent />
      <ImageBackground
        source={require('../../assets/ui/background.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* HEADER */}
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerHeart}>❤️</Text>
              <Text style={styles.headerTitle}>Mi Pareja</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={cerrarSesion} style={styles.headerIcon}>
                <Text style={styles.headerIconText}>⚙️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8788A" colors={['#E8788A']} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* TARJETA DE MI PAREJA */}
          <Animated.View style={[styles.parejaSection, { opacity: fadeAnim }]}>
            <View style={styles.parejaRow}>
              {/* Animación grande */}
              <View style={styles.parejaAnimBox}>
                <View style={styles.parejaAnimFrame}>
                  {animPareja?.type === 'sprite' ? (
                    <SpriteAnimator
                      source={animPareja.source}
                      frameCount={animPareja.frameCount!}
                      frameWidth={animPareja.frameWidth!}
                      frameHeight={animPareja.frameHeight!}
                      fps={animPareja.fps}
                      frameSequence={animPareja.frameSequence}
                      displaySize={160}
                    />
                  ) : animPareja?.type === 'gif' ? (
                    <Image source={animPareja.source} style={styles.gifGrande} />
                  ) : estadoPareja ? (
                    <Text style={styles.emojiGrande}>{infoPersonajePareja.emoji}</Text>
                  ) : (
                    <Text style={styles.emojiGrande}>💤</Text>
                  )}
                </View>
              </View>

              {/* Info pareja */}
              <View style={styles.parejaInfoCard}>
                <Text style={styles.parejaNombre}>
                  {nombrePareja}
                </Text>
                {estadoPareja ? (
                  <>
                    <Text style={styles.parejaEmoji}>
                      {ESTADO_EMOJI[estadoPareja.estado] || '✨'}
                    </Text>
                    <Text style={styles.parejaEstado}>
                      {infoEstadoPareja?.texto || estadoPareja.estado}
                    </Text>
                    {estadoPareja.mensaje ? (
                      <Text style={styles.parejaMensaje}>"{estadoPareja.mensaje}"</Text>
                    ) : null}
                    {estadoPareja.updated_at && (
                      <View style={styles.timestampRow}>
                        <Text style={styles.timestampIcon}>🕐</Text>
                        <Text style={styles.timestamp}>{tiempoRelativo(estadoPareja.updated_at)}</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.sinEstado}>Aún no ha{'\n'}compartido{'\n'}su estado</Text>
                )}
              </View>
            </View>
          </Animated.View>

          {/* MI ESTADO */}
          {miEstado && (
            <View style={styles.miEstadoBar}>
              <View style={styles.miEstadoLeft}>
                {animMia?.type === 'sprite' ? (
                  <SpriteAnimator
                    source={animMia.source}
                    frameCount={animMia.frameCount!}
                    frameWidth={animMia.frameWidth!}
                    frameHeight={animMia.frameHeight!}
                    fps={animMia.fps}
                    frameSequence={animMia.frameSequence}
                    displaySize={40}
                  />
                ) : (
                  <Text style={styles.miEstadoEmoji}>{infoMiPersonaje.emoji}</Text>
                )}
                <View style={styles.miEstadoTextos}>
                  <Text style={styles.miEstadoLabel}>
                    MI ESTADO
                  </Text>
                  <Text style={styles.miEstadoValor}>
                    {ESTADO_EMOJI[miEstado.estado] || '✨'} {infoMiEstado?.texto || miEstado.estado}
                  </Text>
                  {miEstado.mensaje ? (
                    <Text style={styles.miEstadoMensaje}>"{miEstado.mensaje}"</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.miEstadoRight}>
                <Text style={styles.heartFloat}>❤️</Text>
                <Text style={styles.heartFloat2}>💕</Text>
                <Text style={styles.arrowRight}>›</Text>
              </View>
            </View>
          )}

          {/* SELECTOR DE ESTADO */}
          <View style={styles.selectorHeader}>
            <Text style={styles.heartSmall}>❤️</Text>
            <Text style={styles.pregunta}>
              ¿Qué estás haciendo?
            </Text>
            <Text style={styles.heartSmall}>❤️</Text>
          </View>

          <View style={styles.estadosGrid}>
            {ESTADOS.map((item) => {
              const selected = estadoActual === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.estadoCard, selected && styles.estadoCardSelected]}
                  onPress={() => setEstadoActual(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.estadoCardContainer}>
                    <Image source={item.image} style={styles.estadoCardImage} />
                    <Text style={styles.estadoCardOverlayText}>{item.texto}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* MENSAJE */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Un mensaje corto..."
              placeholderTextColor="#8A6A70"
              value={mensaje}
              onChangeText={setMensaje}
              maxLength={80}
            />
          </View>

          {/* ENVIAR */}
          <TouchableOpacity
            style={[styles.botonEnviar, loading && styles.botonDeshabilitado]}
            onPress={enviarEstado}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.botonEnviarTexto}>
              {loading ? 'Enviando...' : 'Actualizar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botonCerrarSesion} onPress={cerrarSesion}>
            <Text style={styles.botonCerrarSesionTexto}>Cerrar sesión</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>

      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A3E' },
  backgroundImage: { flex: 1 },
  headerSafe: { backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#E8788A',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerHeart: { fontSize: 18 },
  headerTitle: { fontFamily: 'PressStart2P', fontSize: 14, color: '#FFFFFF', textShadowColor: '#C0506A', textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 0 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { padding: 4 },
  headerIconText: { fontSize: 22 },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 },

  // Partner section
  parejaSection: { marginBottom: 12 },
  parejaRow: { flexDirection: 'row', gap: 10 },
  parejaAnimBox: { flex: 1.2 },
  parejaAnimFrame: {
    backgroundColor: '#2A2A5E',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#8B5E3C',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  gifGrande: { width: 160, height: 160, resizeMode: 'contain' },
  emojiGrande: { fontSize: 72 },

  parejaInfoCard: {
    flex: 1,
    backgroundColor: '#FFF5E6',
    borderRadius: 8,
    padding: 14,
    borderWidth: 2,
    borderColor: '#D4B896',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  parejaNombre: { fontFamily: 'PressStart2P', fontSize: 10, color: '#5A3E42', marginBottom: 6 },
  parejaEmoji: { fontSize: 28, marginBottom: 2 },
  parejaEstado: { fontFamily: 'PressStart2P', fontSize: 9, color: '#5A3E42', marginBottom: 4 },
  parejaMensaje: { fontFamily: 'PressStart2P', fontSize: 7, color: '#8A6A70', marginBottom: 6 },
  timestampRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timestampIcon: { fontSize: 10 },
  timestamp: { fontFamily: 'PressStart2P', fontSize: 6, color: '#A08890' },
  sinEstado: { fontFamily: 'PressStart2P', fontSize: 7, color: '#A08890', lineHeight: 14 },

  // Mi estado bar
  miEstadoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFB6C8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#E8788A',
  },
  miEstadoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  miEstadoEmoji: { fontSize: 28 },
  miEstadoTextos: { flex: 1 },
  miEstadoLabel: { fontFamily: 'PressStart2P', fontSize: 6, color: '#8A4A5A', letterSpacing: 1, marginBottom: 2 },
  miEstadoValor: { fontFamily: 'PressStart2P', fontSize: 8, color: '#5A2A3A' },
  miEstadoMensaje: { fontFamily: 'PressStart2P', fontSize: 6, color: '#7A4A5A', marginTop: 2 },
  miEstadoRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  heartFloat: { fontSize: 14 },
  heartFloat2: { fontSize: 12 },
  arrowRight: { fontFamily: 'PressStart2P', fontSize: 18, color: '#8A4A5A' },

  // Selector
  selectorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  heartSmall: { fontSize: 12 },
  pregunta: { fontFamily: 'PressStart2P', fontSize: 10, color: '#FFFFFF', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },

  estadosGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, marginBottom: 14 },
  estadoCard: {
    width: CARD_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#2A2A5E',
  },
  estadoCardSelected: { borderColor: '#FF69B4', borderWidth: 3 },
  estadoCardContainer: {
    position: 'relative',
  },
  estadoCardImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 246 / 188,
  },
  estadoCardOverlayText: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: 'PressStart2P',
    fontSize: 7,
    color: '#5A3E42',
  },

  // Input
  inputContainer: {
    backgroundColor: '#2A2A5E',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#8B5E3C',
    marginBottom: 12,
  },
  input: {
    fontFamily: 'PressStart2P',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 8,
    color: '#FFF5E6',
  },

  // Button
  botonEnviar: {
    backgroundColor: '#E8788A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#C04060',
    shadowColor: '#C04060',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 4,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonEnviarTexto: { fontFamily: 'PressStart2P', color: '#FFFFFF', fontSize: 10, textShadowColor: '#C04060', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0 },

  botonCerrarSesion: { marginTop: 16, alignItems: 'center', paddingVertical: 10 },
  botonCerrarSesionTexto: { fontFamily: 'PressStart2P', fontSize: 7, color: '#8A6A70' },

  bottomSpacer: { height: 200 },

});
