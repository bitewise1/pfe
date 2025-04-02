import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './components/AppNavigator';
import { useFonts, Quicksand_400Regular, Quicksand_700Bold, Quicksand_500Medium, Quicksand_600SemiBold } from '@expo-google-fonts/quicksand';

import { AuthProvider } from './components/AuthContext'; 

export default function App() {
  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#4F7B4A" style={styles.loader} />;
  }

  return (
    <PaperProvider>
      <AuthProvider>
        <View style={styles.container}>
          <AppNavigator />
        </View>
      </AuthProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E4C3',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
