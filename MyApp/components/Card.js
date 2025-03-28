import React from "react";
import { View, Text, StyleSheet, TextInput, Image, Dimensions, Alert, TouchableOpacity } from "react-native";
import styles, { pxToDp } from "./Styles";
import { Ionicons } from '@expo/vector-icons';
export default function Card(props) {
        return (
            <View style={styles.cardContainer}>
                <Image source={require('../assets/Images/burger.jpg')} style={styles.cardImage} />
                <Text style={styles.cardTitle}>Burger</Text>
                <Text style={styles.cardDescription}>Ready in: 20 min⏱️</Text>
                <Text style={styles.cardCalories}>425-450 kcal</Text>
                <Ionicons name="arrow-forward-circle" size={25} color="black" style= {styles.arrowRecipes} />
            </View>
        );
    }