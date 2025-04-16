// App.js
import React, { useContext } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './components/AuthNavigator';
import PersonalNavigator from './components/PersonalNavigator';
import ProfessionalNavigator from './components/ProfessionalNavigator';
import { AuthProvider, AuthContext } from './components/AuthContext';
import {
  useFonts,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';

function RootNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4F7B4A" />
      </View>
    );
  }

  // No user: show common auth flow (Welcome, LogIn, UserType, ResetPassword, plus sign-up flows).
  if (!user) {
    return <AuthNavigator />;
  }

  // Logged in: choose the appropriate navigator based on user.userType.
  return user.userType === 'Professional' ? (
    <ProfessionalNavigator />
  ) : (
    <PersonalNavigator />
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4F7B4A" />
      </View>
    );
  }

  return (
    <PaperProvider>
      <AuthProvider>
        {/* Use one NavigationContainer around the RootNavigator */}
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
