import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper'
import AppNavigator from './components/AppNavigator';
import LogIn from './components/LogIn';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';

import { useFonts, Quicksand_400Regular, Quicksand_700Bold, Quicksand_500Medium, Quicksand_600SemiBold, } from '@expo-google-fonts/quicksand';
export default function App() {
  const [fontsLoaded] = useFonts({
    Quicksand_500Medium,  
    Quicksand_600SemiBold,
    Quicksand_400Regular,
    Quicksand_700Bold,
  });
  const [user, setUser] = useState(null); // User state to track logged-in user
  const [loading, setLoading] = useState(true); // Loading state for async operation

  // Check if user is logged in (Firebase auth state persistence)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user); // Set user object if logged in
      } else {
        setUser(null); // Set user to null if logged out
      }
      setLoading(false); // Set loading to false once auth state is checked
    });

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, []);
  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#4F7B4A" style={styles.loader} />;
  }
  return (
    <PaperProvider>
      <View style={styles.container}>
        <AppNavigator />  
      </View>
    </PaperProvider>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#F5E4C3'
  }
});


