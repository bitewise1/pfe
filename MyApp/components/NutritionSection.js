import React, { useState, useEffect, useContext } from 'react'; 
import {
    View, Text, TouchableOpacity, TextInput,
    FlatList, StyleSheet, ActivityIndicator 
} from 'react-native';
import Header from '../components/Header'; 
import TabNavigation from '../components/TabNavigation'; 
import { Ionicons } from '@expo/vector-icons';
import NutritionistCard from '../components/NutritionistCard'; 
import { db } from '../firebaseConfig'; 
import { collection, getDocs } from "firebase/firestore";
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../components/AuthContext'; 

const styles = StyleSheet.create({
     mainContainer: { flex: 1, backgroundColor: '#F5E4C3' }, 
     loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5E4C3' },
     contentWrapper: { flex: 1 }, 
     searchContainer: {
         flexDirection: 'row', alignItems: 'center', backgroundColor: '#FCCF94', 
         borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8,
         marginHorizontal: 30, marginTop: 15, marginBottom: 10, 
         elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
     },
     searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#2E4A32' },
     listContainer: { paddingHorizontal: 10, paddingBottom: 15 },
     noResultsText: { textAlign: 'center', marginTop: 50, color: '#666', fontSize: 16 },
   
});

export default function NutritionSection() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [nutritionists, setNutritionists] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredNutritionists, setFilteredNutritionists] = useState([]);
  const navigation = useNavigation();

  useEffect(() => { 
    const fetchNutritionists = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "nutritionists"));
        const nutritionistList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Include ID
        setNutritionists(nutritionistList);
        setFilteredNutritionists(nutritionistList);
      } catch (error) { console.error("Error fetching nutritionists: ", error); }
      finally { setLoading(false); }
    };
    fetchNutritionists();
  }, []);

  useEffect(() => { 
    if (searchText === '') { setFilteredNutritionists(nutritionists); }
    else {
      setFilteredNutritionists(
        nutritionists.filter(nutri =>
          `${nutri.firstName || ''} ${nutri.lastName || ''}`.toLowerCase().includes(searchText.toLowerCase()) ||
          (nutri.specialization?.toLowerCase() || '').includes(searchText.toLowerCase())
        ) ); }
  }, [searchText, nutritionists]);

  const renderNutritionist = ({ item }) => ( 
    <TouchableOpacity
        onPress={() => {
            console.log("Navigating to NutritionistInfo with ID:", item.id);
            navigation.navigate('NutritionistInfo', {
                nutritionistId: item.id, 
                firstName: item.firstName, lastName: item.lastName, workplace: item.workplace,
                yearsOfExperience: item.yearsOfExperience, shortBio: item.shortBio,
                specialization: item.specialization,
                profileImage: item.profileImage || item.profileImageUrl, 
            }); } }
    >
      <NutritionistCard user={{...item, profileImageUrl: item.profileImage || item.profileImageUrl}} />
    </TouchableOpacity>
  );


  return (
  
    <View style={styles.mainContainer}>
      <Header subtitle={"Find your specialist"} />
        {loading ? (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2E4A32" />
            </View>
        ) : (
         
            <View style={styles.contentWrapper}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#A0A0A0" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or specialization..."
                        placeholderTextColor="#A0A0A0"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Ionicons name="close-circle" size={20} color="#A0A0A0" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Nutritionist List */}
                <FlatList
                    data={filteredNutritionists}
                    renderItem={renderNutritionist}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={<Text style={styles.noResultsText}>No nutritionists found matching your search.</Text>}
                />
            </View>

        )}

      <TabNavigation />

    </View>
  );
}