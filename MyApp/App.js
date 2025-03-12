import * as React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper'
import AppNavigator from './components/AppNavigator';
import { useFonts, Quicksand_400Regular, Quicksand_700Bold, Quicksand_500Medium, Quicksand_600SemiBold, } from '@expo-google-fonts/quicksand';
export default function App() {
  const [fontsLoaded] = useFonts({
    Quicksand_500Medium,  
    Quicksand_600SemiBold,
    Quicksand_400Regular,
    Quicksand_700Bold,
  });
  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#4F7B4A" style={styles.loader} />;
  }
  return (
    <PaperProvider>
      <View style={styles.container}>
          <AppNavigator/>
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


