import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import styles from './Styles';
import {Button} from 'react-native-paper'; 
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
export default function MotivationalScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { uid } = route.params || {}; 

  return (
    <View style= {styles.container}>
     
        <TouchableOpacity onPress={() => navigation.goBack() } style={styles.backButton}>
           <Ionicons name="arrow-back" size={38}/>
        </TouchableOpacity>
      
      <Text style = {[styles.primaryText, styles.motivText]}> Your goal is within reach! You've got this!</Text>
      <Image source={require('../assets/Images/leaf.png')} style= {styles.topLeaf}/>
      <Image source={require('../assets/Images/leaf.png')} style= {styles.bottomLeaf}/>
      <Image source={require('../assets/Images/cuteApple.png')} style= {styles.cuteApple}/>
      <Text style = {[styles.secondaryText, styles.greenText]}>" Every choice you make brings you closer to your goal. Keep pushing!"</Text>
      <View style={styles.buttonContainer}>
          <Button mode= 'contained' style={styles.button} labelStyle={styles.textButton} onPress = {()=> navigation.navigate('TransformationScreen',{uid})}>Next</Button>
      </View>

    </View>
  );
}
