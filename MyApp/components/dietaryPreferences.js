import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Alert, TextInput} from 'react-native';
import styles from './Styles';
import { useState} from 'react';
import { Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig'; 
import { AuthContext } from '../components/AuthContext';
import { useContext } from 'react';
export default function DietaryPreferences() {
  const { user } = useContext(AuthContext);
    const uid = user?.uid;
  const navigation = useNavigation();
  const route = useRoute();
  

  const [selectedOptions, setSelectedOptions] = useState([]);
  const [customDiet, setCustomDiet] = useState(''); 
  const [isOtherSelected, setIsOtherSelected] = useState(false); 

  const handleOptions = (option) => {
    if (option === "Other ✏️") {
      setIsOtherSelected((prev) => !prev); 
      if (!isOtherSelected) {
        setSelectedOptions([...selectedOptions, option]);
      } else {
        setSelectedOptions(selectedOptions.filter((item) => item !== "Other ✏️")); 
        setCustomDiet(""); 
      }
    } else {
      setSelectedOptions((prevSelected) =>
        prevSelected.includes(option)
          ? prevSelected.filter((item) => item !== option)
          : [...prevSelected, option]
      );
    }
  };
  const handleSelect = async () => {
    if (selectedOptions.length === 0 && !customDiet.trim()) {
      Alert.alert("Please select at least one option");
      return;
    }
  
    const finalSelection = isOtherSelected && customDiet.trim() !== ""
      ? [...selectedOptions.filter(item => item !== "Other ✏️"), customDiet.trim()]
      : selectedOptions;
  
    const API_URL = "http://10.0.2.2:3000/user/updateDietaryPreferences";
    const requestBody = { uid, dietaryPreferences: finalSelection };
  
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify(requestBody),
      });
  
      const data = await response.json();
      if (response.ok) {
        console.log("Dietary Preferences Updated:", data);
        navigation.navigate("ActivityLevel", { uid });
      } else {
        Alert.alert("Error", data.error || "Failed to update dietary preferences");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };
  

  return (
    <View style= {styles.container}>
 
      <TouchableOpacity onPress={() => navigation.goBack() } style={[styles.backButton, {marginTop: 50}]}>
        <Ionicons name="arrow-back" size={38}/>
      </TouchableOpacity>
   
      <Image source={require('../assets/Images/leaf.png')} style= {styles.topLeaf}/>
      <Image source={require('../assets/Images/leaf.png')} style= {styles.bottomLeaf}/>
      <Text style={styles.dietaryText}>Do you have any dietary prefernces or resrictions ? </Text>
      <ScrollView showsVerticalScrollIndicator={false} style={{ width: "100%", marginVertical: 45 }}>
  <View style={styles.optionsContainer}>
    {[
      "Vegan 🌱",
      "Vegetarian 🥕",
      "Pescatarian 🐟",
      "Gluten-Free 🌾",
      "Lactose Intolerant 🥛",
      "Low-Sodium Diet 🧂",
      "Seafood or Shellfish Allergy 🦐",
      "Diabetic-Friendly Diet 🍬",
      "No Restrictions ✅",
      "Other ✏️",
    ].map((option) => (
      <TouchableOpacity
        key={option}
        style={[
          styles.optionButton,
          selectedOptions.includes(option) && styles.selected,
        ]}
        onPress={() => handleOptions(option)}
      >
        <Text style={styles.optionText}>{option}</Text>
      </TouchableOpacity>
    ))}

 
    {isOtherSelected && (
      <TextInput
        style={[styles.optionButton, styles.optionText]}
        placeholder="Enter your dietary preference"
        value={customDiet}
        onChangeText={setCustomDiet}
      />
    )}

    <View style={styles.buttonContainer}>
      <Button
        mode="contained"
        style={styles.button}
        labelStyle={styles.textButton}
        onPress={handleSelect}
      >
        Next
      </Button>
    </View>
  </View>
</ScrollView>
    </View>
  );
}
