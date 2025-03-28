import React from "react";
import { View, Text, TouchableOpacity, Image, Dimensions } from "react-native";
import styles from "./Styles";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Header from "./Header";
import TabNavigation from "./TabNavigation";
import { useState } from "react";
export default function MessagesGuidance (){
    const [rating, setRating] = useState(0);
    const navigation = useNavigation();
  const renderStars = () => {
    let stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity 
          key={i} 
          onPress={() => setRating(i)}
        >
          <Ionicons 
            name={i <= rating ? 'star' : 'star-outline'} 
            size={30} 
            color={i <= rating ? '#2E4A32' : '#2E4A32'} 
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };
    return(
      <View style={styles.mainContainer}>
         <Header subtitle ={"Messages & Guidance"}/>
         <TabNavigation/>
         <Image source={require('../assets/Images/potato.png')} style={[styles.smallPear, {alignSelf: 'center'}]}/>
    <View style={styles.messageContainer}>
    <TouchableOpacity  style={styles.buttons}>
      <Text style={styles.addText}>Ask for a nutrition plan</Text>
    </TouchableOpacity>
    <TouchableOpacity  style={styles.buttons} onPress={() => navigation.navigate('ProfessionalChat')}>
      <Text style={styles.addText}>Chat with your nutritionist</Text>
    </TouchableOpacity>
    <TouchableOpacity  style={styles.buttons}>
      <Text style={styles.addText}>Decline</Text>
    </TouchableOpacity>
    <TouchableOpacity  style={styles.buttons}>
      <Text style={styles.addText}>Block</Text>
    </TouchableOpacity>
    </View>    
    <Text style={styles.RatingEntry}>Rating entry</Text>
  
    <TouchableOpacity style = {[styles.cardRating,{marginBottom: 30, marginHorizontal: 20}]}>
        {renderStars()}
    </TouchableOpacity>
   
      </View>
    );
}