// screens/FindSpecialist.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    View, Text, ActivityIndicator, RefreshControl,
    TouchableOpacity, StyleSheet, ScrollView, Alert, Image
} from 'react-native';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import { AuthContext } from '../components/AuthContext';
import Header from '../components/Header'; // Assuming path is correct
import TabNavigation from '../components/TabNavigation'; // Assuming path is correct
import { Ionicons } from '@expo/vector-icons'; // Keep if used

// --- Your Defined Palette ---
const PALETTE = {
    darkGreen: '#2E4A32',
    mediumGreen: '#88A76C',
    lightOrange: '#FCCF94',
    lightCream: '#F5E4C3',
    white: '#FFFFFF',
    black: '#000000',
    grey: '#A0A0A0',
    darkGrey: '#555555',
    pendingOrange: '#FFA000',
    errorRed: '#D32F2F',
};

// --- API Base URL ---
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

export default function FindSpecialist() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const route = useRoute();
    // Get the correct function from context based on the working AuthContext version
    const { user, getIdToken, setActiveCoachInContext, refreshCoachingStatus } = useContext(AuthContext);

    // --- State ---
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [acceptedRequests, setAcceptedRequests] = useState([]);
    const [fetchError, setFetchError] = useState(null);
    const [isSelectingCoachId, setIsSelectingCoachId] = useState(null);

    // --- Fetch Requests (Keep Logging) ---
    const fetchRequests = useCallback(async (isRefresh = false) => {
        if (!user) { if (!isRefresh) setIsLoading(false); setRefreshing(false); return; }
        if (!isRefresh) setIsLoading(true); setFetchError(null);
        console.log("FindSpecialist Fetch: Starting...");
        try {
            const token = await getIdToken(); if (!token) throw new Error("Not authenticated");
            const response = await fetch(`${API_BASE_URL}/coaching/status`, { headers: { 'Authorization': `Bearer ${token}` } });
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) { const text = await response.text(); throw new Error(`Non-JSON: ${text.substring(0,100)}`); }
            const data = await response.json(); if (!response.ok) throw new Error(data.message || "Failed fetch");
            if (!data.activeCoachId) {
                setPendingRequests(data.pendingRequests || []);
                setAcceptedRequests(data.acceptedRequests || []);
            } else { setPendingRequests([]); setAcceptedRequests([]); }
        } catch (err) { console.error("FindSpecialist Fetch Error:", err); setFetchError(err.message); setPendingRequests([]); setAcceptedRequests([]); }
        finally { setIsLoading(false); setRefreshing(false); }
    }, [user, getIdToken]);

    // --- Handle Param ---
    useEffect(() => {
        if (isFocused && route.params?.newPendingRequest) {
            const newRequest = route.params.newPendingRequest;
            setPendingRequests(prev => {
                const exists = prev.some(r => r.nutritionistId === newRequest.nutritionistId);
                return exists ? prev : [newRequest, ...prev];
            });
            navigation.setParams({ newPendingRequest: null });
        }
    }, [route.params?.newPendingRequest, isFocused, navigation]);

    // --- Fetch on Focus ---
    useEffect(() => {
        if (isFocused && user && !route.params?.newPendingRequest) {
            fetchRequests();
        }
         if (!user) { setPendingRequests([]); setAcceptedRequests([]); setIsLoading(true); setFetchError(null); }
    }, [isFocused, user, fetchRequests, route.params?.newPendingRequest]);

    // --- Refresh ---
    const onRefresh = useCallback(() => { setRefreshing(true); fetchRequests(true); }, [fetchRequests]);

    // --- Select Coach ---
    // Use the version that calls setActiveCoachInContext directly
    const handleSelectCoach = useCallback(async (requestId, selectedNutritionistId, nutritionistName) => {
        setIsSelectingCoachId(requestId);
        Alert.alert("Confirm Selection", `Select ${nutritionistName} as coach?`, [
             { text: "Cancel", onPress: () => setIsSelectingCoachId(null) },
             { text: "Select", onPress: async () => {
               try {
                   const token = await getIdToken(); if (!token) throw new Error("Auth error.");
                   const response = await fetch(`${API_BASE_URL}/coaching/select`, {
                       method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                       body: JSON.stringify({ requestId, nutritionistId: selectedNutritionistId })
                   });
                   const data = await response.json(); if (!response.ok) throw new Error(data.message || "Failed selection");
                   Alert.alert("Success", "Coach selected!");
                   setActiveCoachInContext(selectedNutritionistId); // <<<--- DIRECT UPDATE
               } catch (err) { Alert.alert("Error", err.message || "Failed selection"); }
               finally { setIsSelectingCoachId(null); }
           }}
         ]);
    }, [getIdToken, setActiveCoachInContext]); // Dependency correct

    // --- Render Item Helper ---
    const renderRequestItem = (request, type) => {
        if (!request || !request.details) { console.warn(`Render skip ${type}:`, request?.id); return null; }
        const { profileImageUrl, firstName, lastName } = request.details;
        const fullName = `${firstName || ''} ${lastName || ''}`.trim();
        const displayName = fullName || "Coach";
        const defaultImage = require('../assets/Images/DefaultProfile.jpg');
        return (
            <View key={`${type}-${request.id}`} style={styles.requestItemContainer}>
                <View style={styles.coachInfoRow}>
                    <Image source={profileImageUrl ? { uri: profileImageUrl } : defaultImage} style={styles.coachImage} />
                    <Text style={styles.coachName}>{displayName}</Text>
                </View>
                {type === 'accepted' && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.selectButton, isSelectingCoachId === request.id && styles.actionButtonDisabled]}
                        onPress={() => handleSelectCoach(request.id, request.nutritionistId, displayName)}
                        disabled={isSelectingCoachId === request.id}>
                        {isSelectingCoachId === request.id ? <ActivityIndicator color={PALETTE.white} size="small"/> : <Text style={styles.actionButtonText}>Select as Coach</Text>}
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    // --- Main Render ---
    if (isLoading && !refreshing) {
        return ( <View style={styles.mainContainer}><Header subtitle={"..."} /><View style={styles.loadingContainer}><ActivityIndicator size="large" color={PALETTE.darkGreen} /></View><TabNavigation /></View> );
    }

    return (
        <View style={styles.mainContainer}>
            <Header subtitle={"Find & Manage Coaches"} />
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PALETTE.darkGreen]}/>} >

                {/* Browse Button */}
                <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('NutritionSection')}>
                    <Text style={styles.browseButtonText}>Browse coaches</Text>
                </TouchableOpacity>

                {/* Error Display */}
                {fetchError && !refreshing && (
                    <View style={styles.errorCard}>
                         <Text style={styles.errorText}>Error: {fetchError}</Text>
                         <TouchableOpacity onPress={onRefresh}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
                     </View>
                )}

                {/* Accepted Section */}
                {acceptedRequests && acceptedRequests.length > 0 && (
                     <View style={styles.sectionCard}>
                         <Text style={styles.sectionTitle}>Accepted</Text>
                         {/* Render the list items */}
                         {acceptedRequests.map(request => renderRequestItem(request, 'accepted'))}
                     </View>
                )}

                 {/* Pending Section */}
                 {pendingRequests && pendingRequests.length > 0 && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Pending requests</Text>
                        {/* Render the list items */}
                        {pendingRequests.map(request => renderRequestItem(request, 'pending'))}
                     </View>
                 )}

                 {/* No Requests Message */}
                 {!isLoading && !refreshing && acceptedRequests?.length === 0 && pendingRequests?.length === 0 && !fetchError && (
                    <Text style={styles.noRequestsText}>No pending or accepted requests found.</Text>
                 )}
            </ScrollView>
             <TabNavigation />
        </View>
    );
}

// --- Styles (Keep YOUR existing styles as passed before) ---
const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: PALETTE.lightCream, },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: PALETTE.lightCream, },
    scrollContainer: { paddingHorizontal: 15, paddingVertical: 20, paddingBottom: 90, },
    browseButton: { backgroundColor: PALETTE.darkGreen, paddingVertical: 15, paddingHorizontal: 20, borderRadius: 20, marginBottom: 25, alignItems: 'center', elevation: 2, shadowColor: PALETTE.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, },
    browseButtonText: { color: PALETTE.white, fontSize: 20, fontFamily: 'Quicksand_700Bold', },
    errorCard: { backgroundColor: PALETTE.white, padding: 15, borderRadius: 10, marginVertical: 15, alignItems: 'center', elevation: 1 },
    errorText: { color: PALETTE.errorRed, textAlign: 'center', marginBottom: 10, fontSize: 14 },
    retryText: { color: PALETTE.darkGreen, fontWeight: 'bold', fontSize: 15 },
    sectionCard: { backgroundColor: PALETTE.lightOrange, borderRadius: 15, padding: 15, marginBottom: 20, elevation: 2, shadowColor: PALETTE.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, },
    sectionTitle: { fontSize: 20, fontFamily: 'Quicksand_700Bold', marginBottom: 15, color: PALETTE.darkGrey, paddingLeft: 5, },
    requestItemContainer: { marginBottom: 15, },
    coachInfoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: PALETTE.lightCream, padding: 12, borderRadius: 20, elevation: 1, shadowColor: PALETTE.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, },
    coachImage: { width: 45, height: 45, borderRadius: 22.5, marginRight: 12, backgroundColor: PALETTE.grey, },
    coachName: { fontSize: 18, fontFamily: 'Quicksand_700Bold', color: PALETTE.black, flex: 1, },
    actionButton: { paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 10, minHeight: 40, justifyContent: 'center', elevation: 2, shadowColor: PALETTE.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, },
    selectButton: { backgroundColor: PALETTE.darkGreen, },
    actionButtonText: { color: PALETTE.white, fontFamily: 'Quicksand_700Bold', fontSize: 14 },
    actionButtonDisabled: { backgroundColor: PALETTE.grey, opacity: 0.7, },
    noRequestsText: { textAlign: 'center', color: PALETTE.darkGrey, marginTop: 40, fontSize: 16, fontStyle: 'italic' },
});