// screens/MessagesGuidance.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native'; // Added ScrollView
import stylesFromSheet from "./Styles"; // Use YOUR main styles file
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import Header from "../components/Header"; // Adjust path
import TabNavigation from "../components/TabNavigation"; // Adjust path
import { AuthContext } from '../components/AuthContext'; // Adjust path
import styles from './Styles';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';




export default function MessagesGuidance (){
    const navigation = useNavigation();
    const route = useRoute();
    const { user, getIdToken, activeCoachId, refreshCoachingStatus } = useContext(AuthContext);

    // --- Determine the active coach ID ---
    const currentCoachId = activeCoachId || route.params?.coachId;

    // --- State ---
    const [rating, setRating] = useState(0); // Existing state for stars
    const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for API calls
    const [actionError, setActionError] = useState(null); // Error display

    // Clear error on load/coach change
    useEffect(() => { setActionError(null); }, [currentCoachId]);

    // --- Render Stars (Your original function) ---
    const renderStars = () => {
        let stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity
                    key={i}
                    onPress={() => setRating(i)}
                    disabled={isSubmitting} // Disable while submitting actions
                >
                    <Ionicons
                        name={i <= rating ? 'star' : 'star-outline'}
                        size={30}
                        // Use color from your original style if available, else default
                        color={styles.starColor || '#2E4A32'} // Assuming styles might have starColor
                        style={{ marginHorizontal: 3 }} // Adjust spacing if needed
                    />
                </TouchableOpacity>
            );
        }
        // Wrap stars in a View to apply flexDirection
        return <View style={localStyles.starsRowInternal}>{stars}</View>; // Use local style for layout
    };

    // --- Base API Call Function (Keep from previous version) ---
    const performAction = useCallback(async (endpoint, method = 'POST', body = null) => {
        // Ensure currentCoachId check allows end-relationship even if null temporarily during state change?
        // Added a specific check within the function body instead.
        if (!currentCoachId && endpoint !== '/coaching/end-relationship') {
            Alert.alert("Error", "No active coach identified for this action."); return null;
        }
        // Check specifically for end-relationship if currentCoachId might be briefly null during context refresh
        if (endpoint === '/coaching/end-relationship' && !activeCoachId) {
             console.warn("Attempted to end relationship when no active coach ID was found in context.");
             // Allow proceeding maybe, backend will handle no active coach? Or alert user?
             // Alert.alert("Info", "No active coaching relationship to end."); return null;
        }

        setIsSubmitting(true); setActionError(null);
        try {
            const token = await getIdToken(); if (!token) throw new Error("Authentication failed.");
            const options = { method, headers: { 'Authorization': `Bearer ${token}` } };
            if (body) {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(body);
            }
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                 const text = await response.text(); throw new Error(`Server Error: ${text.substring(0,100)}`);
            }
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || `Request failed`);
            return data; // Return data on success
        } catch (error) {
            console.error(`Error performing action ${endpoint}:`, error);
            setActionError(error.message || "An unexpected error occurred.");
            Alert.alert("Error", error.message || "An unexpected error occurred.");
            return null; // Return null on failure
        } finally { setIsSubmitting(false); }
    }, [getIdToken, currentCoachId, activeCoachId]); // Include activeCoachId from context


    // --- Action Handlers ---
    const handleValidateRating = useCallback(async () => {
        if (rating === 0) { Alert.alert("Select Rating", "Please select stars first."); return; }
        if (!currentCoachId) { Alert.alert("Error", "Cannot rate without an active coach ID."); return; }
        const result = await performAction('/coaching/rate', 'POST', { nutritionistId: currentCoachId, rating: rating });
        if (result) { Alert.alert("Success", "Rating submitted!"); setRating(0); }
    }, [rating, currentCoachId, performAction]);

    const handleEndRelationship = useCallback(async () => {
         // Add check here too, although performAction also checks
         if (!currentCoachId) {
             Alert.alert("Info", "No active relationship to end.");
             return;
         }
         Alert.alert(
            "End Coaching?",
            "Are you sure? You will need to send a new request to reconnect.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "End Relationship", style: "destructive", onPress: async () => {
                    const result = await performAction('/coaching/end-relationship', 'POST');
                    if (result) {
                        Alert.alert("Success", "Coaching relationship ended.");
                        // 1. Refresh context state first
                        await refreshCoachingStatus();
                        // 2. Navigate AFTER context is updated
                        console.log("MessagesGuidance: Navigating to FindSpecialist after ending relationship.");
                        // Ensure 'FindSpecialist' is the correct route name
                        navigation.navigate('FindSpecialist');
                    }
                }}
            ]
        );
    }, [performAction, refreshCoachingStatus, navigation, currentCoachId]); // Added currentCoachId and navigation

    const handleBlockCoach = useCallback(async () => {
        if (!currentCoachId) { Alert.alert("Error", "Cannot block without an active coach ID."); return; }
         Alert.alert(
            "Block Coach?",
            "Are you sure? You won't see this coach or be able to interact.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Block Coach", style: "destructive", onPress: async () => {
                    const result = await performAction('/coaching/block', 'POST', { nutritionistId: currentCoachId });
                    if (result) {
                        Alert.alert("Success", "Coach blocked.");
                        // Blocking also ends relationship, so refresh and navigate
                        await refreshCoachingStatus();
                        console.log("MessagesGuidance: Navigating to FindSpecialist after blocking coach.");
                        navigation.navigate('FindSpecialist');
                    }
                }}
            ]
        );
    }, [currentCoachId, performAction, refreshCoachingStatus, navigation]); // Added navigation

    // --- Render ---
     if (!currentCoachId) { // Use derived currentCoachId for this check
        // This view is rendered if the user somehow gets here without an active coach
        return (
            <View style={styles.mainContainer}>
                 <Header subtitle={"Messages & Guidance"}/>
                 <View style={localStyles.centeredMessage}>
                    <Text>No active coach found.</Text>
                     <TouchableOpacity onPress={() => navigation.navigate('FindSpecialist')}>
                         <Text style={localStyles.linkText}>Find a coach</Text>
                     </TouchableOpacity>
                 </View>
                 <TabNavigation/>
            </View>
        );
     }

    // Main return when coach is active
    return(
      <View style={styles.mainContainer}>
         <Header subtitle={"Messages & Guidance"}/>

   

            {/* Your potato image */}
            <Image source={require('../assets/Images/potato.png')} style={[styles.smallPear, localStyles.centerImage]}/>

            {/* Container for the management options, using your style */}
            <View style={styles.messageContainer}>

                {/* Rating Section */}
                <Text style={styles.RatingEntry}>Rating entry</Text>

                {/* Using local style for layout, your styles for appearance */}
                {/* Removed outer TouchableOpacity as it served no purpose */}
                <View style={localStyles.starsRowContainer}>
                    {renderStars()}
                </View>

                {/* Validate Button */}
                <TouchableOpacity
                    // Use your base button style, add local margin, check disabled state
                    style={[styles.buttons,  (rating === 0 || isSubmitting) && localStyles.buttonDisabled]}
                    onPress={handleValidateRating}
                    disabled={rating === 0 || isSubmitting}
                >
                    {isSubmitting ? <ActivityIndicator color={styles.addText?.color || "#fff"} size="small"/> : <Text style={styles.addText}>Validate Rating</Text>}
                </TouchableOpacity>

                {/* End Relationship Button */}
                <TouchableOpacity
                    // Use your base button style, add local margin, check disabled state
                    style={[styles.buttons,  isSubmitting && localStyles.buttonDisabled]}
                    onPress={handleEndRelationship}
                    disabled={isSubmitting}
                >
                   {isSubmitting ? <ActivityIndicator color={styles.addText?.color || "#fff"} size="small"/> : <Text style={styles.addText}>End Coaching Relationship</Text>}
                </TouchableOpacity>

                {/* Block Coach Button */}
                <TouchableOpacity
                    // Use your base button style, add local margin, check disabled state
                    style={[styles.buttons,  isSubmitting && localStyles.buttonDisabled]}
                    onPress={handleBlockCoach}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <ActivityIndicator color={styles.addText?.color || "#fff"} size="small"/> : <Text style={styles.addText}>Block coach</Text>}
                </TouchableOpacity>

                 {/* Display Error Message if action fails */}
                 {actionError && <Text style={localStyles.errorText}>{actionError}</Text>}

            </View>
   

         <TabNavigation/>
      </View>
    );
}

// --- Local Styles ---
// Styles specific to layout/minor adjustments for this screen
// References styles from the imported sheet where possible (e.g., for colors, fonts)
const localStyles = StyleSheet.create({
     scrollContainer: {
          paddingHorizontal: 20, // Horizontal padding for scroll content
          paddingVertical: 10,   // Vertical padding
          paddingBottom: 80,   // Space for tab bar
          alignItems: 'center', // Center content horizontally
          flexGrow: 1,         // Allow scrollview to grow if content is short
     },
     centerImage: {
          alignSelf: 'center',
          width: styles.smallPear?.width || 100, // Use width from styles or default
          height: styles.smallPear?.height || 100,// Use height from styles or default
          marginBottom: 20,
     },
     starsRowContainer: { 
         flexDirection: 'row', 
         justifyContent: 'center',
         alignItems: 'center',
         width: '100%', 
         paddingVertical: 15, 
         
         marginBottom: 10, 
     },
     starsRowInternal: { 
         flexDirection: 'row',
     },
     
     errorText: {
         color: 'red',
         marginTop: 15,
         textAlign: 'center',
         fontSize: 14,
     },
  
     buttonDisabled: {
          opacity: 0.6,
          backgroundColor: '#cccccc',
     },
   
     centeredMessage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
     },
     linkText: {
         color: '#007AFF', 
         marginTop: 10,
         textDecorationLine: 'underline'
     }
});