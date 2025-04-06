import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { AuthContext } from './AuthContext';
import Card from './Card';
import axios from 'axios';
import styles from './Styles';  // Your existing styles
import LottieView from 'lottie-react-native';  // Import Lottie
import Header from './Header';
import TabNavigation from './TabNavigation';
import { Ionicons } from '@expo/vector-icons';

export default function Recipes({ navigation }) {
  const { user } = useContext(AuthContext);  // Get user info from AuthContext
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); // For the search input

  const uid = user?.uid;  // User UID from AuthContext
  let dietaryPreferences = user?.dietaryPreferences || [];  // Default to empty array if undefined

  // Check if dietaryPreferences contains a "No Restrictions" entry and handle accordingly
  if (dietaryPreferences.includes("No Restrictions ✅")) {
    dietaryPreferences = [];  // Set to empty array if "No Restrictions" is chosen
  }

  // Access nutritionPlan from the user object
  const dailyCalories = user?.nutritionPlan?.calories || 0;
  const proteinGoal = user?.nutritionPlan?.protein || 0;
  const carbsGoal = user?.nutritionPlan?.carbs || 0;

  // Fetch personalized recipes from the backend
  const fetchRecipes = async () => {
    try {
      const dietaryPreferencesString = dietaryPreferences.join(',');  // Ensure it's a comma-separated string
      console.log("dietaryPreferences in frontend:", dietaryPreferences);

      const response = await axios.post('http://10.0.2.2:3000/recipes/fetch-recipes', {
        uid,
        dietaryPreferences: dietaryPreferencesString || [],  // Ensure it's an array, fallback to empty array
        dailyCalories: dailyCalories,
        proteinGoal: proteinGoal,
        carbsGoal: carbsGoal,
      });

      console.log("Fetched recipes:", response.data);  // Log the fetched recipes to check if data is valid

      setRecipes(response.data);  // Update state with fetched recipes
      setLoading(false);  // Stop the loader once recipes are fetched

    } catch (error) {
      console.error("Error fetching recipes:", error.response ? error.response.data : error.message);
      alert("Error fetching recipes: " + (error.response ? error.response.data : error.message));
      setLoading(false);  // Stop the loader even if there's an error
    }
  };

  useEffect(() => {
    if (uid) {
      fetchRecipes();  // Fetch recipes based on user's data
    }
  }, [uid]);

  // If recipes are loading, show a Lottie animation for loading
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../assets/Animations/recipes.json')}  // Path to your Lottie animation
          autoPlay
          loop
          style={{ width: 300, height: 300 }}  // Adjust the size of the animation
        />
      </View>
    );
  }

  // If no recipes are found
  if (!recipes.length) {
    return (
      <View style={styles.container}>
        <Text>No recipes found based on your preferences.</Text>
      </View>
    );
  }

  // Handle search functionality
  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.mainContainer}>
      <Header subtitle={"Dive Into Yummy Recipes"} />
      <TabNavigation />
      <View style={styles.searchContainer}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for a recipe"
          style={styles.searchInput}
        />
        <TouchableOpacity>
          <Ionicons name="search" size={24} color="#2E4A32" />
        </TouchableOpacity>
      </View>
      <FlatList
        style={{ marginBottom: 100 }}
        data={filteredRecipes}
        renderItem={({ item }) => {
          console.log("Rendering item:", item);  // Log to check if item data is correct
          return (
            <Card
              title={item.title}
              description={`Ready in: ${item.readyInMinutes || 'N/A'} min`}  // Use 'N/A' if time is not available
              calories={`${item.nutrition?.nutrients?.[0]?.amount ?? 'N/A'} kcal`}  // Adjust for correct field
              imageUrl={item.image}
              onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id, imageUrl :item.image , calories: item.nutrition, title: item.title})}
            />
          );
        }}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}
