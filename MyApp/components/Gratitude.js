import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import styles from './Styles';
import { useNavigation } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
export default function Gratitude() {
    const navigation = useNavigation();
  return (
    <View style= {styles.container} backgroundColor= '#FCCF94'>
      
         <TouchableOpacity onPress={() => navigation.goBack() } style={[styles.backButton, {marginTop: 5}]} >
             <Ionicons name="arrow-back" size={38}/>
         </TouchableOpacity>
      
        <Image source={require('../assets/Images/leaf.png')} style= {styles.topLeaf}/>
        <Image source={require('../assets/Images/leaf.png')} style= {styles.bottomLeaf}/>
      <Text style={styles.transformationText}>We're grateful to have you on board!</Text>
      <Text style={styles.GratitudeSubText}>your data stays safe with us -always private, always secure.</Text>
      <Image source={require('../assets/Images/lock.png')} style= {styles.smallPear}/>
      <View style={styles.buttonContainer}>
            <Button mode= 'contained' style={styles.button} labelStyle={styles.textButton} onPress={() => {
              navigation.navigate('Home'); 
             } }>Next</Button>
      </View>
    </View>
  );
}
