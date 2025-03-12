import React, {useEffect} from 'react';
import { View, Text, Image, TouchableOpacity, TextInput } from 'react-native';
import styles from './Styles';
import {Button, Divider} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-facebook'
export default function SignUp() {
    const route = useRoute ();
    const {userType} = route.params;
    const navigation = useNavigation();    
    const [password, setPassword] = useState ('');
    const [isPasswordVisible, setIsPasswordVisble] = useState (false);
    //google sign in 
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: '1017733460133-9vb26o17igm227eko3bur0ub6285bsg3.apps.googleusercontent.com',
        iosClientId: '1017733460133-v0vo1cluujf0nc6lk5nl20oe8h8m4v86.apps.googleusercontent.com',
        androidClientId: '1017733460133-epv1rf173vhrnbnluc0sruffedra97bt.apps.googleusercontent.com'
    });
    useEffect(() => {
      if (response?.type === 'success'){
        const {authentication} = response;
        console.log('google Auth Success, token:', authentication.accessToken);
      }
    }, [response]
    );
    
    //facebook sign in 
    useEffect(() => {
      // Initialise en utilisant les valeurs de app.json
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
      <TextInput style={styles.input} placeholder='E-mail' keyboardType='email-address' autoCapitalize='none'/>
        <View style={styles.passwordContainer}>
           <TextInput style={styles.passwordInput} placeholder='Password' secureTextEntry = {!isPasswordVisible} onChangeText={setPassword}/>
           <TouchableOpacity onPress={()=> setIsPasswordVisble(!isPasswordVisible)}>
             <Icon name={isPasswordVisible ? 'eye' : 'eye-off'} size={20} style = {styles.eyeIcon}/>
           </TouchableOpacity>
           
        </View>
        <View style={styles.passwordContainer}>
           <TextInput style={styles.passwordInput} placeholder='Confirm Password' secureTextEntry = {!isPasswordVisible} onChangeText={setPassword}/>
           <TouchableOpacity onPress={()=> setIsPasswordVisble(!isPasswordVisible)}>
             <Icon name={isPasswordVisible ? 'eye' : 'eye-off'} size={20} style = {styles.eyeIcon}/>
           </TouchableOpacity>
           
        </View>
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
             <Button mode= 'contained' style={styles.button} labelStyle={styles.textButton} onPress={()=>{navigation.navigate('NameScreen', {userType})}}>Next</Button>
        </View> 
    </View>
  );
}
