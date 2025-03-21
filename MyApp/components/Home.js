import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import styles from './Styles'
import Header from './Header';
import TabNavigation from './TabNavigation';
import {ProgressChart} from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Divider } from 'react-native-paper';
import { Bar } from 'react-native-progress';
export default function Home() {
    const [remainingValue, setRemainingValue] = useState('0')
    const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    const navigation = useNavigation();
    const [carbsGoal, setCarbsGoal] = useState(0);
    const [proteinGoal, setProteinGoal] = useState(0);
    const [fatGoal, setFatGoal] = useState(0);
    const [fiberGoal, setFiberGoal] = useState(0);
    const [carbsProgress, setCarbsProgress] = useState(0);
    const [proteinProgress, setProteinProgress] = useState(0);
    const [fatProgress, setFatProgress] = useState(0);
    const [fiberProgress, setFiberProgress] = useState(0);
    const [goal, setGoal] = useState('Losing Weight');
    const progressBar = (progress, goal) =>{
      return goal - progress;
    }
  return (
    <View style={styles.mainContainer}>
      <Header subtitle={`Hello! Ready to 
achieve your goals?`}/>
      <TabNavigation />
    <ScrollView showsVerticalScrollIndicator={false}>
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <View style={{position: 'absolute', top: 0, right: 0, backgroundColor:'#88A76C', borderBottomLeftRadius: 20, borderTopRightRadius: 20, height: 40, width: 140, alignItems: 'center', justifyContent: 'center'}}>
           <Text style={styles.chartText}>{goal}</Text>
        </View>
        <Text style={styles.caloriesText}>Calories</Text>
        <Text style={styles.caloriesSubText}>Remaining = Goal - Food Calories Consumed</Text>
      
        
        <View style={{flexDirection: 'row', justifyContent: 'space-between' }} > 
        <View style={{position: 'relative'}}>
         <ProgressChart data={{data: [0]}}
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
         <View style={{position: 'absolute', top: '25%', left: '25%', alignItems: 'center'}}>
          <Text style= {styles.goalText}>Remaining</Text>
          <Text style= {styles.remainingValue} >{remainingValue}</Text>
         </View>
        </View>
         <View style={{flexDirection:'column'}}>
         <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Image source={require('../assets/Images/BaseGoal.png')} />
            <View >
               <Text style={[styles.remaining, {marginTop: 10}]}>Base Goal</Text>
               <Text style={styles.remainingValue}>2000 Cal</Text>
            </View>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
               <Image source={require('../assets/Images/Food.png')} />
            <View>
               <Text style={styles.remaining}>Food</Text>
               <Text style={styles.remainingValue}>1400</Text>
            </View>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Image source={require('../assets/Images/Streak.png')} />
            <View>
                 <Text style={styles.remaining}>Streak</Text>
                <Text style={styles.remainingValue}>3 days</Text>
            </View>
        </View>
        
    </View> 
    </View>
    <Divider style={styles.Divider} />
    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
    <View style={{flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start'}}>
      <View style={{flexDirection: 'row', marginBottom: 10, marginHorizontal:10}}>
         <Image source={require('../assets/Images/carbs.png')}/>
         <Text style={styles.remaining}>Carbs</Text>
      </View>
    
        <Bar
        progress={progressBar(carbsProgress, carbsGoal)}
        width={70}
        height={10}
        color={'#D48A73'} 
        borderWidth={0}
        unfilledColor={'white'}
        />
         <Text style={{ marginTop: 10 }}>{`${carbsProgress} / ${carbsGoal}g`}</Text>
      
     </View>
     <View style={{flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start'}}>
      <View style={{flexDirection: 'row', marginBottom: 10, marginHorizontal:10}}>
         <Image source={require('../assets/Images/Protein.png')}/>
         <Text style={styles.remaining}>Protein</Text>
      </View>
         <Bar
        progress={progressBar(proteinProgress, proteinGoal)}
        width={70}
        height={10}
        color={'#D48A73'} 
        borderWidth={0}
        unfilledColor={'white'}
      />
      <Text style={{ marginTop: 10 }}>{`${proteinProgress} / ${proteinGoal}g`}</Text>
      
      </View>
      <View style={{flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start'}}>
       <View style={{flexDirection: 'row', marginBottom: 10, marginHorizontal:10}}>
         <Image source={require('../assets/Images/Fat.png')}/>
         <Text style={styles.remaining}>Fat</Text>
         </View>
        <View style={{justifyContent: 'center', alignItems: 'center' }}>
         <Bar
        progress={progressBar(fatProgress, fatGoal)}
        width={70}
        height={10}
        color={'#D48A73'} 
        borderWidth={0}
        unfilledColor={'white'}
      />
      </View>
      <Text style={{ marginTop: 10 }}>{`${fatProgress} / ${fatGoal}g`}</Text>
      
      
      </View>
      <View style={{flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
       <View style={{flexDirection: 'row', marginBottom: 10, marginHorizontal:10}}>
         <Image source={require('../assets/Images/DietaryFiber.png')}/>
         <Text style={styles.remaining}>Dietary Fiber</Text>
         </View>
         <Bar
        progress={progressBar(fiberProgress, fiberGoal)}
        width={70}
        height={10}
        color={'#FF6347'} 
        borderWidth={0}
        unfilledColor={'white'}
      />
      <Text style={{ marginTop: 10 }}>{`${fiberProgress} / ${fiberGoal}g`}</Text>
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
