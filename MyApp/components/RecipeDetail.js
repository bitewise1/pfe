import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
    View, Image, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, Alert // Added Modal, Alert
} from 'react-native';
import axios from 'axios';
import styles from './Styles'; // Your shared styles
import { AuthContext } from './AuthContext';
import { Ionicons } from '@expo/vector-icons'; // Or your preferred icon library

// Define your backend URL
const API_BASE_URL = 'http://10.0.2.2:3000'; // Or your deployed backend URL

// --- Define Modal Styles (can be in Styles.js or here) ---
const modalStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker overlay
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 25,
        borderRadius: 15,
        width: '85%',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600', // Semibold
        marginBottom: 20,
        color: '#333',
    },
    mealButton: {
        backgroundColor: '#E8F5E9', // Light green background
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10, // More rounded corners
        marginBottom: 12,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#C8E6C9' // Subtle border
    },
    mealButtonText: {
        fontSize: 17,
        color: '#2E4A32', // Dark green text
        fontWeight: '500', // Medium weight
    },
    closeButton: {
        marginTop: 15,
        padding: 10,
    },
    closeButtonText: {
        color: '#E57373', // Soft red for cancel
        fontSize: 16,
        fontWeight: '500',
    }
});
// --- End Modal Styles ---

function RecipeDetail({ route, navigation }) { // Added navigation prop
    const { user } = useContext(AuthContext);
    // Get initial data passed from navigation
    const { recipeId, imageUrl: initialImageUrl, title: initialTitle } = route.params;

    const [recipeDetails, setRecipeDetails] = useState(null); // Store full details from backend
    const [loading, setLoading] = useState(true); // Loading state for fetching details
    const [isLogging, setIsLogging] = useState(false); // Loading state for logging action
    const [isModalVisible, setIsModalVisible] = useState(false); // State for modal visibility

    // Fetch FULL recipe details from *your* backend (which handles caching)
    useEffect(() => {
        const fetchRecipeDetails = async () => {
            if (!recipeId) {
                console.error("No Recipe ID provided.");
                Alert.alert("Error", "Could not load recipe details (No ID).");
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                console.log(`Fetching details for recipe ${recipeId} from backend...`);
                const response = await axios.get(`${API_BASE_URL}/recipes/details/${recipeId}`);
                console.log("Received details from backend.");
                setRecipeDetails(response.data); // Set the full details
            } catch (error) {
                console.error("Error fetching recipe details from backend:", error.response ? JSON.stringify(error.response.data) : error.message);
                setRecipeDetails(null); // Clear details on error
                 Alert.alert(
                    "Error Loading Recipe",
                    error.response?.data?.message || "Could not fetch recipe details. Please try again later.",
                    [{ text: "OK" }]
                 );
                 // Optional: Navigate back if details fail critically
                 // navigation.goBack();
            } finally {
                setLoading(false);
            }
        };

        fetchRecipeDetails();
    }, [recipeId]); // Re-fetch only if recipeId changes

     // --- Extract Nutrient Info using useMemo for performance ---
     const nutritionInfo = useMemo(() => {
        const nutrients = recipeDetails?.nutrition?.nutrients;
        if (!nutrients) return {}; // Return empty object if no nutrients

        const findNutrient = (name) => nutrients.find(n => n.name === name)?.amount;

        return {
            calories: findNutrient('Calories'),
            protein: findNutrient('Protein'),
            carbs: findNutrient('Carbohydrates'),
            fat: findNutrient('Fat'),
            fiber: findNutrient('Fiber'),
        };
    }, [recipeDetails]); // Recalculate only when recipeDetails changes


    // --- Function to Handle Logging ---
    const handleLogFood = async (mealType) => {
        if (!recipeDetails || !user || !user.uid) {
            Alert.alert("Error", "Cannot log food. User or recipe data missing.");
            return;
        }
        setIsModalVisible(false); // Close the modal first
        setIsLogging(true); // Show logging indicator on button

        // Prepare data for the backend
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD

        const loggedFood = {
            uid: user.uid,
            mealType: mealType.toLowerCase(), // 'breakfast', 'lunch', etc.
            date: dateString,
            source: 'recipe', // Indicate the source
            recipeId: recipeDetails.id,
            title: recipeDetails.title || initialTitle || "Recipe", // Fallback title
            // Use extracted nutrition, default to 0 if null/undefined
            calories: nutritionInfo.calories ?? 0,
            protein: nutritionInfo.protein ?? 0,
            carbs: nutritionInfo.carbs ?? 0,
            fat: nutritionInfo.fat ?? 0,
            fiber: nutritionInfo.fiber ?? 0,
            imageUrl: recipeDetails.image || initialImageUrl || null, // Send image URL
        };

        console.log("Logging food data:", loggedFood);

        try {
            // Send data to your backend logging endpoint
            const response = await axios.post(`${API_BASE_URL}/logMeal/log-meal`, loggedFood);

            if (response.status === 200 || response.status === 201) {
                Alert.alert("Success!", `${loggedFood.title} logged successfully under ${mealType}.`);
                // Optional: Navigate back or update UI
                // navigation.navigate('Dashboard'); // Example: Go to a dashboard screen
            } else {
                // Should be caught by catch block, but just in case
                throw new Error(response.data?.message || "Logging failed with unexpected status.");
            }
        } catch (error) {
            console.error("Error logging food:", error.response ? JSON.stringify(error.response.data) : error.message);
            Alert.alert("Logging Error", `Could not log food: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsLogging(false); // Hide logging indicator
        }
    };


    // --- Render Logic ---
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                 <ActivityIndicator size="large" color="#2E4A32" />
                 <Text style={{marginTop: 10}}>Loading Recipe Details...</Text>
            </View>
        );
    }

    // Handle case where details failed to load after loading finished
    if (!recipeDetails) {
        return (
            <View style={styles.centeredMessageContainer}>
                <Ionicons name="alert-circle-outline" size={50} color="#E57373" />
                <Text style={styles.centeredMessageText}>Failed to load recipe details.</Text>
                <Text style={styles.centeredMessageSubText}>Please go back and try again.</Text>
                 <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Go Back</Text>
                 </TouchableOpacity>
            </View>
        );
    }

    // --- Main Render when details are available ---
    return (
        <View style={styles.mainContainer}>
            {/* Use image from detailed response or fallback to initial */}
            <Image source={{ uri: recipeDetails.image || initialImageUrl }} style={styles.cardReImage} />

            <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Use title from detailed response or fallback to initial */}
                <Text style={styles.titlerRecipe}>{recipeDetails.title || initialTitle}</Text>

                {/* General Info Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                         <Ionicons name="time-outline" size={18} color="#555" style={styles.iconStyle}/>
                        <Text style={styles.nutrientTitle}>Ready in:</Text>
                        <Text style={styles.nutrientValue}>{recipeDetails.readyInMinutes ? `${recipeDetails.readyInMinutes} min` : 'N/A'}</Text>
                    </View>
                     <View style={styles.sectionHeader}>
                          <Ionicons name="restaurant-outline" size={18} color="#555" style={styles.iconStyle}/>
                        <Text style={styles.nutrientTitle}>Servings:</Text>
                        <Text style={styles.nutrientValue}>{recipeDetails.servings || 'N/A'}</Text>
                    </View>
                    <View style={styles.sectionHeader}>
                         <Ionicons name="leaf-outline" size={18} color="#555" style={styles.iconStyle}/>
                        <Text style={styles.nutrientTitle}>Meal Type:</Text>
                        <Text style={styles.nutrientValue}>{recipeDetails.dishTypes?.join(', ') || 'N/A'}</Text>
                    </View>
                    <View style={styles.sectionHeader}>
                         <Ionicons name="nutrition-outline" size={18} color="#555" style={styles.iconStyle}/>
                        <Text style={styles.nutrientTitle}>Diet Type:</Text>
                        <Text style={styles.nutrientValue}>{recipeDetails.diets?.join(', ') || 'N/A'}</Text>
                    </View>
                </View>

                {/* Nutrition Section */}
                 <View style={styles.section}>
                     <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>
                     <View style={styles.sectionHeader}>
                         <Ionicons name="flame-outline" size={18} color="#555" style={styles.iconStyle}/>
                         <Text style={styles.nutrientTitle}>Calories:</Text>
                         <Text style={styles.nutrientValue}>{nutritionInfo.calories !== undefined ? `${nutritionInfo.calories.toFixed(0)} kcal` : 'N/A'}</Text>
                     </View>
                     <View style={styles.sectionHeader}>
                          <Ionicons name="fish-outline" size={18} color="#555" style={styles.iconStyle}/>
                         <Text style={styles.nutrientTitle}>Protein:</Text>
                         <Text style={styles.nutrientValue}>{nutritionInfo.protein !== undefined ? `${nutritionInfo.protein.toFixed(1)} g` : 'N/A'}</Text>
                     </View>
                     <View style={styles.sectionHeader}>
                          <Ionicons name="cellular-outline" size={18} color="#555" style={styles.iconStyle}/> {/* Placeholder icon */}
                         <Text style={styles.nutrientTitle}>Carbs:</Text>
                         <Text style={styles.nutrientValue}>{nutritionInfo.carbs !== undefined ? `${nutritionInfo.carbs.toFixed(1)} g` : 'N/A'}</Text>
                     </View>
                     <View style={styles.sectionHeader}>
                         <Ionicons name="water-outline" size={18} color="#555" style={styles.iconStyle}/> {/* Placeholder icon */}
                         <Text style={styles.nutrientTitle}>Fat:</Text>
                         <Text style={styles.nutrientValue}>{nutritionInfo.fat !== undefined ? `${nutritionInfo.fat.toFixed(1)} g` : 'N/A'}</Text>
                     </View>
                      <View style={styles.sectionHeader}>
                         <Ionicons name="leaf-outline" size={18} color="#555" style={styles.iconStyle}/> {/* Reusing icon */}
                         <Text style={styles.nutrientTitle}>Fiber:</Text>
                         <Text style={styles.nutrientValue}>{nutritionInfo.fiber !== undefined ? `${nutritionInfo.fiber.toFixed(1)} g` : 'N/A'}</Text>
                     </View>
                 </View>


                {/* Ingredients Section */}
                {recipeDetails.extendedIngredients && recipeDetails.extendedIngredients.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ingredients:</Text>
                        {recipeDetails.extendedIngredients.map((ingredient, index) => (
                            <Text key={ingredient.id || index} style={styles.ingredient}>
                                • {ingredient.original} {/* Display original string for clarity */}
                            </Text>
                        ))}
                    </View>
                )}

                {/* Instructions Section */}
                {recipeDetails.instructions && (
                    <View style={[styles.section, { marginBottom: 40 }]}>
                         <Text style={styles.sectionTitle}>Instructions:</Text>
                         {/* Basic parsing to handle HTML tags if present */}
                         <Text style={styles.instructions}>{recipeDetails.instructions.replace(/<[^>]*>?/gm, '') || 'N/A'}</Text>
                    </View>
                )}

                {/* --- Log Food Button --- */}
                <TouchableOpacity
                    style={[styles.button, styles.logButton, { alignSelf: 'center' }]} // Add specific logButton style if needed
                    onPress={() => setIsModalVisible(true)}
                    disabled={isLogging || loading} // Disable if details loading or currently logging
                >
                    {isLogging ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                         <View style={{flexDirection: 'row', alignItems: 'center'}}>
                             <Ionicons name="add-circle-outline" size={20} color="#fff" style={{marginRight: 8}}/>
                             <Text style={styles.buttonText}>Log This Meal</Text>
                         </View>
                    )}
                </TouchableOpacity>

            </ScrollView>

            {/* --- Meal Selection Modal --- */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)} // Allow closing via back button on Android
            >
                <TouchableOpacity
                    style={modalStyles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setIsModalVisible(false)} // Close on background press
                >
                    <TouchableOpacity activeOpacity={1} style={modalStyles.modalContent} onPress={() => {}}>
                        <Text style={modalStyles.modalTitle}>Log as:</Text>
                        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((meal) => (
                            <TouchableOpacity
                                key={meal}
                                style={modalStyles.mealButton}
                                onPress={() => handleLogFood(meal)}
                                disabled={isLogging} // Prevent double-clicks while logging starts
                            >
                                <Text style={modalStyles.mealButtonText}>{meal}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={modalStyles.closeButton}
                            onPress={() => setIsModalVisible(false)}
                        >
                            <Text style={modalStyles.closeButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

export default RecipeDetail;

// Add to Styles.js or keep here (ensure relevant styles are defined)
// Example additions needed in Styles.js:
// loadingContainer, centeredMessageContainer, centeredMessageText, centeredMessageSubText,
// retryButton, retryButtonText, section, sectionTitle, sectionHeader, nutrientTitle,
// nutrientValue, ingredient, instructions, button, buttonText, logButton, iconStyle