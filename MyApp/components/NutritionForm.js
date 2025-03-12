import React, {useRef} from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, ScrollView} from 'react-native';
import styles from './Styles';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useState} from 'react';
import { Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker  from 'expo-image-picker'
import PhoneInput, { isValidNumber } from 'react-native-phone-number-input';
import { Quicksand_700Bold } from '@expo-google-fonts/quicksand';

export default function NutritionForm() {
  // pick an image 
  const [image, setImage] = useState(null);
  const pickImage = async () =>{
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted'){
      Alert.alert('Permission required')
      return;}
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,});

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    };

  }
  
  // phone input
  const ref = useRef(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const phoneInput = React.useRef(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { userName } = route.params || {userName: ''};
  const [password, setPassword] = useState ('');
  const [isPasswordVisible, setIsPasswordVisble] = useState (false);
  const handleConfirm = () =>{
    const checkValid = phoneInput.current?.isValidNumber(phoneNumber);
    if (checkValid){
      const formattedNumber = phoneInput.current?.getNumberAfterPossiblyEliminatingZero();
      console.log('Full number:', formattedNumber.formattedNumber);

    }
    else{
      console.warn('Invalid phone number');
    }
  }

  return (
    <View style= {styles.container}>
      <View>
      <TouchableOpacity onPress={() => navigation.goBack() } style={[styles.backButton, {marginTop: 45}]}>
        <Ionicons name="arrow-back" size={38}/>
      </TouchableOpacity>
     </View>
      <Image source={require('../assets/Images/leaf.png')} style= {styles.topLeaf}/>
      <Image source={require('../assets/Images/leaf.png')} style= {styles.bottomLeaf}/>
      <ScrollView showsVerticalScrollIndicator={false} style={{width: '100%', marginVertical: 55}} >
      <Text style={styles.helloText}>Hello, {userName}</Text>
      <Text style={styles.secondaryText}>Create your professional account </Text>
      <Text style={[styles.caloriesText, {padding: 10}]}>E-mail address</Text>
      <TextInput style={styles.input} placeholder='E-mail' keyboardType='email-address' autoCapitalize='none'/>
      <Text style={[styles.caloriesText, {padding: 10}]}>Password</Text>
      <View style={styles.passwordContainer}>
          <TextInput style={styles.passwordInput} placeholder='Password' secureTextEntry = {!isPasswordVisible} onChangeText={setPassword}/>
          <TouchableOpacity onPress={()=> setIsPasswordVisble(!isPasswordVisible)}>
              <Icon name={isPasswordVisible ? 'eye' : 'eye-off'} size={20} style = {styles.eyeIcon}/>
          </TouchableOpacity>
      </View>
      <Text style={[styles.caloriesText, {padding: 10}]}>Confirm Password</Text>
      <View style={styles.passwordContainer}>
          <TextInput style={styles.passwordInput} placeholder='Confirm Password' secureTextEntry = {!isPasswordVisible} onChangeText={setPassword}/>
          <TouchableOpacity onPress={()=> setIsPasswordVisble(!isPasswordVisible)}>
              <Icon name={isPasswordVisible ? 'eye' : 'eye-off'} size={20} style = {styles.eyeIcon}/>
          </TouchableOpacity>
      </View>
      <Text style={[styles.caloriesText, {padding: 10}]}>Phone number</Text>
      <PhoneInput 
      myRef={phoneNumber}
      defaultCode='TN'
      layout='first'
      onChangeFormattedText={text => setPhoneNumber(text)}
      containerStyle= {styles.input}
      textContainerStyle={styles.TextInput}/>
      <Text style={[styles.caloriesText, {padding: 10}] } >Years of Experience</Text>
      <TextInput style={styles.input} placeholder='enter a number' keyboardType='numeric' />
      <Text style={[styles.caloriesText, {padding: 10}] } >Specialization</Text>
      <TextInput style={styles.input} placeholder='Specialization'  />
      <Text style={[styles.caloriesText, {padding: 10}] } >Workplace</Text>
      <TextInput style={styles.input} placeholder='Workplace'  /> 

      <Text style={[styles.caloriesText, {padding: 10}] } >Short Bio </Text>
      <TextInput style={styles.bioInput}   /> 
          <TouchableOpacity onPress={pickImage} style={{flexDirection: 'row', justifyContent: 'space-between',  backgroundColor:'#FCCF94', borderRadius: 20, paddingVertical: 8, marginVertical: 10, paddingHorizontal: 8}}>
          <Text style={styles.caloriesSubText}>Upload your Professional {'\n'}Certificate Here</Text>
              <Ionicons name='download-outline' size={35} />
          </TouchableOpacity>
        {image && <Image source={{ uri: image }} />}
       <TouchableOpacity onPress={pickImage} style={{flexDirection: 'row', justifyContent: 'space-between',  backgroundColor:'#FCCF94', borderRadius: 20, paddingVertical: 8, marginVertical: 10,paddingHorizontal: 8 }}>
          <Text style={styles.caloriesSubText}>Upload your Profile {'\n'} Image Here</Text>
              <Ionicons name='download-outline' size={35} />
        </TouchableOpacity>
        {image && <Image source={{ uri: image }} />}
        <TouchableOpacity  onPress={()=> navigation.navigate('Gratitude')}style={{backgroundColor:'#2E4A32', alignItems: 'center', borderRadius: 20, paddingVertical: 13, marginTop: 10, marginBottom: 30  }}>
          <Text style={styles.textButton}>Create your account</Text>
        </TouchableOpacity>
        
    
      </ScrollView>
    </View>
  );
}
