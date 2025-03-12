import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import styles from './Styles'
import Header from './Header';
import TabNavigation from './TabNavigation';
import {ProgressChart} from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function Home() {
    const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    const navigation = useNavigation();
  return (
    <View style={styles.mainContainer}>
      <Header subtitle={`Hello! Ready to 
achieve your goals?`}/>
      <TabNavigation />
    <ScrollView showsVerticalScrollIndicator={false}>
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Text style={styles.caloriesText}>Calories</Text>
        <Text style={styles.caloriesSubText}>Remaining = Goal - Food Calories Consumed</Text>
      
        
        <View style={{flexDirection: 'row'}} > 
         <View style={{ marginRight: 16 }}>
         <ProgressChart data={{data: [0.7]}}
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
        
         hideLegend={true}/>
         
         <View style={{flexDirection:'column'}}>
         <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
            <Image source={require('../assets/Images/BaseGoal.png')} />
            <View>
               <Text style={styles.goalText}>Base Goal</Text>
               <Text style={styles.goalSubText}>2000 Calories</Text>
            </View>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
               <Image source={require('../assets/Images/Food.png')} />
            <View>
               <Text style={styles.goalText}>Food</Text>
               <Text style={styles.goalSubText}>1400</Text>
            </View>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Image source={require('../assets/Images/Streak.png')} />
            <View>
                 <Text style={styles.goalText}>Streak</Text>
                <Text style={styles.goalSubText}>3 days</Text>
            </View>
        </View>
        
    </View> 
    </View>
    </View>
    </View>
  <View style={styles.buttonHomeContainer}>
    <TouchableOpacity style={[styles.homeButton, {backgroundColor: '#88A76C'}] } onPress={() => navigation.navigate('NutritionPlan')}>
        <Text style={[styles.buttonHomeText, {color: 'white'}]}>My Nutrition Plan</Text>
        
    </TouchableOpacity>
    {meals.map ((meals, index) => (
       <TouchableOpacity 
       onPress={()=>navigation.navigate('AddMeal')}
       key={index}
       style={[styles.homeButton, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}]}>
              <Text style={styles.buttonHomeText}>{meals}</Text>
              <Ionicons name="add-circle-outline" size={24} color="black" style={styles.addIcon}/>
      </TouchableOpacity>
    ))}
  </View>
  <View style={styles.activityContainer}>
    <View style={{flexDirection: 'row', justifyContent: 'flex-start'}}>
        <Image source={require('../assets/Images/SportyPear.png')} style={styles.sportyPear}/>
        <Text style={[styles.caloriesText, {paddingTop: 10}]}>Activities</Text>
    </View>
    <TouchableOpacity style={[styles.button, {marginVertical: 25}]} onPress={()=> navigation.navigate('ActivityScreen')} >
        <Text style={[styles.buttonHomeText, {color: 'white'}]}>Log Today's Activity</Text>
    </TouchableOpacity>

  </View>
    </View>
    </ScrollView>
    </View>
  );
}
