import React from 'react';
import { View, Text, StyleSheet, TextInput, Image, Dimensions, Alert, TouchableOpacity } from 'react-native';
import styles, { pxToDp } from './Styles';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import {useState} from 'react';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig'; 
export default function NameScreen() {
  const route = useRoute ();
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const { userType, uid } = route.params;
  const handleNext = async () => {
      if (!name.trim() || !lastName.trim()) {
        Alert.alert('Error', 'Please enter both first and last names.');
        return;
      }
    
      if (userType === "Professional") {
        navigation.navigate("NutritionForm", { 
          userName: name.trim(), 
          lastName: lastName.trim(), 
          userType 
        });
        return;
      }
    
      try {
        const idToken = await auth.currentUser.getIdToken(true);
        const API_URL = "http://10.0.2.2:3000/user/updateProfile"; 
        
        const requestBody = {
          uid, 
          firstName: name.trim(),
          lastName: lastName.trim(),
          userType
        };
    
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
          body: JSON.stringify(requestBody),
        });
    
        const data = await response.json();
    
        if (response.ok) {
          console.log("Profile Updated:", data);
          navigation.navigate("GoalScreen", { userName: name.trim(), uid }); 
        } else {
          Alert.alert("Error", data.error || "Failed to update profile");
        }
      } catch (error) {
        console.error("Error:", error);
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    };
    

  return (
    <View style={styles.container}>
     
         <TouchableOpacity onPress={() => navigation.goBack() } style={styles.backButton}>
           <Ionicons name="arrow-back" size={38}/>
         </TouchableOpacity>
      
      <Image source={require('../assets/Images/leaf.png')} style= {styles.topLeaf}/>
      <Image source={require('../assets/Images/leaf.png')} style= {styles.bottomLeaf}/>
      <Text style={styles.primaryText}>Welcome to {'\n'}BiteWise</Text>
      <View style= {styles.orangeContainer}>
          <Image style={styles.orange} source={require('../assets/Images/orangeExtraction.png')}/>
      </View>
      <Text style={styles.secondaryText}>What is your first name ?</Text>
      <TextInput style={styles.input} placeholder='First Name' keyboardType= 'default' autoCapitalize="words" value={name} onChangeText={setName} />
      <Text style={styles.secondaryText}>What is your last name ?</Text>
      <TextInput style={styles.input} placeholder='Last Name' keyboardType= 'default' autoCapitalize="words" value={lastName} onChangeText={setLastName}/>
        <View style={styles.buttonContainer}>
            <Button mode= 'contained' style={styles.button} labelStyle={styles.textButton} onPress={() => {
              handleNext(); 
             } }>Next</Button>
        </View>

    </View>
  );
}


