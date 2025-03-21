import React from 'react';
import { View, Text, Image, Alert, TouchableOpacity } from 'react-native';
import styles from './Styles';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useState} from 'react';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig'; 
export default function GoalScreen() {
  const route = useRoute();
  const { userName, uid } = route.params || {userName: ''};
  const navigation = useNavigation();
  const [selected, setSelected] = useState(null);
  const handleOptions = (option) =>{
    setSelected(option);
  } 
  const handleSelect = async () =>{
  const API_URL = "http://10.0.2.2:3000/user/updateGoal";
  const requestBody = {
    uid,
    goal: selected,
  };
  try {
    const idToken = await auth.currentUser.getIdToken(true);//refresh token
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Goal Updated:", data);
      navigation.navigate("SettingProfile", { goal: selected, uid });

    } else {
      Alert.alert("Error", data.error || "Failed to update goal");
    }
  } catch (error) {
    console.error("Error:", error);
    Alert.alert("Error", "Something went wrong. Please try again.");
  }
};
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
