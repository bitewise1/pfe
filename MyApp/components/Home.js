import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import styles from './Styles';
import Header from './Header';
import TabNavigation from './TabNavigation';
import { ProgressChart } from 'react-native-chart-kit';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Divider } from 'react-native-paper';
import { Bar } from 'react-native-progress';
import axios from 'axios';
import { AuthContext } from '../components/AuthContext';

export default function Home() {
  const { user } = useContext(AuthContext);
  const route = useRoute();
  const [uid, setUid] = useState(null);

  useEffect(() => {
    if (route.params?.uid) {
      setUid(route.params.uid);
    } else if (user?.uid) {
      setUid(user.uid);
    }
  }, [route.params, user]);
  
  console.log("This screen is used by:", uid);

  const API_BASE_URL = 'http://10.0.2.2:3000';
  const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  const navigation = useNavigation();

  const [consumedCalories, setConsumedCalories] = useState(0);
  const [plan, setPlan] = useState({
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    fiber: { recommended: 0 }
  });
  const [userGoal, setUserGoal] = useState(route.params?.userGoal || '');
  const [preferences, setPreferences] = useState(route.params?.preferences || []);
  const [carbsProgress, setCarbsProgress] = useState(0);
  const [proteinProgress, setProteinProgress] = useState(0);
  const [fatProgress, setFatProgress] = useState(0);
  const [fiberProgress, setFiberProgress] = useState(0);

  const progressBar = (progress, goal) => {
    if (!goal || goal === 0) return 0;
    return Math.min(progress / goal, 1);
  };

  useEffect(() => {
    if (!uid) return;
  
    const fetchData = async () => {
      try {
        const userRes = await axios.get(`http://10.0.2.2:3000/user/${uid}`);
        const userData = userRes.data;
  
        setUserGoal(userData.goal || '');
        setPreferences(userData.dietaryPreferences || []);
        setPlan(userData.nutritionPlan || {});
      } catch (err) {
        console.error('Error loading user data:', err);
      }
    };
  
    fetchData();
  }, [uid]);
  
  return (
    <View style={styles.mainContainer}>
      <Header subtitle={`Hello! Ready to 
achieve your goals?`} />
      <TabNavigation />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.chartContainer}>
            <View style={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#88A76C', borderBottomLeftRadius: 20, borderTopRightRadius: 20, height: 40, width: 140, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.chartText}>{userGoal || 'Your Goal'}</Text>
            </View>
            <Text style={styles.caloriesText}>Today's goal </Text>
            <Text style={styles.caloriesSubText}>Remaining = Goal - Food Calories Consumed</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ position: 'relative' }}>
                <ProgressChart
                  data={{ data: [0] }}
                  width={150}
                  height={150}
                  strokeWidth={9}
                  radius={55}
                  chartConfig={{
                    backgroundColor: '#FCCF94',
                    backgroundGradientFrom: '#FCCF94',
                    backgroundGradientTo: '#FCCF94',
                    color: (opacity = 1) => `rgba(212, 138, 115, ${opacity})`
                  }}
                  hideLegend={true}
                />
                <View style={{ position: 'absolute', top: '25%', left: '25%', alignItems: 'center' }}>
                  <Text style={styles.goalText}>Remaining</Text>
                  <Text style={styles.remainingValue}>{plan.calories ?? 0}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'column' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={require('../assets/Images/BaseGoal.png')} />
                  <View>
                    <Text style={[styles.remaining, { marginTop: 10 }]}>Base Goal</Text>
                    <Text style={styles.remainingValue}>{plan.calories ?? 0} kcal</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={require('../assets/Images/Food.png')} />
                  <View>
                    <Text style={styles.remaining}>Food</Text>
                    <Text style={styles.remainingValue}>1400</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={require('../assets/Images/Streak.png')} />
                  <View>
                    <Text style={styles.remaining}>Streak</Text>
                    <Text style={styles.remainingValue}>3 days</Text>
                  </View>
                </View>
              </View>
            </View>

            <Divider style={styles.Divider} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                <View style={{ flexDirection: 'row', marginBottom: 10, marginHorizontal: 10 }}>
                  <Image source={require('../assets/Images/carbs.png')} />
                  <Text style={styles.remaining}>Carbs</Text>
                </View>
                <Bar
                  progress={progressBar(carbsProgress, plan.carbs ?? 1)}
                  width={70}
                  height={10}
                  color={'#D48A73'}
                  borderWidth={0}
                  unfilledColor={'white'}
                />
                <Text style={{ marginTop: 10 }}>{`${carbsProgress} / ${plan.carbs ?? 0}g`}</Text>
              </View>

              <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                <View style={{ flexDirection: 'row', marginBottom: 10, marginHorizontal: 10 }}>
                  <Image source={require('../assets/Images/Protein.png')} />
                  <Text style={styles.remaining}>Protein</Text>
                </View>
                <Bar
                  progress={progressBar(proteinProgress, plan.protein ?? 1)}
                  width={70}
                  height={10}
                  color={'#D48A73'}
                  borderWidth={0}
                  unfilledColor={'white'}
                />
                <Text style={{ marginTop: 10 }}>{`${proteinProgress} / ${plan.protein ?? 0}g`}</Text>
              </View>

              <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                <View style={{ flexDirection: 'row', marginBottom: 10, marginHorizontal: 10 }}>
                  <Image source={require('../assets/Images/Fat.png')} />
                  <Text style={styles.remaining}>Fat</Text>
                </View>
                <Bar
                  progress={progressBar(fatProgress, plan.fat ?? 1)}
                  width={70}
                  height={10}
                  color={'#D48A73'}
                  borderWidth={0}
                  unfilledColor={'white'}
                />
                <Text style={{ marginTop: 10 }}>{`${fatProgress} / ${plan.fat ?? 0}g`}</Text>
              </View>

              <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', marginBottom: 10, marginHorizontal: 10 }}>
                  <Image source={require('../assets/Images/DietaryFiber.png')} />
                  <Text style={styles.remaining}>Dietary Fiber</Text>
                </View>
                <Bar
                  progress={progressBar(fiberProgress, plan.fiber?.recommended ?? 1)}
                  width={70}
                  height={10}
                  color={'#FF6347'}
                  borderWidth={0}
                  unfilledColor={'white'}
                />
                <Text style={{ marginTop: 10 }}>{`${fiberProgress} / ${plan.fiber?.recommended ?? 0}g`}</Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonHomeContainer}>
            <TouchableOpacity style={[styles.homeButton, { backgroundColor: '#88A76C' }]} onPress={() => navigation.navigate('NutritionPlan')}>
              <Text style={[styles.buttonHomeText, { color: 'white' }]}>My Nutrition Plan</Text>
            </TouchableOpacity>
            {meals.map((meal, index) => (
              <TouchableOpacity
                onPress={() => navigation.navigate('AddMeal')}
                key={index}
                style={[styles.homeButton, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
              >
                <Text style={styles.buttonHomeText}>{meal}</Text>
                <Ionicons name="add-circle-outline" size={24} color="black" style={styles.addIcon} />
              </TouchableOpacity>
            ))}
          </View>

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
