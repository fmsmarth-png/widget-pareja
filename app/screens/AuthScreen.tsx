import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { useFonts } from 'expo-font';
import { supabase } from '../services/supabase/supabase';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('screen');

const FRAMES = [
  require('../../assets/ui/auth/frame_1.jpg'),
  require('../../assets/ui/auth/frame_2.jpg'),
  require('../../assets/ui/auth/frame_3.jpg'),
  require('../../assets/ui/auth/frame_4.jpg'),
];

export default function AuthScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [fontsLoaded] = useFonts({
    PressStart2P: require('../../assets/fonts/PressStart2P-Regular.ttf'),
  });

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % FRAMES.length);
    }, 250);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const signIn = useCallback(async () => {
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
  }, [email, password, navigation]);

  if (!fontsLoaded) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {FRAMES.map((frame, i) => (
        <Image
          key={i}
          source={frame}
          style={[
            styles.bgFrame,
            { opacity: i === frameIndex ? 1 : 0 },
          ]}
          resizeMode="cover"
        />
      ))}

      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.spacer} />

        <View style={styles.formArea}>
          <TextInput
            style={styles.input}
            placeholder="Correo"
            placeholderTextColor="rgba(255,245,230,0.5)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="rgba(255,245,230,0.5)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={signIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.btnPrimaryText}>
              {loading ? 'Cargando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A3E',
  },
  bgFrame: {
    position: 'absolute',
    width: SCREEN_W,
    height: SCREEN_H,
    top: 0,
    left: 0,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
  },
  spacer: {
    flex: 1,
  },
  formArea: {
    width: '100%',
  },
  input: {
    backgroundColor: 'rgba(42, 42, 94, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(139, 94, 60, 0.7)',
    borderRadius: 8,
    padding: 14,
    fontSize: 10,
    color: '#FFF5E6',
    fontFamily: 'PressStart2P',
    marginBottom: 12,
  },
  btnPrimary: {
    backgroundColor: 'rgba(232, 120, 138, 0.85)',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 3,
    borderColor: '#C04060',
    elevation: 4,
  },
  btnPrimaryText: {
    fontFamily: 'PressStart2P',
    color: '#FFFFFF',
    fontSize: 10,
    textShadowColor: '#C04060',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  bottomSpacer: {
    height: 24,
  },
});
