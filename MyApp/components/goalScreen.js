import React from 'react';
import { View, Text, Image, Alert, TouchableOpacity } from 'react-native';
import styles from './Styles';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useState} from 'react';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
export default function goalScreen() {
  const route = useRoute();
  const { userName } = route.params || {userName: ''};
  const navigation = useNavigation();
  const [selected, setSelected] = useState(null);
  const handleOptions = (option) =>{
    setSelected(option);
  } 
  const handleSelect = () =>{
   if (selected){
    navigation.navigate('SettingProfile', { goal: selected });
   }
   else{
    Alert.alert('Please select an option !')
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
      <Image source={require('../assets/Images/banana.png')} style = {styles.banana}/>
      <Text style={styles.helloText}>Hello, {userName} !</Text>
      <Text style={[styles.caloriesText, {padding: 20}]}>what's your main goal?</Text>
      <View style={styles.optionsContainer}> {['Losing Weight', 'Maintaining Weight', 'Gaining Weight'].map((option) => (
        <TouchableOpacity key={option} style={[
          styles.optionButton,
          selected === option && styles.selected, 
        ]} onPress={()=>handleOptions(option)}>
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}
      <View style={styles.buttonContainer}>
            <Button mode= 'contained' style={styles.button} labelStyle={styles.textButton} onPress={() => {
              handleSelect(); 
             } }>Next</Button>
      </View>
        
     </View>
    </View>
  );
}
