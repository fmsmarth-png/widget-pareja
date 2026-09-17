import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';

export default function WelcomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF5F5" />
      <Text style={styles.emoji}>👩‍❤️‍👨</Text>
      <Text style={styles.title}>Widget Pareja</Text>
      <Text style={styles.subtitle}>Una pequeña presencia de tu pareja en tu teléfono</Text>
      <TouchableOpacity style={styles.boton} onPress={() => navigation.navigate('Auth')} activeOpacity={0.8}>
        <Text style={styles.botonTexto}>Comenzar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F5', padding: 40 },
  emoji: { fontSize: 72, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '800', color: '#5A3E42', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8A6A70', textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  boton: {
    backgroundColor: '#E8788A',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    shadowColor: '#E8788A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  botonTexto: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
