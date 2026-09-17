import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { supabase } from '../services/supabase/supabase';

const PERSONAJES = [
  { id: '1', nombre: 'Oso Amoroso', emoji: '🐻' },
  { id: '2', nombre: 'Gatito Tiernito', emoji: '🐱' },
  { id: '3', nombre: 'Perrito Fiel', emoji: '🐶' },
  { id: '4', nombre: 'Panda Dormilón', emoji: '🐼' },
];

export default function CharacterScreen({ navigation }: any) {
  const [seleccionado, setSeleccionado] = useState('');
  const [loading, setLoading] = useState(false);

  async function guardarPersonaje() {
    if (!seleccionado) {
      Alert.alert('Atención', 'Selecciona un personaje.');
      return;
    }

    setLoading(true);
    const { data: userAuth } = await supabase.auth.getUser();
    const userId = userAuth.user?.id;
    if (!userId) { setLoading(false); return; }

    const { error } = await supabase
      .from('profiles')
      .update({ personaje_id: seleccionado })
      .eq('id', userId);

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF5F5" />
      <Text style={styles.emoji}>🐾</Text>
      <Text style={styles.title}>Elige tu Personaje</Text>
      <Text style={styles.subtitle}>Este será tu avatar frente a tu pareja</Text>

      <View style={styles.grid}>
        {PERSONAJES.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, seleccionado === item.id && styles.cardSeleccionada]}
            onPress={() => setSeleccionado(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.cardEmoji}>{item.emoji}</Text>
            <Text style={[styles.cardNombre, seleccionado === item.id && styles.cardNombreSeleccionado]}>
              {item.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.botonGuardar, loading && styles.botonDeshabilitado]}
        onPress={guardarPersonaje}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.botonGuardarTexto}>{loading ? 'Guardando...' : 'Continuar'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#FFF5F5', justifyContent: 'center' },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: '#5A3E42', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8A6A70', textAlign: 'center', marginBottom: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 28 },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F0D4D8',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardSeleccionada: { backgroundColor: '#FFF0F2', borderColor: '#E8788A' },
  cardEmoji: { fontSize: 48, marginBottom: 10 },
  cardNombre: { fontSize: 14, fontWeight: '600', textAlign: 'center', color: '#8A6A70' },
  cardNombreSeleccionado: { color: '#E8788A' },
  botonGuardar: {
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
  botonGuardarTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
