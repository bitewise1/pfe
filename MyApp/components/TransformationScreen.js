import React from 'react';
import { View, Text, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {Button} from 'react-native-paper';
import styles from './Styles';
import {useState} from 'react';
import {Ionicons} from '@expo/vector-icons';
const BottomPopup = ({visible}) =>{
  return (
    
     <Modal animationType ='slide' transparent={true} visible={visible} >
      <View style={styles.popupContainer}>
        <TouchableOpacity style={styles.popup}>
           <Image source={require('../assets/Images/Pear.png')} style= {styles.smallPear}/>
           <Text style={styles.mainText}>Your plan has been {'\n'}updated !</Text>
           <Text style= {styles.popupSubText}>We're setting everything up for you</Text>
        </TouchableOpacity>
      </View>
     </Modal> 
  )

}
export default function TransformationScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { uid } = route.params || {}; 
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null)
  const [selectedOptions, setSelectedOptions] = useState([]);

  const handleOptions = (option) => {
    setSelectedOptions((prevSelected) =>
      prevSelected.includes(option)
        ? prevSelected.filter((item) => item !== option) // Deselect
        : [...prevSelected, option] // Select
    );
  };

  const handleSelect = async () => {
    if (selectedOptions.length === 0) {
      Alert.alert("Please select at least one option");
      return;
    }

  setVisible(true);

 

  const API_URL = "http://192.168.145.232:3000/user/updateTransformation"; 

  const requestBody = {
    uid,
    transformationGoals: selectedOptions, // Send all selected goals
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Transformation Goals Updated:", data);

      // Wait for 2 seconds, then navigate
      setTimeout(() => {
        setVisible(false);
        navigation.navigate("DietaryPreferences", { uid });
      }, 2000);
    } else {
      setVisible(false);
      Alert.alert("Error", data.error || "Failed to update transformation goals");
    }
  } catch (error) {
    setVisible(false);
    console.error("Error:", error);
    Alert.alert("Error", "Something went wrong. Please try again.");
  }
};


    
  return (
    <View style = {styles.container}>
      <View>
         <TouchableOpacity onPress={() => navigation.goBack() } style={styles.backButton}>
           <Ionicons name="arrow-back" size={38}/>
         </TouchableOpacity>
     </View>
       <Image source={require('../assets/Images/leaf.png')} style= {styles.topLeaf}/>
       <Image source={require('../assets/Images/leaf.png')} style= {styles.bottomLeaf}/>
      <Text style={ styles.transformationText}>What's driving your transformation?</Text>
      <View style={styles.optionsTransformationContainer}> {['I want to feel more confident in my body', 'I want to improve my energy and overall health', 'I want to build strength and endurance', 'I want to develop better eating habits','I have a specific goal (event, sport, lifestyle change)'].map((option) => (
         <TouchableOpacity
         key={option}
         style={[
           styles.optionButton,
           selectedOptions.includes(option) && styles.selected,
         ]}
         onPress={() => handleOptions(option)}
       >
         <Text style={styles.optionTransformationText}>{option}</Text>
       </TouchableOpacity>
      ))}</View>
      <View style={styles.buttonContainer}>
            <Button mode= 'contained' style={styles.button} labelStyle={styles.textButton} onPress={() => {
              handleSelect(); 
             } }>Next</Button>
      </View>
      <BottomPopup visible={visible} onClose={() => setVisible(false)} />
    </View>
  );
}
