import React, {useEffect} from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, Alert } from 'react-native';
import styles from './Styles';
import {Button, Divider} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-facebook';
import {auth, db} from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { FacebookAuthProvider } from "firebase/auth";
import { fetchSignInMethodsForEmail } from "firebase/auth";

export default function SignUp() {
    const route = useRoute();
    const userType = route.params?.userType || 'Unknown';  
    console.log("UserType received in SignUp:", userType); 
    const navigation = useNavigation();   
    const [email, setEmail] = useState('') 
    const [password, setPassword] = useState ('');
    const [confirmPassword, setConfirmPassword] = useState ('');
    const [isPasswordVisible, setIsPasswordVisble] = useState (false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [serverError, setServerError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    
    // general sign up
    const validatePassword = (password) => {
      const minLength = 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
      return (
        password.length >= minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumber &&
        hasSpecialChar
      );
    };
    
    
    const validateEmail = (email) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    } 
    const isFormValid = () => email.trim() !== '' && password.trim() !== '' && password === confirmPassword && validateEmail(email) && validatePassword(password);
    
    const checkEmailExists = async (email) => {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      return signInMethods.length > 0; 
    };
    const handleSignUpWithEmail = async () => {
      if (!isFormValid()) {
          Alert.alert("Invalid input", "Check email format and password requirements");
          return;
      }
      if (await checkEmailExists(email)) {
        Alert.alert("Erreur", "Email déjà utilisé");
        return;
      }
      try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const userId = userCredential.user.uid;
      
          console.log("User created in Firebase Auth:", userId);
      
          // Correct Firestore Reference
          const userRef = doc(db, "users", userId); 
          await setDoc(userRef, { 
            email,
            uid: userId,
            createdAt: new Date(),
          });
      
          console.log("User added to Firestore:", userId);
          navigation.navigate('NameScreen', { userType, uid: userId });


      
        } catch (error) {
          console.error("Signup Error:", error);
          Alert.alert("Erreur", error.message);
        }
  };
  
    //google sign up
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: '770007658347-fk52e7fhtq0bmep921sajvlosvh5kgep.apps.googleusercontent.com',
        iosClientId: '1017733460133-v0vo1cluujf0nc6lk5nl20oe8h8m4v86.apps.googleusercontent.com',
        androidClientId: '1017733460133-epv1rf173vhrnbnluc0sruffedra97bt.apps.googleusercontent.com'
    });
    useEffect(() => {
      if (response?.type === 'success' && response.authentication) {
        const { idToken } = response.authentication;
        const credential = GoogleAuthProvider.credential(idToken);
    
        signInWithCredential(auth, credential)
          .then(async (userCredential) => {
            console.log("Google Sign Up Success:", userCredential.user.uid);
            const uid = userCredential.user.uid; 
    
            await setDoc(doc(db, "users", uid), {
              email: userCredential.user.email,
              uid: uid,
              createdAt: new Date(),
            });
    
            navigation.navigate('NameScreen', { userType, uid }); 
    
          })
          .catch(error => console.error("Google SignUp Error:", error));
      }
    }, [response]);
    
    //facebook sign up 
    const handleFacebookLogin = async () => {
      try {
        const result = await Facebook.logInWithReadPermissionsAsync({
          permissions: ['public_profile', 'email'],
        });
    
        if (result.type === 'success') {
          const credential = FacebookAuthProvider.credential(result.token);
          const userCredential = await signInWithCredential(auth, credential);
          console.log("Facebook Sign Up Success:", userCredential.user.uid);
          const uid = userCredential.user.uid;
          const idToken = result.token;  // Facebook token
    
          // Save user in Firestore
          await setDoc(doc(db, "users", uid), {
            email: userCredential.user.email,
            uid: uid,
            createdAt: new Date(),
          });
    
          // Authenticate with backend
          await authenticateWithBackend(idToken, uid);
    
        } else {
          console.log("Facebook Login Cancelled");
        }
      } catch (error) {
        console.error("Facebook Login Error:", error);
        Alert.alert("Facebook Login Error", error.message);
      }
    };
  return (
    <View style= {styles.container}>
      <View>
         <TouchableOpacity onPress={() => navigation.goBack() } style={[styles.backButton, {paddingTop: 5}]}>
           <Ionicons name="arrow-back" size={38}/>
         </TouchableOpacity>
      </View>
      <Image source={require('../assets/Images/leaf.png')} style= {styles.topLeaf}/>
      <Image source={require('../assets/Images/leaf.png')} style= {styles.bottomLeaf}/>
      <Text style={styles.SignUpText} >Your journey starts here {'\n'} Take the first step</Text>
      <Image source={require('../assets/Images/fruits.png')} style= {styles.fruit}/>
      <TextInput style={styles.input} placeholder='E-mail' keyboardType='email-address' autoCapitalize='none' value={email} onChangeText={setEmail}/>
      {emailError !== '' && <Text style={{ color: 'red' }}>{emailError}</Text>}
        <View style={styles.passwordContainer}>
           <TextInput style={styles.passwordInput} placeholder='Password' secureTextEntry = {!isPasswordVisible} value={password} onChangeText={setPassword}/>
           <TouchableOpacity onPress={()=> setIsPasswordVisble(!isPasswordVisible)}>
             <Icon name={isPasswordVisible ? 'eye' : 'eye-off'} size={20} style = {styles.eyeIcon}/>
           </TouchableOpacity>
           {passwordError !== '' && <Text style={{ color: 'red' }}>{passwordError}</Text>}
        </View>
        <View style={styles.passwordContainer}>
           <TextInput style={styles.passwordInput} placeholder='Confirm Password' secureTextEntry = {!isConfirmPasswordVisible} value={confirmPassword} onChangeText={setConfirmPassword}/>
           <TouchableOpacity onPress={()=> setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
             <Icon name={isConfirmPasswordVisible ? 'eye' : 'eye-off'} size={20} style = {styles.eyeIcon}/>
           </TouchableOpacity>
           
        </View>
        {serverError !== '' && <Text style={{ color: 'red' }}>{serverError}</Text>}
        <Divider style={styles.Divider}/>
        <View style={styles.signInContainer}>
          <TouchableOpacity  onPress={() => promptAsync()}>
            <Ionicons name='logo-google' size={34} />
          </TouchableOpacity>
          <TouchableOpacity  onPress={handleFacebookLogin}>
            <Ionicons name='logo-facebook' size={34} />
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
             <Button mode= 'contained' style={styles.button} labelStyle={styles.textButton} onPress={handleSignUpWithEmail}>Next</Button>
        </View> 
    </View>
  );
}
