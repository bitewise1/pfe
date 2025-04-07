import React from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
// Use styles from './Styles.js'
import styles from './Styles';
import { useState, useContext } from 'react'; // Added useContext
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native'; // Removed useRoute
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig'; // For getting idToken
// *** Import AuthContext ***
import { AuthContext } from '../components/AuthContext'; // Adjust path if needed
import axios from 'axios'; // Use axios for consistency

export default function ActivityLevel() {
    const navigation = useNavigation();
    // *** Use AuthContext to get user and uid ***
    const { user } = useContext(AuthContext);
    const uid = user?.uid; // Get uid from context

    const [selected, setSelected] = useState(null); // State for the chosen activity level

    // *** Ensure options array EXACTLY matches backend validation strings ***
    const activityOptions = [
        "Mostly Sitting 🪑",
        "Lightly Active 🚶", // Removed leading space
        "Active Lifestyle 🚴",
        "Highly Active 💪"
    ];

    const handleOptions = (option) => {
        setSelected(option);
    };

    const handleSelect = async () => {
        // *** Add UID Check ***
        if (!uid) {
             Alert.alert("Error", "User session not found. Please log out and log back in.");
             return;
        }

        if (!selected) {
            Alert.alert("Selection Needed", "Please select an activity level!"); // Changed Alert title
            return;
        }

        // Use consistent base URL and path construction (NO /api prefix)
        const API_BASE_URL = 'http://10.0.2.2:3000';
        const API_URL = `${API_BASE_URL}/user/updateActivityLevel`; // Matches backend route

        const requestBody = {
            uid, // UID from context
            activityLevel: selected, // The selected option string
        };
        console.log("Sending activity level update:", requestBody);

        try {
            // Get token if needed for backend auth verification
            // const idToken = auth.currentUser ? await auth.currentUser.getIdToken(true) : null;
            // if (!idToken) { Alert.alert("Auth Error", "Please log in again."); return; }

            // Use axios
            const response = await axios.post(API_URL, requestBody, {
                 // Add headers if needed, e.g., Authorization
                 // headers: { Authorization: `Bearer ${idToken}` }
             });

            console.log("Activity Level Updated Response:", response.data);
            // Navigate to the next screen, passing uid if necessary
            navigation.navigate("EstimationScreen", { uid });

        } catch (error) {
            console.error("Update Activity Level Error:", error.response ? JSON.stringify(error.response.data) : error.message);
            Alert.alert("Update Error", error.response?.data?.error || "Failed to update activity level. Please try again.");
        }
    };

    return (
        // Use styles from './Styles.js'
        <View style={styles.container}>

            {/* Back Button */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={38} />
            </TouchableOpacity>

            {/* Decorative Images */}
            <Image source={require('../assets/Images/leaf.png')} style={styles.topLeaf} />
            <Image source={require('../assets/Images/leaf.png')} style={styles.bottomLeaf} />

            {/* Title Text */}
            <Text style={styles.dietaryText}>How active are you in your daily life?</Text>

            {/* Options Container */}
            <View style={styles.optionsContainer}>
                {activityOptions.map((option) => ( // Map over the corrected array
                    <TouchableOpacity
                        key={option}
                        style={[
                            styles.optionButton, // Your base button style
                            selected === option && styles.selected, // Your selected style
                        ]}
                        onPress={() => handleOptions(option)}
                    >
                        {/* Your text style */}
                        <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                ))}

                {/* Button Container */}
                <View style={styles.buttonContainer}>
                    <Button
                        mode='contained'
                        style={styles.button} // Your button style
                        labelStyle={styles.textButton} // Your label style
                        onPress={handleSelect} // Call the async handler directly
                    >
                        Next
                    </Button>
                </View>

            </View>

        </View>
    );
}