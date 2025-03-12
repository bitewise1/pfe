import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import styles from './Styles';
import { useState} from 'react';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
export default function ActivityLevel() {
const navigation = useNavigation();
  const [selected, setSelected] = useState(null);
  const handleOptions = (option) =>{
    setSelected(option);
  } 
  const handleSelect = () =>{
   if (selected){
    navigation.navigate('Gratitude');
   }
   
  }
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
