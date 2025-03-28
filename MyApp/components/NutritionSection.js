import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList } from 'react-native';
import Header from './Header';
import TabNavigation from './TabNavigation';
import { Ionicons } from '@expo/vector-icons';
import styles from './Styles';
import NutritionistCard from './NutritionistCard';
import { db } from '../firebaseConfig'; // Import Firestore instance
import { collection, getDocs } from "firebase/firestore"; // Firebase JS SDK for Firestore
import { useNavigation } from '@react-navigation/native';
export default function NutritionSection() {
  const [users, setUsers] = useState([]);
  const navigation = useNavigation();
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "nutritionists"));
        const usersList = [];
        querySnapshot.forEach((doc) => {
          usersList.push(doc.data());
        });
        setUsers(usersList); // Set fetched users
      } catch (error) {
        console.error("Error fetching users: ", error);
      }
    };
    
    fetchUsers(); // Call the function to fetch data
  }, []); // Empty array means it runs once when component mounts

  return (
    <View style={styles.mainContainer}>
      <Header subtitle={"Find your specialist"} />
      <TabNavigation />
      <View style={styles.searchContainer}>
        <TextInput placeholder="Search" />
        <TouchableOpacity>
          <Ionicons name="search" size={24} color="#2E4A32" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={users} // Pass the users data to FlatList
        renderItem={({ item }) => (
          <TouchableOpacity onPress={()=> navigation.navigate('NutritionistInfo', {firstName: item.firstName,
            lastName: item.lastName,
            workplace: item.workplace,
            yearsOfExperience: item.yearsOfExperience,
            shortBio: item.shortBio,
            specialization: item.specialization,
            profileImage: item.profileImage})}>
            <NutritionistCard user={item} /> {/* Pass each user to the card */}
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()} // Unique key for each item
      />
    </View>
  );
}
