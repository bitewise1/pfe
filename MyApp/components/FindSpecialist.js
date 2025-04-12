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
// We are rendering directly, so NutritionistCard is not needed unless you change the map function
// import NutritionistCard from '../components/NutritionistCard';
import { Ionicons } from '@expo/vector-icons';

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
    pendingOrange: '#FFA000', // Consider using this for pending visual cue if desired
    errorRed: '#D32F2F',
};

// --- API Base URL ---
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

export default function FindSpecialist() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const route = useRoute();
    const { user, getIdToken, refreshCoachingStatus } = useContext(AuthContext);

    // --- State ---
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [acceptedRequests, setAcceptedRequests] = useState([]);
    const [fetchError, setFetchError] = useState(null);
    const [isSelectingCoachId, setIsSelectingCoachId] = useState(null);

    // --- Fetch Requests (Logic remains the same) ---
    const fetchRequests = useCallback(async (isRefresh = false) => {
        if (!user) { if (!isRefresh) setIsLoading(false); setRefreshing(false); return; }
        if (!isRefresh) setIsLoading(true); setFetchError(null);
        try {
            const token = await getIdToken(); if (!token) throw new Error("Not authenticated");
            const response = await fetch(`${API_BASE_URL}/coaching/status`, { headers: { 'Authorization': `Bearer ${token}` }});
            // Add extra check for non-JSON responses
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                 const text = await response.text();
                 throw new Error(`Unexpected server response. Status: ${response.status}. Body: ${text.substring(0,100)}...`);
            }
            const data = await response.json(); if (!response.ok) throw new Error(data.message || "Failed to fetch requests");

            if (!data.activeCoachId) {
                setPendingRequests(data.pendingRequests || []); setAcceptedRequests(data.acceptedRequests || []);
                console.log(`FindSpecialist: Fetched ${data.pendingRequests?.length || 0}p, ${data.acceptedRequests?.length || 0}a reqs.`);
            } else { console.warn("FindSpecialist: Active coach found, clearing local requests."); setPendingRequests([]); setAcceptedRequests([]); }
        } catch (err) { console.error("FindSpecialist: Error fetching reqs:", err); setFetchError(err.message); }
        finally { setIsLoading(false); setRefreshing(false); }
    }, [user, getIdToken]);


    // --- Handle newly sent request param (Logic remains the same) ---
    useEffect(() => {
        if (isFocused && route.params?.newPendingRequest) {
            const newRequest = route.params.newPendingRequest;
            console.log("FindSpecialist: Processing newPendingRequest param:", newRequest.id);
            setPendingRequests(prev => {
                const exists = prev.some(r => r.id === newRequest.id || r.nutritionistId === newRequest.nutritionistId);
                 console.log("FindSpecialist: Param request exists in current state?", exists);
                if (!exists) {
                    console.log("FindSpecialist: Optimistically adding new request.");
                    return [newRequest, ...prev];
                }
                return prev;
            });
            navigation.setParams({ newPendingRequest: null });
        }
    }, [route.params?.newPendingRequest, isFocused, navigation]);


    // --- Initial Fetch & Refetch on Focus (Logic remains the same) ---
    useEffect(() => {
        if (isFocused && user) { fetchRequests(); }
         if (!user) { setPendingRequests([]); setAcceptedRequests([]); setIsLoading(true); setFetchError(null); }
    }, [isFocused, user, fetchRequests]);


    // --- Manual Refresh (Logic remains the same) ---
    const onRefresh = useCallback(() => { setRefreshing(true); fetchRequests(true); }, [fetchRequests]);


    // --- Select Coach Action (Logic remains the same) ---
    const handleSelectCoach = useCallback(async (requestId, selectedNutritionistId, nutritionistName) => {
        setIsSelectingCoachId(requestId);
        Alert.alert("Confirm Selection", `Select Dr. ${nutritionistName} as your coach?`,
            [ { text: "Cancel", style: "cancel", onPress: () => setIsSelectingCoachId(null) },
              { text: "Select", style: "default", onPress: async () => {
                try {
                    const token = await getIdToken(); if (!token) throw new Error("Auth session expired.");
                    const response = await fetch(`${API_BASE_URL}/coaching/select`, {
                        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ requestId, nutritionistId: selectedNutritionistId })
                    });
                    const data = await response.json(); if (!response.ok) throw new Error(data.message || "Failed to select coach");
                    Alert.alert("Success", "Coach selected successfully!");
                    await refreshCoachingStatus(); // Triggers context/navigation update
                } catch (err) { console.error("Error selecting coach:", err); Alert.alert("Error", err.message || "Could not select coach."); }
                finally { setIsSelectingCoachId(null); }
            } } ]
        );
    }, [getIdToken, refreshCoachingStatus]);


    // --- Helper Function to Render Individual Request Item (improves readability) ---
    const renderRequestItem = (request, type) => {
        if (!request || !request.details) {
            // Log missing details for debugging
            console.log(`renderRequestItem: Skipping render for ${type} request ${request?.id} due to missing details.`);
            return <Text key={`err-${request?.id || Math.random()}`} style={styles.errorText}>Coach details loading or unavailable.</Text>;
        }

        // Log details being rendered
         // console.log(`Rendering ${type} item: ${request.id}`, request.details);

        const { profileImageUrl, firstName, lastName } = request.details;
        const fullName = `${firstName || ''} ${lastName || ''}`.trim();

        return (
            // Use request.id for the key of the outer container
            <View key={`${type}-${request.id}`} style={styles.requestItemContainer}>
                {/* This View represents the inner card/row */}
                <View style={styles.coachInfoRow}>
                    <Image
                       source={profileImageUrl ? { uri: profileImageUrl } : require('../assets/Images/DefaultProfile.jpg')}
                        style={styles.coachImage}
                    />
                    <Text style={styles.coachName}>{fullName}</Text>
                </View>

                {/* Conditionally render the "Select" button only for accepted requests */}
                {type === 'accepted' && (
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            styles.selectButton,
                            isSelectingCoachId === request.id && styles.actionButtonDisabled // Add disabled style
                        ]}
                        onPress={() => handleSelectCoach(request.id, request.nutritionistId, fullName)}
                        disabled={isSelectingCoachId === request.id}
                    >
                        {isSelectingCoachId === request.id ? (
                            <ActivityIndicator color={PALETTE.white} size="small"/>
                        ) : (
                            <Text style={styles.actionButtonText}>Select as Coach</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        );
    };


    // --- Main Render ---
    if (isLoading && !refreshing) {
        return ( <View style={styles.loadingContainer}><ActivityIndicator size="large" color={PALETTE.darkGreen} /></View> );
    }

    return (
        <View style={styles.mainContainer}>
            <Header subtitle={"Find & Manage Coaches"} />

            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PALETTE.darkGreen]}/>}
            >
                {/* Browse Button */}
                <TouchableOpacity
                    style={styles.browseButton}
                    onPress={() => navigation.navigate('NutritionSection')}
                >
                    <Text style={styles.browseButtonText}>Browse coaches</Text>
                </TouchableOpacity>

                {/* Error Display */}
                {fetchError && !refreshing && <Text style={styles.errorText}>Error loading requests: {fetchError}</Text>}

                {/* Accepted Section */}
                {/* Check if the array exists AND has items before mapping */}
                {acceptedRequests && acceptedRequests.length > 0 && (
                     <View style={styles.sectionCard}>
                         <Text style={styles.sectionTitle}>Accepted</Text>
                         {acceptedRequests.map(request => renderRequestItem(request, 'accepted'))}
                     </View>
                )}

                 {/* Pending Section */}
                 {/* Check if the array exists AND has items before mapping */}
                 {pendingRequests && pendingRequests.length > 0 && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Pending requests</Text>
                         {pendingRequests.map(request => renderRequestItem(request, 'pending'))}
                     </View>
                 )}

                 {/* No Requests Message */}
                 {!isLoading && (!acceptedRequests || acceptedRequests.length === 0) && (!pendingRequests || pendingRequests.length === 0) && !fetchError && (
                    <Text style={styles.noRequestsText}>No pending or accepted requests found.</Text>
                 )}
            </ScrollView>

             <TabNavigation />
        </View>
    );
}

// --- Styles matching the mockup and palette ---
// Ensure these styles match your visual requirements based on the mockup
const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: PALETTE.lightCream, // Use lightCream from palette
    },
    loadingContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: PALETTE.lightCream,
    },
    scrollContainer: {
        paddingHorizontal: 15, // Consistent horizontal padding
        paddingVertical: 20, // Add vertical padding
        paddingBottom: 90, // Ensure space for tab bar isn't cut off
    },
    browseButton: {
        backgroundColor: PALETTE.darkGreen, // Use lightOrange
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 20, // Slightly less rounded than action buttons maybe
        marginBottom: 25, // Space below
        alignItems: 'center',
        elevation: 2,
        shadowColor: PALETTE.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2,
    },
    browseButtonText: {
        color: PALETTE.white, // Use darkGreen
        fontSize: 20,
        fontFamily: 'Quicksand_700Bold', // Use '600' or 'bold'
    },
    errorText: {
        color: PALETTE.errorRed,
        textAlign: 'center', marginVertical: 15, fontSize: 14
    },
    sectionCard: {
        backgroundColor: PALETTE.lightOrange, // Use lightOrange
        borderRadius: 15, // Mockup looks quite rounded
        padding: 15, // Padding inside the orange card
        marginBottom: 20, // Space between Accepted and Pending cards
        elevation: 2,
        shadowColor: PALETTE.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
    },
    sectionTitle: {
        fontSize:20, // Slightly smaller than mockup? Adjust as needed
        fontFamily: 'Quicksand_700Bold',
        marginBottom: 15, // Space between title and first item
        color: PALETTE.darkGrey, // Use darkGrey
        paddingLeft: 5, // Small indent for title
    },
    requestItemContainer: { // Container for the row + button (if accepted)
        marginBottom: 15, // Space between items in the list
        // Removed background/border from here, applied to coachInfoRow instead
    },
    coachInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PALETTE.lightCream, // Mockup uses white/light background for this part
        padding: 12, // Padding inside the white row
        borderRadius: 20, // Rounded corners for this row
        // Shadow for the white row itself if desired
         elevation: 1,
         shadowColor: PALETTE.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1,
    },
    coachImage: {
        width: 45, height: 45, // Slightly smaller image? Adjust as needed
        borderRadius: 22.5, // half of width/height for circular
        marginRight: 12,
        backgroundColor: PALETTE.grey, // Background color while loading
    },
    coachName: {
        fontSize: 18, // Adjust size
        fontFamily: 'Quicksand_700Bold',
        color: PALETTE.black,
        flex: 1, // Allow text to wrap
    },
    actionButton: { // Base style for action buttons
        paddingVertical: 10,
        borderRadius: 10, // Rounded corners for button
        alignItems: 'center',
        marginTop: 10, // Space between info row and button
        minHeight: 40, // Adjust height
        justifyContent: 'center',
        elevation: 2,
        shadowColor: PALETTE.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2,
    },
    selectButton: {
        backgroundColor: PALETTE.darkGreen, // Use darkGreen
    },
    actionButtonText: {
        color: PALETTE.white, // White text
        fontFamily: 'Quicksand_700Bold',
        fontSize: 14,
    },
    actionButtonDisabled: { // Style for disabled button
        backgroundColor: PALETTE.grey, // Use grey when disabled
        opacity: 0.7,
    },
    noRequestsText: {
        textAlign: 'center', color: PALETTE.darkGrey, marginTop: 40, fontSize: 16, fontStyle: 'italic'
    },
});