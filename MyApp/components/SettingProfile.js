import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, FlatList, Alert} from 'react-native';
import styles from './Styles';
import {useState} from 'react';
import { Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingProfile() {
  const route = useRoute();
  const {uid} = route.params;
  const navigation = useNavigation();
  const [selected, setSelected] = useState(null);
  const handleOptions = (option) =>{
  setSelected(option)}
  const [customInput, setCustomInput] = useState('');
  const [isKg, setIsKg] = useState(true);
  const [selectedValue, setSelectedValue] = useState(35);
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const min = 35; 
  const max = 230; 
  const step = 0.1; 

const numbers = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => (min + i * step).toFixed(1)); 
const itemWidth = 25;
const handleNext = async () => {
  const API_URL = "http://192.168.145.232:3000/user/updateProfileDetails"; 

  const requestBody = {
    uid,
    gender: selected,
    age: age,  
    height: height,  
    weight: weight,  
    targetWeight: selectedValue,
    isKg: isKg
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Profile Updated:", data);
      navigation.navigate("MotivationalScreen", { uid });
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
      <Image source={require('../assets/Images/leaf.png')} style= {styles.topLeaf}/>
      <Image source={require('../assets/Images/leaf.png')} style= {styles.bottomLeaf}/>
      <View>
      <TouchableOpacity onPress={() => navigation.goBack() } style={[styles.backButton, {marginTop: 45}]}>
        <Ionicons name="arrow-back" size={38}/>
      </TouchableOpacity>
     </View>
      <ScrollView showsVerticalScrollIndicator={false} style={{width: '100%', marginVertical: 55}}>
      <Text style={[styles.primaryText, {marginVertical: 10}]}>Let's set up your profile</Text>
      <Text style={[styles.caloriesText, {padding: 10}]}>What is your gender?</Text>
      <View style={styles.genderContainer}> {['Male', 'Female', 'Other'].map((option) => (
        <TouchableOpacity key={option} style={[
          styles.genderButton,
          selected === option && styles.selected, 
        ]} onPress={()=>handleOptions(option)}>
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}
      
      </View>
      {selected==='Other' && (<TextInput style={[styles.input, styles.customGender]} placeholder='enter your gender' onChangeText={setCustomInput} value={customInput}/>)}
      <Text style={[styles.caloriesText, {padding: 10}]}>How old are you ?</Text>
      <TextInput style={[styles.input, styles.customGender]} placeholder='enter your age' keyboardType='numeric' value={age} onChangeText={setAge} />
      <Text style={[styles.caloriesText, {padding: 10}]}>What is your height ?</Text>
      <TextInput style={[styles.input, styles.customGender]} placeholder='enter your height' keyboardType='numeric' value={height} onChangeText={setHeight}/>
      <Text style={[styles.caloriesText, {padding: 10}]}>What is your weight ?</Text>
      <TextInput style={[styles.input, styles.customGender]} placeholder='enter your weight' keyboardType='numeric' value={weight} onChangeText={setWeight}/> 
      <Text style={[styles.caloriesText, {padding: 10}]}>What is your target weight ?</Text>
      <View style={styles.SwitchContainer}>
        <TouchableOpacity style={[styles.switchActiveButton, isKg && styles.selectedUnit]} onPress={()=>setIsKg(true)}>
          <Text style={styles.optionUnitText}>Kg</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.switchInactiveButton, !isKg && styles.selectedUnit]} onPress={()=>setIsKg(false)}>
          <Text style={styles.optionUnitText}>Lbs</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.rulerContainer}>
  <Text style={styles.selectedValue}>{selectedValue}</Text>

  <FlatList
    data={numbers}
    horizontal
    snapToAlignment="center"
    snapToInterval={itemWidth} 
    decelerationRate="fast"
    showsHorizontalScrollIndicator={false}
    keyExtractor={(item) => item.toString()}
    contentContainerStyle={{ paddingHorizontal: 150 }} 
    renderItem={({ item }) => (
      <View style={styles.rulerItem}>
        <Text style={styles.rulerText}>
          {Math.round(parseFloat(item) * 10) % 50 === 0 ? item : ""}
        </Text>
        <View style={[
          styles.line, 
          parseFloat(item) === selectedValue && styles.activeLine
        ]} />
      </View>
    )}
    onScroll={(event) => {
      let index = Math.round(event.nativeEvent.contentOffset.x / itemWidth);
      if (numbers[index]) {
        setSelectedValue(parseFloat(numbers[index]));
      }
    }}
  />

  {/* Ensure this is the only center indicator */}
  <View style={styles.centerIndicator} />
</View>
<View style={styles.buttonContainer}>
  <Button mode= 'contained' style={styles.button} labelStyle={styles.textButton} onPress={handleNext}>Next</Button>
</View>



    </ScrollView>
    </View>
  );
}
