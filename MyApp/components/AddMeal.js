import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import Header from './Header';
import styles from './Styles';
import TabNavigation from './TabNavigation';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as ImagePicker  from 'expo-image-picker'
import { Camera } from 'expo-camera'; 
import { useRef } from 'react';
import { useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
export default function AddMeal() {
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [image, setImage] = useState(null);
  const { user } = useContext(AuthContext);
  const uid = user?.uid;
  
  //pick image from library
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
      };}
      // take a photo 
      useEffect(() => {
        (async () => {
          const { status } = await Camera.requestCameraPermissionsAsync();
          setHasPermission(status === 'granted');
        })();
      }, []);
      
      const takePicture = async () => {
        if (!hasPermission) {
          Alert.alert('Camera permission not granted');
          return;
        }
        if (cameraRef.current) {
          try {
            const photoData = await cameraRef.current.takePictureAsync({ base64: true });
            setPhoto(photoData.uri);
          } catch (error) {
            console.error('Error taking picture:', error);
          }
        }
      };
      
    
  return (
    <View style={styles.mainContainer}>
    <Header subtitle= "Add your meal!"/>
    <TabNavigation />
    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems:'center', elevation: 2}}>
    <TouchableOpacity  style={{backgroundColor: '#FCCF94', flex: 1,  alignItems: 'center', height: 60, justifyContent : 'center', elevation: 2}}>
      <Text style={styles.goalText}>Search</Text>
    </TouchableOpacity>
    <TouchableOpacity  style={{backgroundColor: '#FCCF94', flex: 1,  alignItems: 'center', height: 60, justifyContent : 'center' , elevation: 2, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#2e4a32'}}>
      <Text style={styles.goalText}>Analyze</Text>
    </TouchableOpacity>
    <TouchableOpacity style={{backgroundColor: '#FCCF94', flex: 1, alignItems: 'center', height: 60, justifyContent : 'center', elevation: 2}}>
      <Text style={styles.goalText}>Saved</Text>
    </TouchableOpacity>
    </View>
    <Image source={require('../assets/Images/potato.png')} style={styles.orange}/>
    <View style={styles.buttonContainer}>
    <TouchableOpacity onPress={pickImage} style={styles.analyzeButton}>
      <Text style={styles.addText}>Import from Gallery</Text>
        <Ionicons name='image-outline' size={35} />
    </TouchableOpacity>
    {image && <Image source={{ uri: image }} />}
    <TouchableOpacity onPress={pickImage} style={styles.analyzeButton}>
      <Text style={styles.addText}>Snap a new photo</Text>
        <Ionicons name='camera-outline' size={35} />
    </TouchableOpacity>
    <TouchableOpacity onPress={pickImage} style={styles.analyzeButton}>
      <Text style={styles.addText}>Barcode scan</Text>
        <Ionicons name='barcode-outline' size={35} />
    </TouchableOpacity>
    </View>    
        
   
    </View>
)}
