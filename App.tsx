import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './app/services/supabase/supabase';

import WelcomeScreen from './app/screens/WelcomeScreen';
import AuthScreen from './app/screens/AuthScreen';
import CoupleScreen from './app/screens/CoupleScreen';
import CharacterScreen from './app/screens/CharacterScreen';
import HomeScreen from './app/screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setInitialRoute('Welcome');
      return;
    }

    const { data: memberData } = await supabase
      .from('couple_members')
      .select('couple_id')
      .eq('user_id', session.user.id)
      .single();

    if (memberData) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('personaje_id')
        .eq('id', session.user.id)
        .single();

      if (profileData?.personaje_id) {
        setInitialRoute('Home');
      } else {
        setInitialRoute('Character');
      }
    } else {
      setInitialRoute('Couple');
    }
  }

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F5' }}>
        <ActivityIndicator size="large" color="#E8788A" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: { backgroundColor: '#FFF5F5' },
          headerTintColor: '#E8788A',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#FFF5F5' },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ title: 'Inicio', headerShown: false }} />
        <Stack.Screen name="Auth" component={AuthScreen} options={{ title: 'Cuenta', headerBackVisible: false }} />
        <Stack.Screen name="Couple" component={CoupleScreen} options={{ title: 'Vincular', headerBackVisible: false }} />
        <Stack.Screen name="Character" component={CharacterScreen} options={{ title: 'Elige tu Personaje', headerBackVisible: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Mi Pareja', headerBackVisible: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
