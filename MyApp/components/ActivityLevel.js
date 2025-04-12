import React from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import styles from './Styles';
import { useState, useContext } from 'react'; 
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig'; 

import { AuthContext } from '../components/AuthContext'; 
import axios from 'axios'; 

export default function ActivityLevel() {
    const navigation = useNavigation();
    
    const { user } = useContext(AuthContext);
    const uid = user?.uid;

    const [selected, setSelected] = useState(null);

    const activityOptions = [
        "Mostly Sitting 🪑",
        "Lightly Active 🚶", 
        "Active Lifestyle 🚴",
        "Highly Active 💪"
    ];

    const handleOptions = (option) => {
        setSelected(option);
    };

    const handleSelect = async () => {
       
        if (!uid) {
             Alert.alert("Error", "User session not found. Please log out and log back in.");
             return;
        }

        if (!selected) {
            Alert.alert("Selection Needed", "Please select an activity level!"); 
            return;
        }

        const API_BASE_URL = 'http://10.0.2.2:3000';
        const API_URL = `${API_BASE_URL}/user/updateActivityLevel`; 

        const requestBody = {
            uid, // UID from context
            activityLevel: selected, 
        };
        console.log("Sending activity level update:", requestBody);

        try {
            
            const response = await axios.post(API_URL, requestBody, {
                
             });

            console.log("Activity Level Updated Response:", response.data);
           
            navigation.navigate("EstimationScreen", { uid });

        } catch (error) {
            console.error("Update Activity Level Error:", error.response ? JSON.stringify(error.response.data) : error.message);
            Alert.alert("Update Error", error.response?.data?.error || "Failed to update activity level. Please try again.");
        }
    };

    return (
       
        <View style={styles.container}>

          
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={38} />
            </TouchableOpacity>

       
            <Image source={require('../assets/Images/leaf.png')} style={styles.topLeaf} />
            <Image source={require('../assets/Images/leaf.png')} style={styles.bottomLeaf} />

            <Text style={styles.dietaryText}>How active are you in your daily life?</Text>

            <View style={styles.optionsContainer}>
                {activityOptions.map((option) => ( 
                    <TouchableOpacity
                        key={option}
                        style={[
                            styles.optionButton, 
                            selected === option && styles.selected, 
                        ]}
                        onPress={() => handleOptions(option)}
                    >
                       
                        <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                ))}

            
                <View style={styles.buttonContainer}>
                    <Button
                        mode='contained'
                        style={styles.button} 
                        labelStyle={styles.textButton} 
                        onPress={handleSelect} 
                    >
                        Next
                    </Button>
                </View>

            </View>

        </View>
    );
}