import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Image, 
  ScrollView, 
  TouchableOpacity ,
  Alert
} from 'react-native';
import styles from './Styles';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../components/AuthContext';
import { useContext } from 'react';
import Animated, { 
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInLeft,
  Easing 
} from 'react-native-reanimated';
import axios from 'axios';
import LottieView from 'lottie-react-native';

const API_BASE_URL = 'http://10.0.2.2:3000'; // Replace with your actual backend URL


const EstimationScreen = ({ route }) => {
  const { user } = useContext(AuthContext);
  const uid = route?.params?.uid || user?.uid;
  const [userData, setUserData] = useState(null);
  const [nutritionPlan, setNutritionPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    
    const fetchUserAndPlan = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch user data from backend
        const userResponse = await axios.get(`${API_BASE_URL}/user/${uid}`);
        const userData = userResponse.data;
        setUserData(userData);
        
        // 2. Get or create nutrition plan from backend
        const planResponse = await axios.put(`${API_BASE_URL}/nutritionPlan/${uid}`);
        console.log('Plan response:', planResponse.data);
        const calculatedPlan = planResponse.data.nutritionPlan;
        setNutritionPlan(calculatedPlan);
        
      } catch (error) {
        console.error("Error:", error);
        Alert.alert("Error", "Failed to load nutrition plan");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndPlan();
  }, [uid]);

  return (
    <ScrollView 
      contentContainerStyle={styles.containerEstim}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity onPress={() => navigation.goBack() } style={styles.backButton}>
        <Ionicons name="arrow-back" size={38}/>
      </TouchableOpacity>
     
      <Image source={require('../assets/Images/leaf.png')} style= {styles.topLeaf}/>
      <Image source={require('../assets/Images/leaf.png')} style= {styles.bottomLeaf}/>


      {/* Title with Staggered Animation */}
      <Animated.View entering={FadeInUp.duration(800).delay(200)}>
        <Text style={styles.cardTitleEstim}>Your Daily Goal</Text>
      </Animated.View>

      {/* User Card with Animation */}
      <Animated.View 
        style={styles.userCardEstim}
        entering={FadeInDown.duration(600).delay(300)}
      >
        <Text style={styles.userNameEstim}>{userData?.firstName}'s Plan</Text>
        <View style={styles.userStats}>
          <Text style={styles.statText}>Goal: {userData?.goal}</Text>
          <Text style={styles.statText}>Activity: {userData?.activityLevel}</Text>
        </View>
      </Animated.View>

      {/* Nutrition Targets Card with Staggered Animation */}
      <Animated.View 
        style={styles.targetsCard}
        entering={FadeInUp.duration(600).delay(400)}
      >
        <Text style={styles.cardHeaderEstim}>Daily Targets</Text>
        
        {/* Calories */}
        <Animated.View 
          style={styles.targetRow}
          entering={FadeInDown.duration(500).delay(500)}
        >
          <View style={styles.metricLabel}>
            <Ionicons name="flame" size={20} color="#FF6B6B" style={styles.metricIcon} />
            <Text style={styles.labelText}>Calories</Text>
          </View>
          <Text style={styles.targetValue}>{nutritionPlan?.calories} kcal</Text>
        </Animated.View>

        {/* Protein */}
        <Animated.View 
          style={styles.targetRow}
          entering={FadeInDown.duration(500).delay(550)}
        >
          <View style={styles.metricLabel}>
            <Ionicons name="barbell" size={18} color="#4A90E2" style={styles.metricIcon} />
            <Text style={styles.labelText}>Protein</Text>
          </View>
          <Text style={styles.targetValue}>{nutritionPlan?.protein}g</Text>
        </Animated.View>

        {/* Carbs */}
        <Animated.View 
          style={styles.targetRow}
          entering={FadeInDown.duration(500).delay(600)}
        >
          <View style={styles.metricLabel}>
            <Ionicons name="nutrition" size={18} color="#F5A623" style={styles.metricIcon} />
            <Text style={styles.labelText}>Carbs</Text>
          </View>
          <Text style={styles.targetValue}>{nutritionPlan?.carbs}g</Text>
        </Animated.View>

        {/* Fat */}
        <Animated.View 
          style={styles.targetRow}
          entering={FadeInDown.duration(500).delay(650)}
        >
          <View style={styles.metricLabel}>
            <Ionicons name="water" size={18} color="#7ED321" style={styles.metricIcon} />
            <Text style={styles.labelText}>Fat</Text>
          </View>
          <Text style={styles.targetValue}>{nutritionPlan?.fat}g</Text>
        </Animated.View>

        {/* Fiber */}
        <Animated.View 
          style={[styles.targetRow, styles.fiberRow]}
          entering={FadeInDown.duration(500).delay(700)}
        >
          <View style={styles.metricLabel}>
            <Ionicons name="leaf" size={18} color="#50E3C2" style={styles.metricIcon} />
            <Text style={styles.labelText}>Fiber</Text>
          </View>
          <View style={styles.fiberGoalEs}>
            <Text style={styles.targetValue}>{nutritionPlan?.fiber.recommended}g</Text>
            <Text style={styles.goalRange}>(goal: {nutritionPlan?.fiber.min}-{nutritionPlan?.fiber.max}g)</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Animated Action Button */}
      <Animated.View
        entering={FadeInUp.duration(800).delay(800)}
      >
        <TouchableOpacity 
          style={styles.button}
          onPress={() => {
            if (!nutritionPlan) {
              Alert.alert("Error", "Nutrition data not loaded yet");
              return;
            }
            navigation.navigate('Home', {
              uid,
              plan: nutritionPlan, // This is now guaranteed to exist
              preferences: userData?.dietaryPreferences || [],
              userGoal: userData?.goal
            });
          }}
        >
          <Text style={styles.textButton}>Get Started</Text>
          
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
};


export default EstimationScreen;