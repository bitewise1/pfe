import React from "react";
import { View, Text, Image,  TouchableOpacity } from "react-native";
import styles from "./Styles";
import Ionicons from '@expo/vector-icons/Ionicons';
 export default function NutritionistCard({user}){
    return (
        <View style = {styles.cardNutritionistContainer}>
        <Image source = {{uri: user.profileImage}} style = {styles.cardNutritionistImage}/>
        <View style={{flexDirection: 'column'}}>
            <Text style = {styles.cardTitle}>Dr.{user.firstName} </Text>
            <Text style={styles.specializationText}>Specialization</Text>
            <Text style = {styles.cardDescription}>{user.specialization}</Text>
            <View style = {styles.cardRating}>
                <Ionicons name = 'star-outline' size = {20} />
                <Ionicons name = 'star-outline' size = {20} />
                <Ionicons name = 'star-outline' size = {20} />
                <Ionicons name = 'star-outline' size = {20} />
                <Ionicons name = 'star-outline' size = {20} />
            </View>
        </View>
        </View>
    )
 }