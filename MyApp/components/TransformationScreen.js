import React from 'react';
import { View, Text, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
  const navigation = useNavigation();
  const [selected, setSelected] = useState(null);
  const [visible, setVisible] = useState(false);
    const handleOptions = (option) =>{
      setSelected(option);
    } 
    const handleSelect = () =>{
     if (selected){
      setVisible(true);

      setTimeout(() => {
        setVisible(false);
      }, 3000);
      navigation.navigate('DietaryPreferences');
     }
    else{
      Alert.alert('Please select an option')
    }
  }

    
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
        <TouchableOpacity key={option} style={[
          styles.optionButton,
          selected === option && styles.selected, 
        ]} onPress={()=>handleOptions(option)}>
          <Text style={styles.optionTransformationText}>{option}</Text>
        </TouchableOpacity>
      ))}</View>
      <View style={styles.buttonContainer}>
            <Button mode= 'contained' style={styles.button} labelStyle={styles.textButton} onPress={() => {
              handleSelect(); 
             } }>Next</Button>
      </View>
      <BottomPopup visible={visible}/>
    </View>
  );
}
