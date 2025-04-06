import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import axios from 'axios';  
import styles from './Styles';

function RecipeDetail({ route }) {
  const { recipeId, imageUrl, title } = route.params;  
  const [recipeDetails, setRecipeDetails] = useState(null);
  const [loading, setLoading] = useState(true);  // To handle the loading state

  // Fetch recipe details based on recipeId
  useEffect(() => {
    const fetchRecipeDetails = async () => {
      try {
        const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=0d9630af29e34b23bb2b830cdbe233f4&includeNutrition=true`);
        setRecipeDetails(response.data);
        setLoading(false);  
      } catch (error) {
        console.error("Error fetching recipe details:", error);
        setLoading(false);  
      }
    };

    if (recipeId) {
      fetchRecipeDetails();
    }
  }, [recipeId]);
  const removeHtmlTags = (text) => {
    const regex = /(<([^>]+)>)/gi;
    return text.replace(regex, ""); 
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#2E4A32" style={styles.loader} />;
  }

  return (
    <View style={styles.mainContainer}>
      <Image source={{ uri: imageUrl }} style={styles.cardReImage} />
      <ScrollView style={styles.contentContainer}>
        <Text style={styles.titlerRecipe}>{title}</Text>

        {/* Meal Type and Diet Type */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.nutrientTitle}>Meal Type:</Text>
            <Text style={styles.nutrientValue}>{recipeDetails.dishTypes?.join(', ') || 'N/A'}</Text>
          </View>
          <View style={styles.sectionHeader}>
            <Text style={styles.nutrientTitle}>Diet Type:</Text>
            <Text style={styles.nutrientValue}>{recipeDetails.diets?.join(', ') || 'N/A'}</Text>
          </View>
        </View>

        {/* Nutrition Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.nutrientTitle}>Calories:</Text>
            <Text style={styles.nutrientValue}>{recipeDetails.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || 'N/A'}</Text>
          </View>
          <View style={styles.sectionHeader}>
            <Text style={styles.nutrientTitle}>Protein:</Text>
            <Text style={styles.nutrientValue}>{recipeDetails.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 'N/A'}</Text>
          </View>
          <View style={styles.sectionHeader}>
            <Text style={styles.nutrientTitle}>Carbs:</Text>
            <Text style={styles.nutrientValue}>{recipeDetails.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 'N/A'}</Text>
          </View>
          <View style={styles.sectionHeader}>
            <Text style={styles.nutrientTitle}>Fiber:</Text>
            <Text style={styles.nutrientValue}>{recipeDetails.nutrition?.nutrients?.find(n => n.name === 'Fiber')?.amount || 'N/A'}</Text>
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.sectionHeader}>
          <Text style={styles.ingredientsTitle}>Ingredients:</Text>
          {recipeDetails.extendedIngredients?.map((ingredient, index) => (
            <Text key={index} style={styles.ingredient}>
              {ingredient.amount} {ingredient.unit} {ingredient.name}
            </Text>
          ))}
        </View>

        {/* Instructions */}
        <View style={[styles.sectionHeader, {marginBottom: 40}]}>
          <Text style={styles.instructionsTitle}>Instructions:</Text>
          <Text style={styles.instructions}>{recipeDetails.instructions || 'N/A'}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

export default RecipeDetail;

