import {View, TouchableOpacity, Image} from 'react-native';
import React from 'react';
import styles from './Styles';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
export default function TabNavigation() {
    const navigation = useNavigation();
    return(
    <View style={styles.tabNavigation}>
       <TouchableOpacity onPress={() => navigation.navigate('Home')} >
           <Ionicons name="home-outline" size={28} color="black" />
       </TouchableOpacity>
         <TouchableOpacity onPress={() => navigation.navigate('Recipes')} >
              <Ionicons name="restaurant-outline" size={28} color="black" />
        </TouchableOpacity>
         <TouchableOpacity onPress={() => navigation.navigate('Profile')} >
              <Ionicons name="person-outline" size={28} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('NutritionSection')} >
              <Ionicons name="chatbubble-ellipses-outline" size={28} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Chatbot')} >
        <Image source={require('../assets/Images/bot.png')} style={styles.bot}/>
        </TouchableOpacity>
    </View>);
}