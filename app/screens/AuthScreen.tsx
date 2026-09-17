import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../services/supabase/supabase';

export default function AuthScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUp() {
    if (!email || !password) {
      Alert.alert('Atención', 'Ingresa correo y contraseña.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      Alert.alert('Error', error.message);
    } else if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, nombre: email.split('@')[0] }]);
      if (profileError) {
        Alert.alert('Error', profileError.message);
      } else {
        Alert.alert('Cuenta creada', 'Ahora inicia sesión.');
      }
    }
    setLoading(false);
  }

  async function signIn() {
    if (!email || !password) {
      Alert.alert('Atención', 'Ingresa correo y contraseña.');
      return;
    }
    setLoading(true);
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    const { data: memberData } = await supabase
      .from('couple_members')
      .select('couple_id')
      .eq('user_id', userId)
      .single();

    if (!memberData) {
      setLoading(false);
      navigation.reset({ index: 0, routes: [{ name: 'Couple' }] });
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('personaje_id')
      .eq('id', userId)
      .single();

    setLoading(false);

    if (profileData?.personaje_id) {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Character' }] });
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF5F5" />
      <Text style={styles.emoji}>🔐</Text>
      <Text style={styles.title}>Identifícate</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#CBA8AE"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña (mín. 6 caracteres)"
        placeholderTextColor="#CBA8AE"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.botonPrimario} onPress={signIn} disabled={loading} activeOpacity={0.8}>
        <Text style={styles.botonPrimarioTexto}>{loading ? 'Cargando...' : 'Iniciar Sesión'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botonSecundario} onPress={signUp} disabled={loading} activeOpacity={0.8}>
        <Text style={styles.botonSecundarioTexto}>Crear Cuenta</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FFF5F5' },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: '#5A3E42', marginBottom: 28 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F0D4D8',
    padding: 14,
    borderRadius: 14,
    fontSize: 16,
    color: '#5A3E42',
    marginBottom: 14,
  },
  botonPrimario: {
    backgroundColor: '#E8788A',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
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
