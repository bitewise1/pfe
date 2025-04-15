import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, Alert, Pressable, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../components/AuthContext';
import Header from '../components/Header';
import TabNavigation from '../components/TabNavigation';

const API_BASE_URL = 'http://10.0.2.2:3000';

export default function ActiveCoachDashboard() {
    const route = useRoute();
    const navigation = useNavigation();
    const { user, getIdToken, activeCoachId: coachIdFromContext } = useContext(AuthContext);
    const coachId = coachIdFromContext || route.params?.coachId;
    const [coachDetails, setCoachDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!coachId) {
                setError("No active coach identified.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const token = await getIdToken();
                if (!token) throw new Error("Not authenticated");

                const response = await fetch(`${API_BASE_URL}/coaching/status`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to fetch coach details");

                if (data.activeCoachId === coachId && data.activeCoachDetails) {
                    setCoachDetails(data.activeCoachDetails);
                } else {
                    throw new Error("Could not load details for the active coach.");
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [coachId, getIdToken]);

    return (
        <View style={styles.mainContainer}>
            <Header subtitle={"Your Active Coach"} />
            <View style={styles.contentArea}>
                {isLoading && <ActivityIndicator size="large" color="#2E4A32" />}
                {error && <Text style={styles.errorText}>Error: {error}</Text>}
                {!isLoading && !error && coachDetails && (
                    <>
                        <Image
                            source={
                                coachDetails?.profileImageUrl
                                    ? { uri: coachDetails.profileImageUrl }
                                    : require('../assets/Images/DefaultProfile.jpg')
                            }
                            style={styles.coachImage}
                        />
                        <Text style={styles.coachName}>
                            {coachDetails.firstName} {coachDetails.lastName}
                        </Text>
                        <Text style={styles.specialization}>
                            Specialization: {coachDetails.specialization}
                        </Text>

                        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ProfessionalChat')}>
                            <Text style={styles.buttonText}>Chat</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} >
                            <Text style={styles.buttonText}>Request Plan</Text>
                        </TouchableOpacity>

                        <Pressable  onPress={() => navigation.navigate('MessagesGuidance')}>
                            <Text style={styles.manageConnectionText}>Manage connection</Text>
                        </Pressable>
                    </>
                )}
                {!isLoading && !error && !coachDetails && (
                    <Text>Could not load coach information.</Text>
                )}
            </View>
            <TabNavigation />
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#F5E4C3',
    },
    contentArea: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginVertical: 15,
        fontSize: 14,
    },
    coachImage: {
        width: 150,
        height: 150,
        borderRadius: 75,
        marginVertical: 20,
    },
    coachName: {
        fontSize: 30,
        fontFamily: 'Quicksand_700Bold',
        marginVertical: 15
    },
    specialization: {
        fontSize: 20,
        marginVertical: 20,
        fontFamily: 'Quicksand_600SemiBold',
    },
    actionButton: {
        backgroundColor: '#FCCF94',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 20,
        marginVertical: 20,
        width: '95%'
    },
    buttonText: {
        fontSize: 20,
        fontFamily: 'Quicksand_700Bold',
        textAlign: 'center',
    },
    
    manageConnectionText: {
        color: '#2E4A32',
        fontSize: 20,
        fontFamily: 'Quicksand_700Bold',
        textAlign: 'center',
        textDecorationLine: 'underline',
        marginVertical: 20
    },
});
