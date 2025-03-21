import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import styles from './Styles';
import { useState} from 'react';
import { Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig'; 
export default function ActivityLevel() {
  const navigation = useNavigation();
  const route = useRoute();
  const { uid } = route.params || {};  

  const [selected, setSelected] = useState(null);

  const handleOptions = (option) => {
    setSelected(option);
  };

  const handleSelect = async () => {
    if (!selected) {
      Alert.alert("Please select an activity level!");
      return;
    }

    const API_URL = "http://10.0.2.2:3000/user/updateActivityLevel";

    const requestBody = {
      uid,
      activityLevel: selected,
    };

    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Activity Level Updated:", data);
        navigation.navigate("Gratitude", { uid });
      } else {
        Alert.alert("Error", data.error || "Failed to update activity level");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };
  return (
    <View style= {styles.container}>
      <View>
      <TouchableOpacity onPress={() => navigation.goBack() } style={styles.backButton}>
        <Ionicons name="arrow-back" size={38}/>
      </TouchableOpacity>
     </View>
      <Image source={require('../assets/Images/leaf.png')} style= {styles.topLeaf}/>
      <Image source={require('../assets/Images/leaf.png')} style= {styles.bottomLeaf}/>
      <Text style={styles.dietaryText}>How active are you in  your daily life ? </Text>

        <View style={styles.optionsContainer}> {['Mostly Sitting 🪑', ' Lightly Active 🚶', 'Active Lifestyle 🚴', 'Highly Active 💪'].map((option) => (
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
