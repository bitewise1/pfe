import React, { useEffect, useState, useContext, useCallback } from 'react'; // Added useCallback
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'; // Added ActivityIndicator
import styles from './Styles'; // YOUR EXISTING STYLES
import Header from './Header'; // Your Header
import TabNavigation from './TabNavigation'; // Your TabNavigation
import { ProgressChart } from 'react-native-chart-kit';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // Removed useRoute, Added useFocusEffect
import { Ionicons } from '@expo/vector-icons';
import { Divider } from 'react-native-paper';
import { Bar } from 'react-native-progress';
import axios from 'axios';
import { AuthContext } from '../components/AuthContext'; // Adjust path if needed

// Helper to get today's date string
const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
};

// Default empty structures
const defaultPlan = { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: { recommended: 0 }, goal: '' };
const defaultConsumed = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

export default function Home() {
  const { user } = useContext(AuthContext);
  // UID now primarily from context
  const [uid, setUid] = useState(user?.uid || null);
  const navigation = useNavigation();

  // --- STATE MANAGEMENT ---
  // Keep 'plan' state for goals
  const [plan, setPlan] = useState(defaultPlan);
  // Add state for fetched consumed totals
  const [consumedTotals, setConsumedTotals] = useState(defaultConsumed);
  // Add state for streak
  const [streak, setStreak] = useState(0);
  // Keep state for user's goal text
  const [userGoalText, setUserGoalText] = useState(''); // Use user?.goal as initial?
  // Add Loading state
  const [isLoading, setIsLoading] = useState(true);
  // REMOVED: consumedCalories, carbsProgress, proteinProgress, fatProgress, fiberProgress, preferences
  // REMOVED: route = useRoute()

  // --- CONFIGURATION ---
  const API_BASE_URL = 'http://10.0.2.2:3000';
  // !!! IMPORTANT: Set this to your correct backend path !!!
  const DAILY_DATA_ENDPOINT = '/logMeal/daily-data'; // Or '/nutrition/daily-data'
  // --------------------

  const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']; // Your meals array

  // Update UID from context
  useEffect(() => {
    // This effect ensures UID is updated if the user logs in/out AFTER component mounts
    if (user?.uid && user.uid !== uid) {
      console.log("Home: Setting UID from context:", user.uid);
      setUid(user.uid);
    } else if (!user?.uid && uid !== null) {
      // Only reset if UID was previously set and now user is null
      console.log("Home: Clearing UID and resetting data due to user logout/null.");
      setUid(null);
      setPlan(defaultPlan);
      setConsumedTotals(defaultConsumed);
      setStreak(0);
      setUserGoalText('');
      setIsLoading(false); // Stop loading if user logs out
    }
  }, [user, uid]); // Depend on user context and internal uid state

  // --- DATA FETCHING ---
  const fetchCombinedData = useCallback(async () => {
    if (!uid) {
      console.log("fetchCombinedData skipped: No UID.");
      setIsLoading(false); // Ensure loading stops if no UID
      return; // Don't fetch if no user
    }

    console.log(`Home: Fetching data for UID: ${uid}`);
    setIsLoading(true); // Start loading
    const todayDate = getTodayDateString();
    const url = `${API_BASE_URL}${DAILY_DATA_ENDPOINT}/${uid}/${todayDate}`;

    try {
      const response = await axios.get(url);
      const data = response.data;

      if (data.success) {
        console.log("Home: Received combined data:", data);
        setPlan(data.nutritionPlan || defaultPlan);
        setConsumedTotals(data.consumedTotals || defaultConsumed);
        setStreak(data.streak || 0);
        // Get goal text from the fetched plan data, or fallback
        setUserGoalText(data.nutritionPlan?.goal || user?.goal || 'Set Goal');
      } else {
        console.warn("Home: Backend fetch reported success:false", data);
        // Reset to defaults on failure
        setPlan(defaultPlan);
        setConsumedTotals(defaultConsumed);
        setStreak(0);
        setUserGoalText(user?.goal || 'Set Goal');
      }
    } catch (err) {
      console.error('Home: Error loading combined daily data:', err.response ? JSON.stringify(err.response.data) : err.message);
       // Reset to defaults on any error (e.g., 404 if user log not found)
       setPlan(defaultPlan);
       setConsumedTotals(defaultConsumed);
       setStreak(0);
       setUserGoalText(user?.goal || 'Set Goal');
    } finally {
      setIsLoading(false); // Stop loading
    }
  }, [uid, user?.goal]); // Dependencies for useCallback

  // --- Use useFocusEffect to fetch data when screen is focused ---
  useFocusEffect(
    useCallback(() => {
      if (uid) { // Only fetch if UID exists
        console.log("Home screen focused, fetching combined data...");
        fetchCombinedData();
      } else {
        console.log("Home screen focused, but no UID. Skipping fetch.");
        setIsLoading(false); // Ensure loading is off if no UID
      }
    }, [fetchCombinedData, uid]) // Dependencies for useFocusEffect's callback
  );

  // --- Calculations for UI display ---
  // Use plan state for goals
  const goalCalories = plan?.calories || 0;
  const goalCarbs = plan?.carbs || 0;
  const goalProtein = plan?.protein || 0;
  const goalFat = plan?.fat || 0;
  const goalFiber = plan?.fiber?.recommended || 0; // Use recommended fiber goal

  // Use consumedTotals state for consumed values
  const consumedCals = consumedTotals?.calories || 0;
  const consumedCarbs = consumedTotals?.carbs || 0;
  const consumedProtein = consumedTotals?.protein || 0;
  const consumedFat = consumedTotals?.fat || 0;
  const consumedFiber = consumedTotals?.fiber || 0;

  // Calculate remaining and progress
  const remainingCalories = Math.max(0, goalCalories - consumedCals);
  const calorieProgress = goalCalories > 0 ? Math.min(consumedCals / goalCalories, 1) : 0;

  // Your original progressBar function - keep it
  const progressBar = (consumed, goal) => {
    const numericGoal = Number(goal) || 0;
    const numericConsumed = Number(consumed) || 0;
    if (numericGoal <= 0) return 0;
    return Math.min(numericConsumed / numericGoal, 1); // Cap at 100%
  };


  // --- RENDER LOGIC ---

  // Loading State
  if (isLoading && uid) { // Show loading only when we have a UID and are fetching
    return (
      <View style={styles.mainContainer}>
        <Header subtitle={`Hello! Ready to\nachieve your goals?`} />
        <TabNavigation />
        <View style={[styles.container, {flex: 1, justifyContent: 'center', alignItems: 'center'}]}>
          <ActivityIndicator size="large" color="#2E4A32" />
           <Text style={{marginTop: 10, color: '#555'}}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  // No User State
  if (!uid) {
    return (
      <View style={styles.mainContainer}>
        <Header subtitle={`Hello! Ready to\nachieve your goals?`} />
        <TabNavigation />
        <View style={[styles.container, {flex: 1, justifyContent: 'center', alignItems: 'center'}]}>
          <Text style={styles.centeredMessageText || {fontSize: 18, textAlign: 'center'}}>Please log in to view your dashboard.</Text>
        </View>
      </View>
    );
  }

  // --- Main component render (Using YOUR original JSX structure) ---
  return (
    <View style={styles.mainContainer}>
      <Header subtitle={`Hello! Ready to
achieve your goals?`} />
      <TabNavigation />
      {/* Added contentContainerStyle for padding */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.container}>
          {/* --- Chart Area --- */}
          <View style={styles.chartContainer}>
            {/* Goal Chip - Uses userGoalText state */}
            <View style={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#88A76C', borderBottomLeftRadius: 20, borderTopRightRadius: 20, height: 40, width: 140, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.chartText}>{userGoalText || 'Set Goal'}</Text>
            </View>
            {/* Titles - Kept your original text */}
            <Text style={styles.caloriesText}>Today's goal </Text>
            <Text style={styles.caloriesSubText}>Remaining = Goal - Food Calories Consumed</Text>

            {/* Chart and Text Breakdown Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' /* Ensure vertical alignment */ }}>
              {/* Chart */}
              <View style={{ position: 'relative' }}>
                <ProgressChart
                  data={{ data: [calorieProgress] }} // UPDATE: Use calculated progress
                  width={150}
                  height={150}
                  strokeWidth={9}
                  radius={55}
                  chartConfig={ styles.chartConfig || { // Use your styles.chartConfig if defined, otherwise default
                    backgroundColor: '#FCCF94',
                    backgroundGradientFrom: '#FCCF94',
                    backgroundGradientTo: '#FCCF94',
                    color: (opacity = 1) => `rgba(212, 138, 115, ${opacity})`,
                    propsForLabels: {fontSize: 0} // Hides the default percentage label
                  }}
                  hideLegend={true}
                />
                {/* Text inside chart */}
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={styles.goalText}>Remaining</Text>
                  <Text style={styles.remainingValue}>{remainingCalories.toFixed(0)}</Text> {/* UPDATE: Use calculated remaining */}
                  {/* Optional: Add kcal unit style if desired */}
                  {/* <Text style={styles.kcalText}>kcal</Text> */}
                </View>
              </View>
              {/* Text breakdown */}
              {/* Adjusted justifyContent and height for potentially better alignment */}
              <View style={{ flexDirection: 'column', justifyContent: 'space-around', height: 150 }}>
                {/* Goal */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={require('../assets/Images/BaseGoal.png')} />
                  {/* Added marginLeft for spacing */}
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.remaining}>Base Goal</Text>
                    <Text style={styles.remainingValue}>{goalCalories.toFixed(0)} kcal</Text> {/* UPDATE: Use goal from plan state */}
                  </View>
                </View>
                {/* Consumed */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={require('../assets/Images/Food.png')} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.remaining}>Consumed</Text>
                    <Text style={styles.remainingValue}>{consumedCals.toFixed(0)}</Text> {/* UPDATE: Use consumed from state */}
                    {/* Optional: Add kcal unit */}
                    {/* <Text style={styles.unitText}>kcal</Text> */}
                  </View>
                </View>
                {/* Streak */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={require('../assets/Images/Streak.png')} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.remaining}>Streak</Text>
                    <Text style={styles.remainingValue}>{streak} {streak === 1 ? 'day' : 'days'}</Text> {/* UPDATE: Use streak from state */}
                  </View>
                </View>
              </View>
            </View>

            <Divider style={styles.Divider} />

            {/* --- Macro Bars Area (Keep your layout) --- */}
            {/* Adjusted justifyContent */}
            <View style={{ flexDirection: 'column', width: '100%', marginTop: 15 }}>
{/* Titles Row */}
<View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10 }}>
  {/* Carbs */}
  <View style={{ alignItems: 'center', flex: 1 }}>
    <Text style={styles.remaining}>Carbs</Text>
  </View>

  {/* Protein */}
  <View style={{ alignItems: 'center', flex: 1 }}>
    <Text style={styles.remaining}>Protein</Text>
  </View>

  {/* Fat */}
  <View style={{ alignItems: 'center', flex: 1 }}>
    <Text style={styles.remaining}>Fat</Text>
  </View>

  {/* Fiber */}
  <View style={{ alignItems: 'center', flex: 1 }}>
    <Text style={styles.remaining}>Fiber</Text>
  </View>
</View>

{/* Progress Bars Row */}
<View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10 }}>
  {/* Carbs Bar */}
  <View style={{ flex: 1, alignItems: 'center' }}>
    <Bar
      progress={progressBar(consumedCarbs, goalCarbs)}  // Ensure valid progress calculation
      width={70}
      height={10}
      color={'#D48A73'}
      borderWidth={0}
      unfilledColor={'white'}
    />
    <Text style={{ marginTop: 10 }}>{`${consumedCarbs.toFixed(0)} / ${goalCarbs}g`}</Text>
  </View>

  {/* Protein Bar */}
  <View style={{ flex: 1, alignItems: 'center' }}>
    <Bar
      progress={progressBar(consumedProtein, goalProtein)}  // Ensure valid progress calculation
      width={70}
      height={10}
      color={'#D48A73'}
      borderWidth={0}
      unfilledColor={'white'}
    />
    <Text style={{ marginTop: 10 }}>{`${consumedProtein.toFixed(0)} / ${goalProtein}g`}</Text>
  </View>

  {/* Fat Bar */}
  <View style={{ flex: 1, alignItems: 'center' }}>
    <Bar
      progress={progressBar(consumedFat, goalFat)}  // Ensure valid progress calculation
      width={70}
      height={10}
      color={'#D48A73'}
      borderWidth={0}
      unfilledColor={'white'}
    />
    <Text style={{ marginTop: 10 }}>{`${consumedFat.toFixed(0)} / ${goalFat}g`}</Text>
  </View>

  {/* Fiber Bar */}
  <View style={{ flex: 1, alignItems: 'center' }}>
    <Bar
      progress={progressBar(consumedFiber, goalFiber)}  // Ensure valid progress calculation
      width={70}
      height={10}
      color={'#D48A73'}
      borderWidth={0}
      unfilledColor={'white'}
    />
    <Text style={{ marginTop: 10 }}>{`${consumedFiber.toFixed(1)} / ${goalFiber}g`}</Text>
  </View>
</View>
</View>

          </View>

          {/* --- Buttons Area (Keep original structure) --- */}
          <View style={styles.buttonHomeContainer}>
            {/* Nutrition Plan Button */}
            <TouchableOpacity style={[styles.homeButton, { backgroundColor: '#88A76C' }]} onPress={() => navigation.navigate('NutritionPlan')}>
              <Text style={[styles.buttonHomeText, { color: 'white' }]}>My Nutrition Plan</Text>
            </TouchableOpacity>
            {/* Meal Buttons */}
            {meals.map((meal, index) => (
              <TouchableOpacity
                // UPDATE: Pass meal type parameter to AddMeal screen
                onPress={() => navigation.navigate('AddMeal', { mealType: meal })}
                key={index}
                style={[styles.homeButton, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
              >
                <Text style={styles.buttonHomeText}>{meal}</Text>
                <Ionicons name="add-circle-outline" size={24} color="black" style={styles.addIcon} />
              </TouchableOpacity>
            ))}
          </View>

          {/* --- Activity Area (Keep original structure) --- */}
          <View style={styles.activityContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
              <Image source={require('../assets/Images/SportyPear.png')} style={styles.sportyPear} />
              <Text style={[styles.caloriesText, { paddingTop: 10 }]}>Activities</Text>
            </View>
            <TouchableOpacity style={[styles.button, { marginVertical: 25 }]} onPress={() => navigation.navigate('ActivityScreen')}>
              <Text style={[styles.buttonHomeText, { color: 'white' }]}>Log Today's Activity</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

// --- Styles ---
// Ensure your ./Styles.js file contains all the necessary styles used above,
// like mainContainer, container, chartContainer, chartText, caloriesText,
// caloriesSubText, goalText, remainingValue, remaining, Divider, macroIcon (if used),
// buttonHomeContainer, homeButton, buttonHomeText, addIcon, activityContainer,
// sportyPear, button, centeredMessageText, etc.
// You might need to add styles like kcalText if you add units.