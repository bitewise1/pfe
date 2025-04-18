import { View, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import React, { useContext, useEffect, useRef } from 'react';
import stylesFromSheet from './Styles'; 
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';

import { AuthContext } from './AuthContext'; 
import Octicons from '@expo/vector-icons/Octicons';

const localStyles = StyleSheet.create({
    loadingStyle: { 
        height: 28, 
        width: 28,  
    }
});


const styles = StyleSheet.create({
    ...stylesFromSheet, 
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
    const isFocused = useIsFocused(); 
    const { activeCoachId, isCoachStatusLoading, user } = useContext(AuthContext);
    const previousCoachIdRef = useRef(activeCoachId);

    useEffect(() => {
        const previousCoachId = previousCoachIdRef.current; 
        console.log(`[TabNav Effect Trigger] PrevCoach: ${previousCoachId}, CurrCoach: ${activeCoachId}, Loading: ${isCoachStatusLoading}, Focused: ${isFocused}, User: ${!!user}`);

        if (user && isFocused && !isCoachStatusLoading && activeCoachId !== undefined && activeCoachId !== previousCoachId) {

            console.log(`TabNav Effect: Coach ID CHANGED from ${previousCoachId} to ${activeCoachId}. Processing navigation...`);

            if (activeCoachId) { 
                console.log("TabNav Effect: Action -> Coach selected/activated. *** NAVIGATING TO DASHBOARD ***");
                 navigation.navigate('ActiveCoachDashboard', { coachId: activeCoachId });
         
            } else { 
                console.log("TabNav Effect: Action -> Coach relationship ended. *** NAVIGATING TO FINDSPECIALIST ***");
                 navigation.navigate('FindSpecialist');
            }
        } else {
            console.log("TabNav Effect: Conditions not met OR coachId did not change.");
        }

        previousCoachIdRef.current = activeCoachId;

    }, [user, activeCoachId, isCoachStatusLoading, isFocused, navigation]);
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

    return(
        <View style={styles.tabNavigation}>
           <TouchableOpacity onPress={() => navigation.navigate('Home')} disabled={isCoachStatusLoading} >
               <Ionicons name="home-outline" size={28} color="black" />
           </TouchableOpacity>
             <TouchableOpacity onPress={() => navigation.navigate('Recipes')} disabled={isCoachStatusLoading} >
                  <Ionicons name="restaurant-outline" size={28} color="black" />
            </TouchableOpacity>
             <TouchableOpacity onPress={() => navigation.navigate('Profile')} disabled={isCoachStatusLoading} >
                  <Ionicons name="person-outline" size={28} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExpertsPress} disabled={isCoachStatusLoading} >
                  {isCoachStatusLoading ? (
                     
                      <ActivityIndicator size="small" color="black" style={styles.loadingStyle || localStyles.loadingStyle}/>
                  ) : (
                      <Ionicons name="people-outline" size={28} color="black" />
                  )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Chatbot')} disabled={isCoachStatusLoading} >
                <Ionicons name="chatbubble-ellipses-outline" size={28} color="black" />
            </TouchableOpacity>

        </View>
    );
}