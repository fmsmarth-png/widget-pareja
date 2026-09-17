import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, TouchableOpacity,
  Animated, Image, ScrollView, RefreshControl, StatusBar, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase/supabase';
import { PERSONAJES_DATA, ANIMACIONES_ESTADOS, AnimacionConfig } from '../services/animationsMap';
import SpriteAnimator from '../components/SpriteAnimator';

const ESTADOS = [
  { id: 'TRABAJANDO', icono: '🏗️', texto: 'Trabajando' },
  { id: 'EN_CASA', icono: '🏠', texto: 'En casa' },
  { id: 'COMIENDO', icono: '🍕', texto: 'Comiendo' },
  { id: 'DURMIENDO', icono: '😴', texto: 'Durmiendo' },
  { id: 'LIBRE', icono: '🙂', texto: 'Libre' },
  { id: 'PENSANDO_EN_TI', icono: '❤️', texto: 'Pensando en ti' },
];

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
          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF5F5" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8788A" colors={['#E8788A']} />}
      >
        {/* TARJETA DE MI PAREJA */}
        <Animated.View style={[styles.cardPareja, { opacity: fadeAnim }]}>
          <Text style={styles.tituloSeccion}>{nombrePareja}</Text>
          {estadoPareja ? (
            <View style={styles.centrado}>
              {animPareja?.type === 'sprite' ? (
                <SpriteAnimator
                  source={animPareja.source}
                  frameCount={animPareja.frameCount!}
                  frameWidth={animPareja.frameWidth!}
                  frameHeight={animPareja.frameHeight!}
                  fps={animPareja.fps}
                  frameSequence={animPareja.frameSequence}
                  displaySize={120}
                />
              ) : animPareja?.type === 'gif' ? (
                <Image source={animPareja.source} style={styles.gifEstilo} />
              ) : (
                <Text style={styles.emojiGrande}>{infoPersonajePareja.emoji}</Text>
              )}
              <Text style={styles.textoEstado}>
                {infoEstadoPareja ? `${infoEstadoPareja.icono} ${infoEstadoPareja.texto}` : estadoPareja.estado}
              </Text>
              {estadoPareja.mensaje ? (
                <Text style={styles.mensajePareja}>"{estadoPareja.mensaje}"</Text>
              ) : null}
              {estadoPareja.updated_at && (
                <Text style={styles.timestamp}>{tiempoRelativo(estadoPareja.updated_at)}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.sinEstado}>Aún no ha compartido su estado</Text>
          )}
        </Animated.View>

        {/* SEPARADOR */}
        <View style={styles.separador}>
          <View style={styles.lineaSeparador} />
          <Text style={styles.corazonSeparador}>❤️</Text>
          <View style={styles.lineaSeparador} />
        </View>

        {/* MI ESTADO ACTUAL */}
        {miEstado && (
          <View style={styles.miEstadoCard}>
            <View style={styles.miEstadoRow}>
              {animMia?.type === 'sprite' ? (
                <SpriteAnimator
                  source={animMia.source}
                  frameCount={animMia.frameCount!}
                  frameWidth={animMia.frameWidth!}
                  frameHeight={animMia.frameHeight!}
                  fps={animMia.fps}
                  frameSequence={animMia.frameSequence}
                  displaySize={50}
                />
              ) : animMia?.type === 'gif' ? (
                <Image source={animMia.source} style={styles.gifPequeno} />
              ) : (
                <Text style={styles.emojiPequeno}>{infoMiPersonaje.emoji}</Text>
              )}
              <View style={styles.miEstadoTextos}>
                <Text style={styles.miEstadoLabel}>Mi estado</Text>
                <Text style={styles.miEstadoValor}>
                  {infoMiEstado ? `${infoMiEstado.icono} ${infoMiEstado.texto}` : miEstado.estado}
                </Text>
                {miEstado.mensaje ? (
                  <Text style={styles.miMensaje}>"{miEstado.mensaje}"</Text>
                ) : null}
              </View>
            </View>
          </View>
        )}

        {/* SELECTOR DE ESTADO */}
        <Text style={styles.pregunta}>Qué estás haciendo?</Text>

        <View style={styles.estadosGrid}>
          {ESTADOS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.botonEstado, estadoActual === item.id && styles.botonSeleccionado]}
              onPress={() => setEstadoActual(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.botonIcono}>{item.icono}</Text>
              <Text style={[styles.botonTexto, estadoActual === item.id && styles.botonTextoSeleccionado]}>
                {item.texto}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* MENSAJE */}
        <TextInput
          style={styles.input}
          placeholder="Un mensaje corto..."
          placeholderTextColor="#CBA8AE"
          value={mensaje}
          onChangeText={setMensaje}
          maxLength={80}
        />

        {/* ENVIAR */}
        <TouchableOpacity
          style={[styles.botonEnviar, loading && styles.botonDeshabilitado]}
          onPress={enviarEstado}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.botonEnviarTexto}>{loading ? 'Enviando...' : 'Actualizar mi estado'}</Text>
        </TouchableOpacity>

        <Pressable style={styles.botonCerrarSesion} onPress={cerrarSesion}>
          <Text style={styles.botonCerrarSesionTexto}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF5F5' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  cardPareja: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#E8788A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  tituloSeccion: { fontSize: 20, fontWeight: '700', color: '#5A3E42', marginBottom: 12 },
  centrado: { alignItems: 'center' },
  gifEstilo: { width: 120, height: 120, resizeMode: 'contain', marginBottom: 8 },
  emojiGrande: { fontSize: 64, marginBottom: 8 },
  textoEstado: { fontSize: 18, fontWeight: '600', color: '#5A3E42', marginTop: 4 },
  mensajePareja: { fontSize: 15, fontStyle: 'italic', color: '#8A6A70', marginTop: 8, textAlign: 'center' },
  timestamp: { fontSize: 12, color: '#C9A0A8', marginTop: 6 },
  sinEstado: { fontSize: 14, color: '#C9A0A8', fontStyle: 'italic', marginTop: 8 },

  separador: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  lineaSeparador: { flex: 1, height: 1, backgroundColor: '#F0D4D8' },
  corazonSeparador: { marginHorizontal: 12, fontSize: 16 },

  miEstadoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#E8788A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  miEstadoRow: { flexDirection: 'row', alignItems: 'center' },
  gifPequeno: { width: 50, height: 50, resizeMode: 'contain', marginRight: 14 },
  emojiPequeno: { fontSize: 36, marginRight: 14 },
  miEstadoTextos: { flex: 1 },
  miEstadoLabel: { fontSize: 12, color: '#C9A0A8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 },
  miEstadoValor: { fontSize: 16, fontWeight: '600', color: '#5A3E42', marginTop: 2 },
  miMensaje: { fontSize: 13, fontStyle: 'italic', color: '#8A6A70', marginTop: 4 },

  pregunta: { fontSize: 18, fontWeight: '700', color: '#5A3E42', marginBottom: 14, textAlign: 'center' },

  estadosGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  botonEstado: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#F0D4D8',
    alignItems: 'center',
    marginBottom: 10,
  },
  botonSeleccionado: { backgroundColor: '#FFF0F2', borderColor: '#E8788A' },
  botonIcono: { fontSize: 24, marginBottom: 4 },
  botonTexto: { fontSize: 13, fontWeight: '600', color: '#8A6A70' },
  botonTextoSeleccionado: { color: '#E8788A' },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F0D4D8',
    padding: 14,
    borderRadius: 14,
    fontSize: 15,
    color: '#5A3E42',
    marginBottom: 16,
  },

  botonEnviar: {
    backgroundColor: '#E8788A',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#E8788A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonEnviarTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  botonCerrarSesion: { marginTop: 24, alignItems: 'center', paddingVertical: 12 },
  botonCerrarSesionTexto: { color: '#C9A0A8', fontSize: 13, fontWeight: '500' },
});
