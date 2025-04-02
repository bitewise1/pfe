import React from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, ScrollView, FlatList  } from 'react-native';
import Header from './Header';
import TabNavigation from './TabNavigation';
import styles from './Styles';
import { useState } from 'react';
import { BarChart } from 'react-native-chart-kit';
import { Button } from 'react-native-paper';
import { useContext} from 'react';
import { AuthContext } from './AuthContext';
export default function Profile() {
  const { user } = useContext(AuthContext);
  const uid = user?.uid;
  console.log("This screen is used by:", uid);
  const itemWidth = 25;
  const min = 35;
  const max = 230;
  const step = 0.1;
  const numbers = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) =>
    (min + i * step).toFixed(1)
  );
  const [selectedValue, setSelectedValue] = useState(35);
  const screenWidth = Dimensions.get('window').width;
  const [currentWeight, setCurrentWeight] = useState(0);
  const [startWeight, setStartWeight] = useState(0);
  const [goalWeight, setGoalWeight] = useState(0);
  const [selected, setSelected] = useState('Week');
  const [bmiValue, setBmiValue] = useState('0')
  const [bmiCategory, setBmiCategory] = useState('')
  const chartData = {
    Week: {
      labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
      data: [800, 900, 1000, 750, 1200, 950, 1100]
    },
    Month: {
      labels: ['W1', 'W2', 'W3', 'W4'],
      data: [5000, 5200, 4800, 5100]
    },
    Year: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      data: [21000, 23000, 25000, 22000, 24000, 26000, 25000, 27000, 28000, 29000, 30000, 31000]
    }
  };
  return (
    <View style= {styles.mainContainer}>
      <Header subtitle={'Your Progress at a Glance!'}/>
      <TabNavigation/>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems:'center', elevation: 2}}>
    <TouchableOpacity  style={{backgroundColor: '#FCCF94', flex: 1,  alignItems: 'center', height: 60, justifyContent : 'center', elevation: 2}}>
      <Text style={styles.goalText}>Start weight</Text>
      <Text style={styles.remainingValue}>{startWeight}</Text>
    </TouchableOpacity>
    <TouchableOpacity  style={{backgroundColor: '#2E4A32', flex: 1,  alignItems: 'center', height: 60, justifyContent : 'center' , elevation: 2, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#2e4a32'}}>
      <Text style={[styles.goalText, {color: '#FFFFFF'}]}>Current weight</Text>
      <Text style={[styles.remainingValue, {color: '#FFFFFF'}]}>{currentWeight}</Text>
    </TouchableOpacity>
    <TouchableOpacity style={{backgroundColor: '#FCCF94', flex: 1, alignItems: 'center', height: 60, justifyContent : 'center', elevation: 2}}>
      <Text style={styles.goalText}>Goal weight</Text>
      <Text style={styles.remainingValue}>{goalWeight}</Text>
    </TouchableOpacity>
    </View>
    <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 30 }}>
    
    <Text style={[styles.caloriesText, {marginVertical: 15}]}>Progress Tracking Chart</Text>
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
    {['Week', 'Month', 'Year'].map((type) => (
  <Button
    key={type}
    mode={selected === type ? 'contained' : 'outlined'}
    onPress={() => setSelected(type)}
    buttonColor={selected === type ? '#2E4A32' : '#FCCF94'} 
    textColor={selected === type ? '#fff' : '#2E4A32'}      
  >
  {type}
  </Button>
 
))}
      </View>
      <View style={{ padding: 20, backgroundColor: '#FCCF94', borderRadius: 10, alignItems: 'center', width:'95%' }}>
      <BarChart
        fromZero={true}
        data={{
          labels: chartData[selected].labels,
          datasets: [{ data: chartData[selected].data }]
        }}
        width={screenWidth * 0.85}
        height={300}
        yAxisSuffix=" Cal"
        chartConfig={{
          backgroundColor: '#FCCF94',
          backgroundGradientFrom: '#FCCF94',
          backgroundGradientTo: '#FCCF94',
          decimalPlaces: 0,
          color: (opacity = 2) => `rgba(34, 68, 34, ${opacity})`,
          labelColor: () => '#222',
          barPercentage: 0.6,
          propsForLabels: { fontSize: 11 } 
        }}
        style={{ borderRadius: 16 }}
      />

      <Text style={{ alignSelf: 'flex-end', marginTop: 10, fontWeight: 'bold' }}>Total: {chartData[selected].data.reduce((a, b) => a + b, 0)} Cal</Text>
    </View>
    <Text style={[styles.caloriesText, { marginVertical: 15 }]}>New Weight log</Text>
<View style={[styles.rulerContainer, { height: 170 }]}>
  <Text style={styles.selectedValue}>{selectedValue}</Text>

  <FlatList
    data={numbers}
    horizontal
    snapToAlignment="center"
    snapToInterval={itemWidth}
    decelerationRate="fast"
    showsHorizontalScrollIndicator={false}
    keyExtractor={(item) => item.toString()}
    contentContainerStyle={{ paddingHorizontal: screenWidth / 2 - itemWidth }}
    renderItem={({ item }) => (
      <View style={styles.rulerItem}>
        <Text style={styles.rulerText}>
          {Math.round(parseFloat(item) * 10) % 50 === 0 ? item : ''}
        </Text>
        <View
          style={[
            styles.line,
            Math.abs(parseFloat(item) - selectedValue) < 0.05 && styles.activeLine,
          ]}
        />
      </View>
    )}
    onMomentumScrollEnd={(event) => {
      let index = Math.round(event.nativeEvent.contentOffset.x / itemWidth);
      if (numbers[index]) setSelectedValue(parseFloat(numbers[index]));
    }}
  />

  <View
    style={[
      styles.centerIndicator,
      { position: 'absolute', left: '50%', transform: [{ translateX: -1 }] },
    ]}
  />
</View>
<View style={styles.buttonContainer}>
  <TouchableOpacity style={[styles.button, {width: '90%', height: 50}]} >
    <Text style={styles.textButton}>Validate</Text>
  </TouchableOpacity>
</View>
<View style={{ marginTop: 20, width: '90%' }}>
  <Text style={styles.bmiTitle}>Body Mass Index (BMI) Calculator</Text>
  <Text style={styles.bmiDescription}>
    Quickly checks if your weight is healthy for your height and helps guide your fitness goals.
  </Text>
</View>
<View style={styles.buttonContainer}>
  <TouchableOpacity style={[styles.button, {width: '90%', backgroundColor:'#FCCF94', height: 50}]} >
    <View style={{flexDirection:'row', alignItems:'space-between  ', justifyContent: 'center'}}>
       <Text > BMI Value</Text>
       <Text>{bmiValue}</Text>
    </View>
  </TouchableOpacity>
</View>     
<View style={styles.buttonContainer}>
  <TouchableOpacity style={[styles.button, {width: '90%', backgroundColor:'#FCCF94', height: 50}]} >
    <Text > Category</Text>
    <Text>{bmiCategory}</Text>
  </TouchableOpacity>
</View>       
    
    </ScrollView>
    </View>
  );
}
