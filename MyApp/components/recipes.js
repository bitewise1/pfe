import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import Header from './Header';
import TabNavigation from './TabNavigation';
import styles from './Styles';
import { Ionicons } from '@expo/vector-icons';

export default function Recipes() {
  return (
    <View style={styles.mainContainer}>
      <Header subtitle={`A Burst of Flavor Awaits!
Dive Into Yummy Recipes `}/>
      <TabNavigation/>
      
        <TouchableOpacity style={styles.searchContainer}>
            <TextInput placeholder = 'Search'/>
            <Ionicons name='search' size={24} color='#2E4A32'/>
        </TouchableOpacity>
        <ScrollView showsVerticalScrollIndicator={false} style={{width: '100%', marginVertical: 10}}>
             <Text style={[styles.caloriesText, {padding: 10}]}>Popular Dishes</Text>
        </ScrollView>
      
    </View>
    
  );
}
