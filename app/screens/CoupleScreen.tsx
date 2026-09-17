import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, StatusBar } from 'react-native';
import { supabase } from '../services/supabase/supabase';

export default function CoupleScreen({ navigation }: any) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function createCouple() {
    setLoading(true);
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: userAuth } = await supabase.auth.getUser();
    const userId = userAuth.user?.id;

    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .insert([{ invite_code: newCode }])
      .select()
      .single();

    if (coupleError) {
      Alert.alert('Error', coupleError.message);
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from('couple_members')
      .insert([{ couple_id: coupleData.id, user_id: userId }]);

    setLoading(false);
    if (memberError) {
      Alert.alert('Error', memberError.message);
    } else {
      Alert.alert('Pareja Creada', `Tu código es:\n\n${newCode}\n\nCompártelo con tu pareja.`);
      navigation.reset({ index: 0, routes: [{ name: 'Character' }] });
    }
  }

  async function joinCouple() {
    if (!inviteCode) {
      Alert.alert('Atención', 'Ingresa un código válido.');
      return;
    }
    setLoading(true);
    const { data: userAuth } = await supabase.auth.getUser();
    const userId = userAuth.user?.id;

    const { data: coupleData, error: searchError } = await supabase
      .from('couples')
      .select('id')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .single();

    if (searchError || !coupleData) {
      Alert.alert('Error', 'Código no encontrado.');
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from('couple_members')
      .insert([{ couple_id: coupleData.id, user_id: userId }]);

    setLoading(false);
    if (memberError) {
      Alert.alert('Error', 'No pudiste unirte. Quizás la pareja ya está completa.');
    } else {
      Alert.alert('Vinculados!', 'Te has unido a tu pareja.');
      navigation.reset({ index: 0, routes: [{ name: 'Character' }] });
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF5F5" />
      <Text style={styles.emoji}>🔗</Text>
      <Text style={styles.title}>Vincular Pareja</Text>

      <View style={styles.seccion}>
        <Text style={styles.subtitulo}>Crear pareja nueva</Text>
        <TouchableOpacity style={styles.botonPrimario} onPress={createCouple} disabled={loading} activeOpacity={0.8}>
          <Text style={styles.botonPrimarioTexto}>Generar Código</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.separador}>
        <View style={styles.linea} />
        <Text style={styles.separadorTexto}>o</Text>
        <View style={styles.linea} />
      </View>

      <View style={styles.seccion}>
        <Text style={styles.subtitulo}>Ya tengo un código</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: K7F2XP"
          placeholderTextColor="#CBA8AE"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.botonSecundario} onPress={joinCouple} disabled={loading} activeOpacity={0.8}>
          <Text style={styles.botonSecundarioTexto}>Unirme a mi pareja</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#FFF5F5', justifyContent: 'center' },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: '#5A3E42', marginBottom: 28 },
  seccion: { marginBottom: 8 },
  subtitulo: { fontSize: 16, color: '#8A6A70', textAlign: 'center', marginBottom: 12, fontWeight: '500' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F0D4D8',
    padding: 14,
    borderRadius: 14,
    fontSize: 20,
    color: '#5A3E42',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 14,
    fontWeight: '700',
  },
  separador: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  linea: { flex: 1, height: 1, backgroundColor: '#F0D4D8' },
  separadorTexto: { marginHorizontal: 16, fontSize: 14, color: '#CBA8AE', fontWeight: '500' },
  botonPrimario: {
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
  botonPrimarioTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  botonSecundario: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8788A',
  },
  botonSecundarioTexto: { color: '#E8788A', fontSize: 16, fontWeight: '700' },
});
