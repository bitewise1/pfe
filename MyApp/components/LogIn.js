import React, { useEffect, useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Pressable, Alert, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Divider } from 'react-native-paper';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-facebook';
import { Ionicons } from '@expo/vector-icons';
import { auth } from "../firebaseConfig";  
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LogIn() {
  const navigation = useNavigation(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState('');

  // Moved `isFormValid` inside the function
  const isFormValid = () => email.trim() !== '' && password.trim() !== '';

  const handleEmailPasswordLogin = async () => {
    if (!isFormValid()) {
      Alert.alert('Erreur', 'Veuillez remplir correctement tous les champs');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken(true);  // Always refresh token

      console.log("Sending token to backend:", idToken);  // Debugging log

      const response = await fetch('http://192.168.1.14:3000/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`  // Send token in Authorization header
        },
        body: JSON.stringify({ idToken }) // Added missing body
      });

      const data = await response.json();
      console.log("Backend response:", data);

      if (response.ok) {
        console.log("Connexion réussie:", data);
        navigation.navigate('Home');  // Navigate to Home only if login is successful
      } else {
        setServerError(data.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.log('Erreur de connexion:', error);
      setServerError(error.message);
    }
  };

  // 🔹 Google Sign-In
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '1017733460133-9vb26o17igm227eko3bur0ub6285bsg3.apps.googleusercontent.com',
    iosClientId: '1017733460133-v0vo1cluujf0nc6lk5nl20oe8h8m4v86.apps.googleusercontent.com',
    androidClientId: '1017733460133-epv1rf173vhrnbnluc0sruffedra97bt.apps.googleusercontent.com'
  });

  useEffect(() => {
    if (response?.type === 'success') {
      console.log('Google Auth Success, token:', response.authentication.accessToken);
    }
  }, [response]);

  // 🔹 Facebook Sign-In
  useEffect(() => {
    Facebook.initializeAsync().then(() => {
      console.log('Facebook SDK initialized');
    });
  }, []);

  const handleFacebookLogin = async () => {
    try {
      const result = await Facebook.logInWithReadPermissionsAsync({
        permissions: ['public_profile', 'email'],
      });

      if (result.type === 'success') {
        console.log('Facebook token:', result.token);
      } else {
        console.log('Facebook login cancelled');
      }
    } catch (error) {
      console.log('Facebook Login Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/Images/leaf.png')} style={styles.topLeaf} />
      <Image source={require('../assets/Images/leaf.png')} style={styles.bottomLeaf} />
      <View style={styles.logoContainer}>
        <View style={styles.circle}>
          <Image source={require('../assets/Images/logo.png')} style={styles.logo} />
        </View>
      </View>

      <Text style={styles.welcomeText}>Welcome Back!</Text>
      <TextInput style={styles.input} placeholder='E-mail' keyboardType='email-address' autoCapitalize='none' value={email} onChangeText={setEmail} />
      
      <View style={styles.passwordContainer}>
        <TextInput style={styles.passwordInput} placeholder='Password' secureTextEntry={!isPasswordVisible} value={password} onChangeText={setPassword} />
        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
          <Icon name={isPasswordVisible ? 'eye' : 'eye-off'} size={20} style={styles.eyeIcon} />
        </TouchableOpacity>
      </View>

      {serverError !== '' && <Text style={styles.errorText}>{serverError}</Text>}

      <Pressable onPress={() => navigation.navigate('ResetPassword')}>
        <Text style={styles.reset}>Forgot Password?</Text>
      </Pressable>

      <Divider style={styles.Divider} />
      
      <View style={styles.signInContainer}>
        <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()}>
          <Ionicons name='logo-google' size={34} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fbButton} onPress={handleFacebookLogin}>
          <Ionicons name='logo-facebook' size={34} />
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, !isFormValid() && styles.buttonDisabled]} onPress={handleEmailPasswordLogin} disabled={!isFormValid()}>
          <Text style={styles.textButton}>Log In</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.accountText}>Don't you have an account?</Text>
        <Pressable onPress={() => navigation.navigate('UserType')}>
          <Text style={styles.signUpText}>Sign Up</Text>
        </Pressable>
      </View>
    </View>
  );
}
const { width } = Dimensions.get('window');
const pxToDp = (px) => {                                    
  return px * (width / 390);
};
const styles = StyleSheet.create ({
    container: {
        flex: 1,
        backgroundColor: '#F5E4C3',
        padding: pxToDp(20),
        justifyContent: 'center',
        overflow: 'visible',
        position: 'relative',
      },
    topLeaf:{
        width: 200,
        height: 200,
        transform: [{ rotate: '91.171deg' }],
        top: -3,
        left: -14,
        position: 'absolute',
        resizeMode: 'contain'
    },
    bottomLeaf:{
        width: 200,
        height: 200,
        transform: [{ rotate: '91.171deg' }, {scaleY: -1}, {scaleX: -1}],
        bottom: -3,
        right: -14,
        position: 'absolute',
        resizeMode: 'contain'
    },
    logoContainer:{
        marginTop: pxToDp(20),
        alignItems: 'center'
    },
    circle:{
        width: pxToDp(170),
        height:pxToDp(157),
        borderRadius: pxToDp(100),
        backgroundColor: 'white',  
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: pxToDp(5),
        elevation: 3,
        shadowOffset: { width: 0, height: pxToDp(2) }
    },
    logo:{
        width: pxToDp(200),
        height: pxToDp(200),
        resizeMode: 'contain',
        alignItems: 'center',
        justifyContent: 'center'
    },
    welcomeText:{
        width: pxToDp(350),
        height: pxToDp(100),
        color: '#000',
        textAlign: 'center', 
        fontFamily: 'Quicksand_700Bold',
        fontSize: pxToDp(40),
        marginVertical: pxToDp(15),
        alignItems: 'center',
        justifyContent: 'center'
    },
    input:{
        width: '100%',
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 15,
        paddingLeft: 15,
        fontSize: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ccc',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: pxToDp(10),
        elevation: 10,
        shadowOffset: { width: 0, height: pxToDp(2) }
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#ccc',
        height: 50,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: pxToDp(10),
        elevation: 10,
        shadowOffset: { width: 0, height: pxToDp(2) }
      },
      passwordInput: {
        flex: 1,
        height: '100%',
        paddingLeft: 15,
        fontSize: 16,
        
      },
      eyeIcon: {
        padding: 10,
        marginRight: 10,
      },
reset: {
  color: '#4F7B4A', 
  fontFamily: 'Quicksand_700Bold',
  fontSize: pxToDp(15),
  textDecorationLine: 'underline',
  marginVertical: pxToDp(10),},
Divider: {
  width: '80%',
  height: pxToDp(1),
   backgroundColor: '#000',
  alignSelf: 'center',
  marginVertical: pxToDp(10) },
buttonContainer:{
  width: '100%',
  alignItems: 'center',
  marginTop: pxToDp(30), 
  paddingBottom: pxToDp(20)
    },
button: {
        width: pxToDp(280),
        height: pxToDp(60),
        borderRadius: pxToDp(20),
        backgroundColor: '#2E4A32',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: pxToDp(10),
        elevation: 10,
        shadowOffset: { width: 0, height: pxToDp(2) },
        overflow: 'hidden'
    },
textButton: {
        color: 'white',
        fontFamily: 'Quicksand_700Bold',
        fontSize: 21
        },
textContainer:{
        textAlign: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        alignContent: 'center',
        
    },
    signUpText:{
        fontFamily: 'Quicksand_700Bold',
        color: '#4F7B4A',
        marginLeft: pxToDp(5),
        fontSize: pxToDp(15),
        textDecorationLine: 'underline'
    },
    accountText:{
        fontFamily: 'Quicksand_400Regular',
        color: '#4F7B4A',
        fontSize: pxToDp(15)
    }, 
    signInContainer:{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: pxToDp(30)
      
    }, 
    errorText: {
      color: 'red',
      marginBottom: 10, 
    paddingLeft: pxToDp(10)},
    buttonDisabled: {
      backgroundColor: '#aaa',
    },
})