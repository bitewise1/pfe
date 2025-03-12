import React from 'react';
import { View, Text, StyleSheet, TextInput, Image, Dimensions, Alert, TouchableOpacity } from 'react-native';
import styles, { pxToDp } from './Styles';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import {useState} from 'react';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
export default function NameScreen() {
  const route = useRoute ();
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const {userType} = route.params;
  const handleNext = () =>{
    if (name.trim() && userType === 'Personal'){
      navigation.navigate('goalScreen', {userName: name.trim()}); 
    } else if (name.trim() && userType === 'Professional'){
      navigation.navigate('NutritionForm', {userName: name.trim()}); }
    else {
      Alert.alert('Please enter your name');
      
    }
      
  }
  return (
    <View style={styles.container}>
      <View>
         <TouchableOpacity onPress={() => navigation.goBack() } style={styles.backButton}>
           <Ionicons name="arrow-back" size={38}/>
         </TouchableOpacity>
      </View>
      <Image source={require('../assets/Images/leaf.png')} style= {styles.topLeaf}/>
      <Image source={require('../assets/Images/leaf.png')} style= {styles.bottomLeaf}/>
      <Text style={styles.primaryText}>Welcome to {'\n'}BiteWise</Text>
      <View style= {styles.orangeContainer}>
          <Image style={styles.orange} source={require('../assets/Images/orangeExtraction.png')}/>
      </View>
      <Text style={styles.secondaryText}>What is your first name ?</Text>
      <TextInput style={styles.input} placeholder='First Name' keyboardType= 'name-phone-pad' autoCapitalize="words" onChangeText={(text) => setName(text)}
 />
      <Text style={styles.secondaryText}>What is your last name ?</Text>
      <TextInput style={styles.input} placeholder='Last Name' keyboardType= 'name-phone-pad' autoCapitalize="words"
      />
        <View style={styles.buttonContainer}>
            <Button mode= 'contained' style={styles.button} labelStyle={styles.textButton} onPress={() => {
              handleNext(); //save the state 
             } }>Next</Button>
        </View>

    </View>
  );
}


