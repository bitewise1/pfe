import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, FlatList, Alert, Dimensions } from 'react-native';
// Use 'styles' from './Styles.js'
import styles from './Styles';
import { useState, useEffect, useRef, useCallback, useContext } from 'react'; // Added hooks
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native'; // Removed useRoute if UID is from context
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig'; // Assuming auth is correctly configured
// Import AuthContext
import { AuthContext } from '../components/AuthContext'; // Adjust path if needed
import axios from 'axios'; // Import axios

export default function SettingProfile() {
    // Use Context for UID
    const { user } = useContext(AuthContext);
    const uid = user?.uid;

    const navigation = useNavigation();

    // State for form inputs
    const [selectedGender, setSelectedGender] = useState(null);
    const [customInput, setCustomInput] = useState('');
    const [age, setAge] = useState('');
    const [weight, setWeight] = useState(''); // User's input CURRENT weight (KG)
    const [heightCm, setHeightCm] = useState(''); // User's input height in CM

    // *** CORRECTED State for TARGET weight ruler (KG) ***
    const [targetWeightValue, setTargetWeightValue] = useState('70.0'); // Default target KG

    // Ruler Configuration
    const screenWidth = Dimensions.get('window').width;
    const itemWidth = 20; // Or your preferred value
    const min = 35;
    const max = 230;
    const step = 0.1; // Use 'step' consistently
    const numbers = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => (min + i * step).toFixed(1));
    const rulerListRef = useRef(null);

    // --- Handlers ---
    const handleOptions = (option) => { setSelectedGender(option); };

    const handleRulerScroll = useCallback((event) => {
        const centerOffset = event.nativeEvent.contentOffset.x;
        let index = Math.round(centerOffset / itemWidth);
        index = Math.max(0, Math.min(index, numbers.length - 1));
        if (numbers[index]) { setTargetWeightValue(numbers[index]); }
    }, [itemWidth, numbers]);

    const calculateInitialIndex = () => {
        const initialTarget = parseFloat(targetWeightValue) || 70.0;
        const index = numbers.findIndex(num => Math.abs(parseFloat(num) - initialTarget) < step / 2);
        return index >= 0 ? index : Math.round(numbers.length / 2);
    };

    // Handle form submission
    const handleNext = async () => {
        // Validation
        if (!uid) { Alert.alert("Error", "User session not found."); return; }
        if (!selectedGender || (selectedGender === 'Other' && !customInput)) { Alert.alert("Info", "Please select or enter your gender."); return; }
        if (!age || isNaN(parseInt(age)) || parseInt(age) <= 0 || parseInt(age) > 120) { Alert.alert("Info", "Please enter a valid age."); return; }
        if (!heightCm || isNaN(parseFloat(heightCm)) || parseFloat(heightCm) <= 50 || parseFloat(heightCm) > 250) { Alert.alert("Info", "Please enter a valid height in cm (e.g., 175)."); return; }
        if (!weight || isNaN(parseFloat(weight)) || parseFloat(weight) <= 20 || parseFloat(weight) > 400) { Alert.alert("Info", "Please enter a valid weight in kg."); return; }
        if (!targetWeightValue || isNaN(parseFloat(targetWeightValue)) || parseFloat(targetWeightValue) < min || parseFloat(targetWeightValue) > max) { Alert.alert("Info", "Please select a valid target weight using the ruler."); return; }

        // API URL (NO /api prefix)
        const API_URL = `http://10.0.2.2:3000/user/updateProfileDetails`; // Ensure this path exists on backend

        const finalGender = selectedGender === 'Other' ? customInput : selectedGender;
        const heightInMeters = parseFloat(heightCm) / 100; // Convert CM to Meters

        const requestBody = {
            uid,
            gender: finalGender,
            age: parseInt(age, 10),
            height: heightInMeters, // Send METERS
            weight: parseFloat(weight), // Current weight (KG)
            targetWeight: parseFloat(targetWeightValue), // Target weight (KG)
            isKg: true, // Always sending true
            startWeight: parseFloat(weight), // Set start weight
        };
        console.log("Sending profile details:", requestBody);

        try {
            // Use axios (more consistent error handling than fetch sometimes)
            const response = await axios.post(API_URL, requestBody, {
                 // Add headers if needed (e.g., Authorization with idToken)
                 // headers: { Authorization: `Bearer ${idToken}` }
             });

            console.log("Profile Update Response:", response.data); // axios puts data directly in response.data
            navigation.navigate("MotivationalScreen", { uid }); // Navigate on success

        } catch (error) {
            console.error("Update Profile Details Error:", error.response ? JSON.stringify(error.response.data) : error.message); // Log details from axios error
            Alert.alert("Update Error", error.response?.data?.error || "Failed to update profile. Please try again."); // Show specific backend error if available
        }
    };

    // --- Render ---
    return (
        <View style={styles.container}>
            {/* Images and Back Button */}
            <Image source={require('../assets/Images/leaf.png')} style={styles.topLeaf} />
            <Image source={require('../assets/Images/leaf.png')} style={styles.bottomLeaf} />
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { marginTop: 45 }]}>
                <Ionicons name="arrow-back" size={38} />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }} contentContainerStyle={{ paddingTop: 55, paddingBottom: 30, alignItems: 'center' }}>
                <Text style={[styles.primaryText, { marginVertical: 10 }]}>Let's set up your profile</Text>

                {/* Gender Input */}
                <Text style={[styles.caloriesText, { padding: 10 }]}>What is your gender?</Text>
                <View style={styles.genderContainer}> {['Male', 'Female', 'Other'].map((option) => ( <TouchableOpacity key={option} style={[styles.genderButton, selectedGender === option && styles.selected]} onPress={() => handleOptions(option)}><Text style={styles.optionText}>{option}</Text></TouchableOpacity> ))} </View>
                {selectedGender === 'Other' && (<TextInput style={[styles.input, styles.customGender]} placeholder='Enter your gender' onChangeText={setCustomInput} value={customInput} />)}

                {/* Age Input */}
                <Text style={[styles.caloriesText, { padding: 10 }]}>How old are you?</Text>
                <TextInput style={[styles.input, styles.customGender]} placeholder='e.g. 25' keyboardType='numeric' value={age} onChangeText={setAge} maxLength={3}/>

                {/* Height Input (CM) */}
                <Text style={[styles.caloriesText, { padding: 10 }]}>What is your height (cm)?</Text>
                <TextInput style={[styles.input, styles.customGender]} placeholder='e.g. 180' keyboardType='numeric' value={heightCm} onChangeText={setHeightCm} maxLength={3}/>

                {/* Weight Input (KG) */}
                <Text style={[styles.caloriesText, { padding: 10 }]}>What is your weight (kg)?</Text>
                <TextInput style={[styles.input, styles.customGender]} placeholder='e.g. 75' keyboardType='decimal-pad' value={weight} onChangeText={setWeight} />

                {/* Target Weight Section (KG only) */}
                <Text style={[styles.caloriesText, { padding: 10 }]}>What is your target weight (kg)?</Text>

                {/* Target Weight Ruler (KG) */}
                <View style={[styles.rulerContainer, { height: 170 }]}>
                    <Text style={styles.selectedValue}>{targetWeightValue} kg</Text>
                    <FlatList
                        ref={rulerListRef}
                        data={numbers} // Use numbers array
                        horizontal
                        snapToAlignment="center"
                        snapToInterval={itemWidth} // Use variable
                        decelerationRate="fast"
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item} // Use item as key
                        initialScrollIndex={calculateInitialIndex()} // Use function
                        getItemLayout={(data, index) => ( {length: itemWidth, offset: itemWidth * index, index} )}
                        contentContainerStyle={{ paddingHorizontal: (screenWidth / 2) - (itemWidth / 2) }} // Use centering style
                        renderItem={({ item }) => {
                            const numValue = parseFloat(item);
                            const isMajorTick = Math.abs(numValue % 5) < (step / 2) || Math.abs(numValue % 5 - 5) < (step / 2);
                            const isMidTick = Math.abs(numValue % 1) < (step / 2) || Math.abs(numValue % 1 - 1) < (step / 2);
                            // Ensure styles.rulerItem, line, major/mid/minorTick etc. are defined
                            return (
                                <View style={[styles.rulerItem, { width: itemWidth }]}>
                                    <Text style={[styles.rulerText, isMajorTick ? {} : { color: 'transparent' }]}>
                                        {isMajorTick ? Math.round(numValue) : ''}
                                    </Text>
                                    <View style={[ styles.line, isMajorTick ? styles.majorTick : (isMidTick ? styles.midTick : styles.minorTick) ]} />
                                </View>
                            );
                        }}
                        onMomentumScrollEnd={handleRulerScroll}
                    />
                    <View style={[ styles.centerIndicator, { position: 'absolute', left: '50%', transform: [{ translateX: -1 }] } ]}/>
                </View>

                {/* Next Button */}
                <View style={styles.buttonContainer}>
                    <Button mode='contained' style={styles.button} labelStyle={styles.textButton} onPress={handleNext}>Next</Button>
                </View>

            </ScrollView>
        </View>
    );
}

// No local StyleSheet needed assuming styles.* cover everything