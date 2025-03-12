import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, FlatList} from 'react-native';
import styles from './Styles';
import {useState} from 'react';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingProfile() {
  const navigation = useNavigation();
  const [selected, setSelected] = useState(null);
  const handleOptions = (option) =>{
  setSelected(option)}
  const [customInput, setCustomInput] = useState('');
  const [isKg, setIsKg] = useState(true);
  const [selectedValue, setSelectedValue] = useState(0);
  const numbers = Array.from({length: 200}, (_, i) => i + 1);
  const min = 50; // Smallest number
  const max = 100; // Largest number
  const step = 1; // Count one by one
  const itemWidth = 20; // Space between lines

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
      <TextInput style={[styles.input, styles.customGender]} placeholder='enter your age' keyboardType='numeric' />
      <Text style={[styles.caloriesText, {padding: 10}]}>What is your height ?</Text>
      <TextInput style={[styles.input, styles.customGender]} placeholder='enter your height' keyboardType='numeric'/>
      <Text style={[styles.caloriesText, {padding: 10}]}>What is your weight ?</Text>
      <TextInput style={[styles.input, styles.customGender]} placeholder='enter your weight' keyboardType='numeric'/> 
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
    
    contentContainerStyle={{ paddingHorizontal: 150 }} //  Keeps the ruler centered
    renderItem={({ item }) => (
      <View style={styles.rulerItem}>
        {/*  Show numbers only every 5 steps */}
        <Text style={styles.rulerText}>{item % 5 === 0 ? item : ""}</Text>

        {/*  Tick mark (selected one is black) */}
        <View style={[styles.line, item === selectedValue && styles.activeLine]} />
      </View>
    )}
    
    onScroll={(event) => {
      let index = Math.round(event.nativeEvent.contentOffset.x / itemWidth);
      setSelectedValue(numbers[index] || selectedValue);
    }}
  />

  {/*  Black Center Line (Indicator) */}
  <View style={styles.centerIndicator} />
</View>
<View style={styles.buttonContainer}>
    <Button mode= 'contained' style={styles.button} labelStyle={styles.textButton} onPress={() => navigation.navigate('MotivationalScreen')}>Next</Button>
</View>
        

    </ScrollView>
    </View>
  );
}
