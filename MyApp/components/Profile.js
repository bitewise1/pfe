import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import {
    View, Text, Image, TouchableOpacity, Dimensions, ScrollView,
    FlatList, ActivityIndicator, Alert
    // Removed StyleSheet - relying entirely on ./Styles.js
} from 'react-native';
import Header from './Header';
import TabNavigation from './TabNavigation';
import styles from './Styles'; // *** USING YOUR EXISTING STYLES IMPORT ***
import { BarChart } from 'react-native-chart-kit';
import { Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from './AuthContext';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';

// --- BMI Calculation Logic ---
function calculateBmi(weightKg, heightCm) {
    if (!weightKg || !heightCm || heightCm <= 0 || weightKg <= 0) { return { value: 'N/A', category: 'Enter Weight/Height' }; }
    const heightM = heightCm / 100; const bmi = weightKg / (heightM * heightM); const bmiRounded = bmi.toFixed(1);
    let category = ''; if (bmi < 18.5) category = 'Underweight'; else if (bmi < 25) category = 'Normal weight'; else if (bmi < 30) category = 'Overweight'; else category = 'Obese';
    return { value: bmiRounded, category: category };
}
// ----------------------------

export default function Profile() {
    const { user } = useContext(AuthContext);
    const uid = user?.uid;
    console.log("Profile Screen UID:", uid);

    // --- State Variables ---
    const [currentWeight, setCurrentWeight] = useState(0);
    const [startWeight, setStartWeight] = useState(0);
    const [goalWeight, setGoalWeight] = useState(0);
    const [height, setHeight] = useState(0); // Store as fetched (meters)
    // State for the ruler's currently selected value
    const [rulerSelectedValue, setRulerSelectedValue] = useState('70.0');
    // State for the CALORIE chart period and data
    const [selectedChartPeriod, setSelectedChartPeriod] = useState('Week'); // Use this, not 'selected'
    const [chartDisplayData, setChartDisplayData] = useState({ labels: [], datasets: [{ data: [] }] }); // ChartKit format
    // BMI State
    const [bmiValue, setBmiValue] = useState('N/A'); // Use this for BMI Value display
    const [bmiCategory, setBmiCategory] = useState(''); // Use this for BMI Category display

    // Loading/Error States
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [isChartLoading, setIsChartLoading] = useState(false);
    const [isLoggingWeight, setIsLoggingWeight] = useState(false);
    const [profileError, setProfileError] = useState(null); // Use this for profile load error
    const [chartError, setChartError] = useState(null);

    // --- Refs ---
    const rulerListRef = useRef(null);

    // --- Configuration (NO /api prefix) ---
    const API_BASE_URL = 'http://10.0.2.2:3000';
    const USER_API_PATH = '/user';

    const USER_PROFILE_ENDPOINT = `${USER_API_PATH}/${uid}`;
    const CALORIE_HISTORY_ENDPOINT = `${USER_API_PATH}/calorie-history/${uid}`;
    const LOG_WEIGHT_ENDPOINT = `${USER_API_PATH}/log-weight`;

    // --- Ruler Configuration ---
    const screenWidth = Dimensions.get('window').width;
    const itemWidth = 20; // Use this value (or your original 25 if preferred)
    const min = 35; const max = 230; const step = 0.1; // Use 'step' consistently
    // Use 'step' here
    const numbersRuler = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => (min + i * step).toFixed(1));
    // --------------------

    // --- Data Fetching ---
    const fetchUserProfile = useCallback(async (showLoading = true) => {
        if (!uid) { setIsProfileLoading(false); setProfileError("Please log in."); return; }
        if (showLoading) setIsProfileLoading(true); setProfileError(null);
        const url = `${API_BASE_URL}${USER_PROFILE_ENDPOINT}`;
        console.log(`Profile Fetch: ${url}`);
        try {
            const response = await axios.get(url); const fetchedData = response.data;
            const currentWt = parseFloat(fetchedData.weight) || 0;
            const userHt = parseFloat(fetchedData.height) || 0; // Store meters
            setCurrentWeight(currentWt);
            setStartWeight(parseFloat(fetchedData.startWeight) || currentWt || 0);
            setGoalWeight(parseFloat(fetchedData.targetWeight) || 0);
            setHeight(userHt); // Store meters
            setRulerSelectedValue(currentWt > 0 ? currentWt.toFixed(1) : '70.0'); // Initialize ruler
        } catch (err) { console.error("Profile Fetch Error:", err); setProfileError("Failed to load profile details."); }
        finally { if (showLoading) setIsProfileLoading(false); }
    }, [uid, API_BASE_URL, USER_PROFILE_ENDPOINT]);

    const fetchCalorieHistory = useCallback(async (period) => {
        if (!uid) return; setIsChartLoading(true); setChartError(null);
        const url = `${API_BASE_URL}${CALORIE_HISTORY_ENDPOINT}`;
        console.log(`Chart Fetch: ${url}?period=${period}`);
        try {
            const response = await axios.get(url, { params: { period } });
            const historyData = response.data; // Expects { labels:[], datasets:[{data:[]}] }
            if (historyData && Array.isArray(historyData.labels) && Array.isArray(historyData.datasets) && historyData.datasets[0]?.data) {
                setChartDisplayData(historyData);
            } else { /* Handle invalid format */ const placeholders = { Week: { labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'], datasets: [{ data: [] }] }, /*...*/ }; setChartDisplayData(placeholders[period] || { labels: [], datasets: [{ data: [] }] }); setChartError("Invalid chart data."); }
        } catch (err) { console.error(`Chart Fetch Error:`, err); setChartError("Failed chart load."); setChartDisplayData({ labels: ['Error'], datasets: [{ data: [0] }] }); }
        finally { setIsChartLoading(false); }
    }, [uid, API_BASE_URL, CALORIE_HISTORY_ENDPOINT]);

    // --- Effects ---
    useFocusEffect(useCallback(() => { if (uid) { fetchUserProfile(true); fetchCalorieHistory('Week'); } else { /*...*/ } }, [uid, fetchUserProfile, fetchCalorieHistory]));
    useEffect(() => { if (currentWeight > 0 && height > 0) { const heightCm = height * 100; const { value, category } = calculateBmi(currentWeight, heightCm); setBmiValue(value); setBmiCategory(category); } else { setBmiValue('N/A'); setBmiCategory(''); } }, [currentWeight, height]);
    useEffect(() => { if (uid) fetchCalorieHistory(selectedChartPeriod); }, [selectedChartPeriod, uid, fetchCalorieHistory]);

    // --- Action Handlers ---
    const handleLogNewWeight = async () => {
        const newWeight = parseFloat(rulerSelectedValue); // Use state for ruler value
        // Use 'step' for comparison
        if (!uid || !newWeight || newWeight <= 0 || newWeight > 500 || Math.abs(newWeight - currentWeight) < step / 2) {
            if (Math.abs(newWeight - currentWeight) < step / 2 && newWeight > 0) Alert.alert("No Change", "Selected weight is same as current weight.");
            else if (!uid) Alert.alert("Error", "User not identified.");
            else Alert.alert("Invalid Weight", "Please select a valid weight.");
            return;
        }
        const today = new Date(); const dateString = today.toISOString().split('T')[0];
        setIsLoggingWeight(true); const url = `${API_BASE_URL}${LOG_WEIGHT_ENDPOINT}`;
        console.log(`Logging weight to: ${url}`);
        try {
            await axios.post(url, { uid, weight: newWeight, date: dateString });
            Alert.alert("Success", `Weight ${newWeight} kg logged!`);
            setCurrentWeight(newWeight); // Update state -> triggers BMI recalc
        } catch (err) { console.error(`Log Weight Error:`, err); Alert.alert("Error", "Failed to log weight."); }
        finally { setIsLoggingWeight(false); }
    };

    const handleRulerScroll = useCallback((event) => { // Updates ruler state
        const centerOffset = event.nativeEvent.contentOffset.x;
        let index = Math.round(centerOffset / itemWidth);
        index = Math.max(0, Math.min(index, numbersRuler.length - 1));
        if (numbersRuler[index]) setRulerSelectedValue(numbersRuler[index]); // Use specific state setter
    }, [itemWidth, numbersRuler]); // Use correct variable names

    const calculateInitialIndex = () => { // Uses state and 'step'
        const index = numbersRuler.findIndex(num => Math.abs(parseFloat(num) - parseFloat(rulerSelectedValue)) < step / 2);
        return index >= 0 ? index : Math.round(numbersRuler.length / 2);
    };

    // --- Render Logic ---
    // Initial Loading
    if (isProfileLoading) {
        return (
            // Use styles.mainContainer etc.
            <View style={styles.mainContainer}>
                <Header subtitle={'Your Progress at a Glance!'} />
                <TabNavigation />
                <View style={[styles.container, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#2E4A32" />
                </View>
            </View>
        );
    }

    // Initial Load Error
    if (profileError) {
        return (
            <View style={styles.mainContainer}>
                <Header subtitle={'Your Progress at a Glance!'}/>
                <TabNavigation/>
                 {/* Use styles.container, etc. */}
                <View style={[styles.container, { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                    <Ionicons name="alert-circle-outline" size={40} color="#D48A73" />
                    <Text style={{marginTop: 15, fontSize: 16, textAlign: 'center', color: '#333'}}>{profileError}</Text>
                    <Button mode="contained" onPress={() => fetchUserProfile(true)} style={{marginTop: 20}} buttonColor="#2E4A32" labelStyle={{color:'#FFF'}}> Retry </Button>
                 </View>
            </View>
       );
    }

    // Main Render - Using your original structure with updated logic & state
    return (
        <View style={styles.mainContainer}>
            <Header subtitle={'Your Progress at a Glance!'} />
            <TabNavigation/>

            {/* Weight Summary Bar - Displaying state values */}
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems:'center', elevation: 2}}>
                <TouchableOpacity style={{backgroundColor: '#FCCF94', flex: 1, alignItems: 'center', height: 60, justifyContent : 'center', elevation: 2}}>
                    <Text style={styles.goalText}>Start weight</Text>
                    {/* Display state, add kg */}
                    <Text style={styles.remainingValue}>{startWeight > 0 ? `${startWeight.toFixed(1)} kg` : 'N/A'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{backgroundColor: '#2E4A32', flex: 1, alignItems: 'center', height: 60, justifyContent : 'center' , elevation: 2, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#2e4a32'}}>
                    <Text style={[styles.goalText, {color: '#FFFFFF'}]}>Current weight</Text>
                     {/* Display state, add kg */}
                    <Text style={[styles.remainingValue, {color: '#FFFFFF'}]}>{currentWeight > 0 ? `${currentWeight.toFixed(1)} kg` : 'N/A'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{backgroundColor: '#FCCF94', flex: 1, alignItems: 'center', height: 60, justifyContent : 'center', elevation: 2}}>
                    <Text style={styles.goalText}>Goal weight</Text>
                     {/* Display state, add kg */}
                    <Text style={styles.remainingValue}>{goalWeight > 0 ? `${goalWeight.toFixed(1)} kg` : 'N/A'}</Text>
                </TouchableOpacity>
            </View>

            {/* ScrollView - Using your original contentContainerStyle */}
            <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* Chart Section Title - Using styles.caloriesText */}
                <Text style={[styles.caloriesText, { marginVertical: 15 }]}>Calorie Consumption Chart</Text>

                {/* Period Buttons - Using state and handler */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, width: '90%' }}>
                    {['Week', 'Month', 'Year'].map((type) => (
                        <Button
                            key={type}
                            mode={selectedChartPeriod === type ? 'contained' : 'outlined'} // Use correct state variable
                            onPress={() => setSelectedChartPeriod(type)} // Use correct state setter
                            buttonColor={selectedChartPeriod === type ? '#2E4A32' : '#FCCF94'}
                            textColor={selectedChartPeriod === type ? '#fff' : '#2E4A32'}
                            style={{ flex: 1, marginHorizontal: 5 }}
                            disabled={isChartLoading || isLoggingWeight} // Disable correctly
                        >
                        {type}
                        </Button>
                    ))}
                </View>

                {/* Chart Display Wrapper - Using your original inline styles */}
                <View style={{ padding: 20, backgroundColor: '#FCCF94', borderRadius: 10, alignItems: 'center', width:'95%', position: 'relative', minHeight: 340 /* Ensure space for overlays */ }}>
                    {/* Overlays for Loading/Error/No Data */}
                    {isChartLoading && (
                        <View style={styles.chartOverlayProfile || {position: 'absolute', top:0,bottom:0,left:0,right:0, backgroundColor:'rgba(255,255,255,0.7)', justifyContent:'center', alignItems:'center', zIndex:10, borderRadius: 10}}>
                            <ActivityIndicator size="large" color="#2E4A32" />
                        </View>
                    )}
                    {chartError && !isChartLoading && (
                         <View style={styles.chartOverlayMessageProfile || {position: 'absolute', top:0,bottom:0,left:0,right:0, justifyContent:'center', alignItems:'center', zIndex:5, padding: 10, borderRadius: 10}}>
                            <Ionicons name="warning-outline" size={24} color="#8B4513" />
                            <Text style={styles.chartMessageTextProfile || {marginTop:5, textAlign:'center'}}>{chartError}</Text>
                        </View>
                    )}
                    {!isChartLoading && !chartError && chartDisplayData.datasets?.[0]?.data?.length === 0 && (
                         <View style={styles.chartOverlayMessageProfile || {position: 'absolute', top:0,bottom:0,left:0,right:0, justifyContent:'center', alignItems:'center', zIndex:5, padding: 10, borderRadius: 10}}>
                             <Ionicons name="information-circle-outline" size={24} color="#4682B4" />
                             <Text style={styles.chartMessageTextProfile || {marginTop:5, textAlign:'center'}}>No calorie data logged.</Text>
                         </View>
                    )}

                    {/* Actual Chart - Render only when ready */}
                    {!isChartLoading && !chartError && chartDisplayData.labels?.length > 0 && chartDisplayData.datasets?.[0]?.data?.length > 0 && (
                        <BarChart
                            data={chartDisplayData} // Use chart state (correct format)
                            width={screenWidth * 0.85} // Your original width
                            height={300}
                            yAxisSuffix=" kcal" // Suffix for Calories
                            chartConfig={chartConfig} // Use separate config object
                            style={{ borderRadius: 16 }} // Your original style
                            fromZero={false} // Start Y axis based on data
                            showValuesOnTopOfBars={true}
                            verticalLabelRotation={chartDisplayData.labels.length > 7 ? 30 : 0}
                        />
                    )}
                     {/* Remove placeholder text */}
                     {/* <Text style={{ alignSelf: 'center', marginTop: 10, fontStyle: 'italic', color: '#555' }}>(Weight chart coming soon)</Text> */}
                </View>

                {/* Weight Logging Section Title - Using styles.caloriesText */}
                <Text style={[styles.caloriesText, { marginVertical: 15 }]}>Log Today's Weight</Text>

                {/* Ruler Component - Using styles.rulerContainer, selectedValue, etc. */}
                <View style={[styles.rulerContainer, { height: 170 }]}>
                    {/* Display selected value from ruler state */}
                    <Text style={styles.selectedValue}>{rulerSelectedValue} kg</Text>
                    <FlatList
                        ref={rulerListRef}
                        data={numbersRuler} // Use correct data source
                        horizontal
                        snapToAlignment="center"
                        snapToInterval={itemWidth} // Use variable
                        decelerationRate="fast"
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item} // Use item as key
                        initialScrollIndex={calculateInitialIndex()} // Use function
                        getItemLayout={(data, index) => ( {length: itemWidth, offset: itemWidth * index, index} )}
                        // Use your original centering style
                        contentContainerStyle={{ paddingHorizontal: (screenWidth / 2) - (itemWidth / 2) }}
                        renderItem={({ item }) => {
                            const numValue = parseFloat(item);
                             // Use 'step' for tick calculation
                            const isMajorTick = Math.abs(numValue % 5) < (step / 2) || Math.abs(numValue % 5 - 5) < (step / 2);
                            const isMidTick = Math.abs(numValue % 1) < (step / 2) || Math.abs(numValue % 1 - 1) < (step / 2);
                            return (
                                // Use styles.rulerItem
                                <View style={[styles.rulerItem, {width: itemWidth}]}>
                                    {/* Use styles.rulerText */}
                                    <Text style={[styles.rulerText, isMajorTick ? {} : {color: 'transparent'}]}>
                                        {isMajorTick ? Math.round(numValue) : ''}
                                    </Text>
                                    {/* Use styles.line, majorTick, midTick, minorTick */}
                                    <View style={[ styles.line, isMajorTick ? styles.majorTick : (isMidTick ? styles.midTick : styles.minorTick) ]} />
                                </View>
                            );
                        }}
                        onMomentumScrollEnd={handleRulerScroll} // Use correct handler
                    />
                    {/* Center Indicator Line - Use styles.centerIndicator */}
                    <View style={[ styles.centerIndicator, { position: 'absolute', left: '50%', transform: [{ translateX: -1 }] } ]}/>
                </View>

                {/* Validate Button - Use styles.buttonContainer, button, textButton */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, { width: '90%', height: 50 }]}
                        onPress={handleLogNewWeight} // Use correct handler
                        disabled={isLoggingWeight || isChartLoading} // Use correct state
                    >
                         {isLoggingWeight ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.textButton}>Validate New Weight</Text>}
                    </TouchableOpacity>
                </View>

                {/* BMI Section - Use styles.bmiTitle, bmiDescription */}
                <View style={{ marginTop: 20, width: '90%' }}>
                    <Text style={styles.bmiTitle}>Body Mass Index (BMI)</Text>
                    <Text style={styles.bmiDescription}>
                        Quickly checks if your weight is healthy for your height.
                    </Text>
                </View>

                {/* BMI Value Display - Use styles.buttonContainer, button, bmiLabel, bmiValueDisplay */}
                {/* Using View instead of TouchableOpacity if not clickable */}
                <View style={styles.buttonContainer}>
                    <View style={[styles.button, styles.bmiDisplayBox || { width: '90%', backgroundColor: '#FCCF94', height: 50, justifyContent: 'space-between', flexDirection: 'row', paddingHorizontal: 20, alignItems:'center'}]}>
                        <Text style={[styles.bmiLabel, {color: '#333'}]}> BMI Value</Text>
                        {/* Display BMI state value */}
                        <Text style={[styles.bmiValueDisplay, {color: '#333'}]}>{bmiValue}</Text>
                    </View>
                </View>

                {/* BMI Category Display - Use styles.buttonContainer, button, bmiLabel, bmiCategoryDisplay */}
                <View style={styles.buttonContainer}>
                     <View style={[styles.button, styles.bmiDisplayBox || { width: '90%', backgroundColor: '#FCCF94', height: 50, justifyContent: 'space-between', flexDirection: 'row', paddingHorizontal: 20, alignItems:'center'}]}>
                        <Text style={[styles.bmiLabel, {color: '#333'}]}> Category</Text>
                        {/* Display BMI state category */}
                        <Text style={[styles.bmiCategoryDisplay, {color: '#333'}]}>{bmiCategory}</Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

// --- Chart Configuration (For Calorie Chart) ---
const chartConfig = {
    backgroundColor: '#FCCF94', backgroundGradientFrom: '#FCCF94', backgroundGradientTo: '#FCCF94',
    decimalPlaces: 0, // Calories
    color: (opacity = 1) => `rgba(46, 74, 50, ${opacity})`, labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    barPercentage: 0.6, propsForLabels: { fontSize: 11 }, propsForBackgroundLines: { strokeDasharray: "", stroke: "rgba(0, 0, 0, 0.15)" },
    style: { borderRadius: 16 }, formatYLabel: (y) => `${Math.round(parseFloat(y))}`, formatTopBarValue: (value) => `${Math.round(parseFloat(value))}`, barRadius: 4,
};

// No local StyleSheet.create - relying on styles from ./Styles.js