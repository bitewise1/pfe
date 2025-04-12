// components/TabNavigation.js
import { View, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
// --- V V V --- Added useEffect, useRef --- V V V ---
import React, { useContext, useEffect, useRef } from 'react';
// --- ^ ^ ^ --- End Added --- ^ ^ ^ ---
import stylesFromSheet from './Styles'; // Uses your existing styles file name
import { Ionicons } from '@expo/vector-icons';
// --- V V V --- Added useIsFocused (useRoute might not be needed now) --- V V V ---
import { useNavigation, useIsFocused } from '@react-navigation/native';
// --- ^ ^ ^ --- End Added --- ^ ^ ^ ---
import { AuthContext } from './AuthContext'; // Import AuthContext

// Define styles locally ONLY IF they are missing from your main Styles.js
const localStyles = StyleSheet.create({
    loadingStyle: { // Style for the ActivityIndicator to match icon size
        height: 28, // Match icon size
        width: 28,  // Match icon size
    }
});

// Merge or use styles from import
const styles = StyleSheet.create({
    ...stylesFromSheet, // Your base styles from './Styles.js'
    // Ensure styles.tabNavigation, styles.bot exist from stylesFromSheet
    // If not, provide default examples here
    tabNavigation: stylesFromSheet.tabNavigation || {
         flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
         height: 60, backgroundColor: '#88A76C', borderTopWidth: 1, borderTopColor: '#ccc'
     },
     bot: stylesFromSheet.bot || {
         width: 40, height: 40, resizeMode: 'contain'
     }
});


export default function TabNavigation() {
    const navigation = useNavigation();
    // const route = useRoute(); // We might not need route anymore
    const isFocused = useIsFocused(); // Still useful to check if nav is active
    const { activeCoachId, isCoachStatusLoading, user } = useContext(AuthContext);

    // --- Ref to track the *previous* coach ID state ---
    const previousCoachIdRef = useRef(activeCoachId);

    // --- Effect to Handle Navigation ONLY on Coach ID Change ---
    useEffect(() => {
        const previousCoachId = previousCoachIdRef.current; // Get previous value
        console.log(`[TabNav Effect Trigger] PrevCoach: ${previousCoachId}, CurrCoach: ${activeCoachId}, Loading: ${isCoachStatusLoading}, Focused: ${isFocused}, User: ${!!user}`);

        // --- CONDITIONS ---
        // 1. Ensure user is logged in.
        // 2. Ensure the navigator is focused.
        // 3. Ensure coach status is not currently loading.
        // 4. Ensure activeCoachId is known (not undefined).
        // 5. CRITICAL: Ensure the activeCoachId *actually changed* from the previous render.
        if (user && isFocused && !isCoachStatusLoading && activeCoachId !== undefined && activeCoachId !== previousCoachId) {

            console.log(`TabNav Effect: Coach ID CHANGED from ${previousCoachId} to ${activeCoachId}. Processing navigation...`);

            // SCENARIO 1: Coach CHANGED FROM null/undefined TO an ID -> Navigate to Dashboard
            if (activeCoachId) { // activeCoachId is now a string ID
                console.log("TabNav Effect: Action -> Coach selected/activated. *** NAVIGATING TO DASHBOARD ***");
                 navigation.navigate('ActiveCoachDashboard', { coachId: activeCoachId });
                 // navigation.replace('ActiveCoachDashboard', { coachId: activeCoachId }); // Alternative
                 // navigation.reset({ index: 0, routes: [{ name: 'ActiveCoachDashboard', params: { coachId: activeCoachId } }] }); // Alternative

            // SCENARIO 2: Coach CHANGED FROM an ID TO null -> Navigate to FindSpecialist
            } else { // activeCoachId is now null
                console.log("TabNav Effect: Action -> Coach relationship ended. *** NAVIGATING TO FINDSPECIALIST ***");
                 navigation.navigate('FindSpecialist');
                 // navigation.replace('FindSpecialist'); // Alternative
                 // navigation.reset({ index: 0, routes: [{ name: 'FindSpecialist' }] }); // Alternative
            }
        } else {
            console.log("TabNav Effect: Conditions not met OR coachId did not change.");
        }

        // Update the ref AFTER the effect logic has run for the next comparison
        previousCoachIdRef.current = activeCoachId;

    // Only include dependencies that should logically trigger this *check*
    // We compare current activeCoachId with the ref inside the effect
    }, [user, activeCoachId, isCoachStatusLoading, isFocused, navigation]); // Removed route.name


    // --- Handler for Pressing the Tab Button (Your Original Logic) ---
    const handleExpertsPress = () => {
        if (isCoachStatusLoading) { console.log("TabNavigation Press: Status loading..."); return; }
        if (activeCoachId) {
            console.log("TabNavigation Press: Navigating to ActiveCoachDashboard");
            navigation.navigate('ActiveCoachDashboard', { coachId: activeCoachId });
        } else {
            console.log("TabNavigation Press: Navigating to FindSpecialist");
            navigation.navigate('FindSpecialist');
        }
    };

    // --- RETURN JSX (Your Original Structure - NO STYLE CHANGES HERE) ---
    return(
        // Uses your existing container style -> styles.tabNavigation
        <View style={styles.tabNavigation}>

           {/* Home Button (Original) */}
           <TouchableOpacity onPress={() => navigation.navigate('Home')} disabled={isCoachStatusLoading} >
               <Ionicons name="home-outline" size={28} color="black" />
           </TouchableOpacity>

             {/* Recipes Button (Original) */}
             <TouchableOpacity onPress={() => navigation.navigate('Recipes')} disabled={isCoachStatusLoading} >
                  <Ionicons name="restaurant-outline" size={28} color="black" />
            </TouchableOpacity>

             {/* Profile Button (Original) */}
             <TouchableOpacity onPress={() => navigation.navigate('Profile')} disabled={isCoachStatusLoading} >
                  <Ionicons name="person-outline" size={28} color="black" />
            </TouchableOpacity>

            {/* Experts/Coaching Button (Original Logic) */}
            <TouchableOpacity onPress={handleExpertsPress} disabled={isCoachStatusLoading} >
                  {isCoachStatusLoading ? (
                      // Use local or imported style
                      <ActivityIndicator size="small" color="black" style={styles.loadingStyle || localStyles.loadingStyle}/>
                  ) : (
                      <Ionicons name="people-outline" size={28} color="black" />
                  )}
            </TouchableOpacity>

            {/* Chatbot Button (Original Image) */}
            <TouchableOpacity onPress={() => navigation.navigate('Chatbot')} disabled={isCoachStatusLoading} >
                {/* Uses your existing bot style -> styles.bot */}
                <Image source={require('../assets/Images/bot.png')} style={styles.bot}/>
            </TouchableOpacity>

        </View>
    );
}