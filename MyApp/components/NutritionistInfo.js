// screens/NutritionistInfo.js
import React, { useContext, useState, useEffect, useCallback } from "react";
import {
    View, Text, TouchableOpacity, Image, Dimensions,
    Alert, ActivityIndicator, StyleSheet // Added StyleSheet for local styles if needed
} from "react-native";
import styles from "./Styles"; // Use YOUR existing main styles file
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Divider } from "react-native-paper";
import { AuthContext } from './AuthContext'; // Adjust path

// --- API Base URL ---
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000'; // Adjust if needed

// --- Define or Merge Styles ---
// If these styles are already in your main Styles.js, you don't need this block
const componentStyles = StyleSheet.create({
    buttonDisabled: { opacity: 0.5 },
    buttonPending: { backgroundColor: '#FFA726' }, // Example orange
    buttonAccepted: { backgroundColor: '#66BB6A' }, // Example green
    buttonHasCoach: { backgroundColor: '#78909C' }, // Example grey
     // Ensure styles for header, topRow, headerLogo, appName, profile image,
     // details container, nutritionistName, etc. are defined in your main 'styles' import
     // Add any styles missing from your main sheet if necessary
     profileImageStyle: { // Example - use your actual style name
        width: 190, height: 190, borderRadius: 95, alignSelf: 'center',
        zIndex: 100, position: 'absolute', top: 110,
        borderWidth: 3, borderColor: '#F5E4C3'
     },
     detailsContainerStyle: { // Example - use your actual style name
        backgroundColor: '#F5E4C3', width: Dimensions.get('window').width, height: '60%',
        borderTopLeftRadius: 50, borderTopRightRadius: 50,
        paddingTop: 20, // Might need adjustment based on image position/size
        paddingHorizontal: 20, position: 'absolute', bottom: 0
     },
     // Add other potentially missing styles if needed
});
// --- End Styles Definition ---


export default function NutritionistInfo() {
    const navigation = useNavigation();
    const { user, getIdToken, activeCoachId } = useContext(AuthContext);
    const route = useRoute();

    const {
        nutritionistId, // EXPECTING THIS ID
        firstName, lastName, workplace, yearsOfExperience,
        shortBio, specialization, profileImage // Ensure profileImage is the correct URL string
    } = route.params || {};

    // --- State ---
    const [requestState, setRequestState] = useState('loading_status');

    // --- Check initial status ---
    useEffect(() => {
        const checkStatus = async () => {
            setRequestState('loading_status');
            if (!user || !nutritionistId) { setRequestState('error'); return; }
            if (activeCoachId) { setRequestState('has_coach'); return; } // Check active coach first

            try { // Check specific request status
                const token = await getIdToken(); if (!token) throw new Error("Auth token missing.");
                const response = await fetch(`${API_BASE_URL}/coaching/request-status/${nutritionistId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await response.json(); if (!response.ok) throw new Error(data.message || `Error ${response.status}`);

                // Update state based on specific status
                if (data.status === 'pending') setRequestState('pending');
                else if (data.status === 'accepted') setRequestState('accepted');
                else if (data.status === 'selected') setRequestState('has_coach');
                else setRequestState('idle'); // status === 'none'

            } catch (error) { console.error("NutritionistInfo: Error checking status:", error); setRequestState('error'); }
        };
        checkStatus();
    }, [user, nutritionistId, activeCoachId, getIdToken]); // Dependencies


    // --- Handle Send Request Action ---
    const handleSendRequest = useCallback(async () => {
        if (requestState !== 'idle' && requestState !== 'error') { console.log(`Send req blocked: ${requestState}`); return; }

        setRequestState('loading'); // Set state to 'loading' for the send action itself
        try {
            const token = await getIdToken(); if (!token) throw new Error("Auth session expired.");

            const response = await fetch(`${API_BASE_URL}/coaching/request`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ nutritionistId: nutritionistId })
            });
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 409) { setRequestState('pending'); throw new Error(data.error || "Request exists or coach active."); } // Set state on conflict
                if (response.status === 404) throw new Error(data.error || "Nutritionist not found.");
                throw new Error(data.error || `Request failed (${response.status})`);
            }

            // --- Success ---
            Alert.alert("Request Sent!", "Your request has been sent successfully.");

            // *** THIS IS THE CORRECTED NAVIGATION LOGIC ***
            console.log("Navigating to FindSpecialist with newPendingRequest");
            // Make sure 'FindSpecialist' is the actual name of the screen in your navigator
            // that displays the pending/accepted lists.
            navigation.navigate('FindSpecialist', {
                newPendingRequest: {
                    id: data.requestId || `temp_${Date.now()}`, // Use ID from backend if returned
                    nutritionistId: nutritionistId,
                    status: 'pending',
                    details: { // Pass details needed to display the card on the next screen
                        firstName, lastName, specialization,
                        profileImageUrl: profileImage, // Pass the correct image URL field name
                        yearsOfExperience
                        // Add any other fields your NutritionistCard or display logic needs
                    }
                }
            });
            // *** END CORRECTED NAVIGATION LOGIC ***

        } catch (error) {
            console.error("Error sending coach request:", error);
            Alert.alert("Error Sending Request", error.message || "An unexpected error occurred.");
            // Revert state only if it wasn't set to 'pending' due to a conflict
             if (requestState !== 'pending') {
                 setRequestState('error');
            }
        }
        // No need to set loading false, navigation occurs or state changes
    }, [
        // Dependencies for useCallback:
        requestState, user, nutritionistId, getIdToken, navigation,
        firstName, lastName, specialization, profileImage, yearsOfExperience // Include details used in navigation param
    ]);


    // --- Determine Button Appearance/Behavior ---
    let buttonText = "Send request";
    let isButtonDisabled = false;
    let showLoader = requestState === 'loading_status' || requestState === 'loading';
    let specificButtonStyle = null;

    switch (requestState) {
        case 'loading_status': case 'loading': buttonText = ""; isButtonDisabled = true; break;
        case 'pending': buttonText = "Request Pending"; isButtonDisabled = true; specificButtonStyle = componentStyles.buttonPending; break;
        case 'accepted': buttonText = "Request Accepted"; isButtonDisabled = true; specificButtonStyle = componentStyles.buttonAccepted; break;
        case 'has_coach': buttonText = "Coach Active"; isButtonDisabled = true; specificButtonStyle = componentStyles.buttonHasCoach; break;
        case 'error': buttonText = "Retry Request"; isButtonDisabled = false; break;
        case 'idle': default: buttonText = "Send request"; isButtonDisabled = false; break;
    }
    if (!user || !nutritionistId) { isButtonDisabled = true; } // Always disable if no user/target


    // --- RETURN ---
    return (
        // Assuming styles.mainContainer exists in your ./Styles import
        <View style={[styles.mainContainer, { backgroundColor: '#88A76C' }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.topRow}>
                    <Image source={require("../assets/Images/logo.png")} style={styles.headerLogo} />
                    <Text style={styles.appName}>Bite wise</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Notifications')}><Ionicons name="notifications-outline" size={24} color="black" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}><Ionicons name="settings-outline" size={24} color="black" /></TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="black" /></TouchableOpacity>
            </View>

            {/* Profile Image - Use style from import or local definition */}
            <Image source={{ uri: profileImage }} style={styles.profileImageStyle || componentStyles.profileImageStyle} />

            {/* Details Container - Use style from import or local definition */}
            <View style={styles.detailsContainerStyle || componentStyles.detailsContainerStyle}>
                {/* Details Text - Ensure these styles exist */}
                <Text style={styles.nutritionistName}>Dr.{firstName} {lastName}</Text>
                <Text style={styles.nutritionistSpecialization}>{specialization}</Text>
                <Text style={styles.nutritionistWorkplace}>📍{workplace} | {yearsOfExperience} years of experience</Text>
                <Divider style={[styles.Divider, { width: Dimensions.get('window').width * 0.9 }]} />
                <Text style={styles.nutritionistName}>About</Text>
                <Text style={styles.nutritionistSpecialization}>{shortBio}</Text>
             

                {/* Button Container - Ensure this style exists */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        // Apply base style, specific state style, and disabled style
                        style={[
                            styles.button, // Your base button style
                            specificButtonStyle, // Style for pending/accepted/has_coach (from componentStyles)
                            isButtonDisabled && (styles.buttonDisabled || componentStyles.buttonDisabled) // Generic disabled style
                        ]}
                        onPress={handleSendRequest}
                        disabled={isButtonDisabled}
                    >
                        {showLoader ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            // Ensure styles.textButton exists
                            <Text style={styles.textButton}>{buttonText}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}