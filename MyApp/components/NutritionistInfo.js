import React from "react";
import { View, Text, TouchableOpacity, Image, Dimensions } from "react-native";
import styles from "./Styles";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { Divider } from "react-native-paper";
export default function NutritionistInfo (){
    const navigation = useNavigation();
    const route = useRoute();
    const {firstName, lastName, workplace, yearsOfExperience, shortBio, specialization, profileImage} = route.params;
return(
   <View style={[styles.mainContainer, {backgroundColor:'#88A76C'}]}>
     <View style={styles.header}>
        <View style={styles.topRow}>
        <Image
            source={require("../assets/Images/logo.png") } style={styles.headerLogo}
        />
        <Text style={styles.appName}>Bite wise</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} >
            <Ionicons name="notifications-outline" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} >
            <Ionicons name="settings-outline" size={24} color="black" />
        </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack() }>
             <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        </View>
        <Image source={{uri: profileImage}} 
        style={{
            width: 190, 
            height: 190, 
            borderRadius: 95, 
            alignSelf: 'center', 
            zIndex: 100, 
            position: 'absolute', 
            top: 110,
            alignSelf: 'center'}}/>
     <View style={{
                backgroundColor: '#F5E4C3', 
                width: Dimensions.get('window').width, 
                height: '60%', 
                borderTopLeftRadius: 50, 
                borderTopRightRadius: 50, 
                paddingTop: 20, 
                paddingHorizontal: 20,
                position : 'absolute',
                bottom: 0
            }}>
        <Text style={styles.nutritionistName}>Dr.{firstName} {lastName}</Text>
        <Text style={styles.nutritionistSpecialization}>{specialization}</Text>
        <Text style={styles.nutritionistWorkplace}>📍{workplace} | {yearsOfExperience} years of experience</Text>
        <Divider style={[styles.Divider,{width: Dimensions.get('window').width * 0.9    }]}/>
        <Text style={styles.nutritionistName}>About</Text>
        <Text style={styles.nutritionistSpecialization}>{shortBio}</Text>
        <Image source={require('../assets/Images/orangeExtraction.png')} style={styles.littleOrange}/>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MessagesGuidance')}>
            <Text style={styles.textButton}>Add this Doctor</Text>
           </TouchableOpacity>
        </View>
    </View>
        
    
  </View>
);}