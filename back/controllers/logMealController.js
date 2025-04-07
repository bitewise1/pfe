const { firebaseInstances } = require('../config/firebase'); 

const admin = firebaseInstances.admin;
const db = firebaseInstances.db;


function checkFirebaseReady(res) {
    if (!admin || !db) {
        const missing = [!admin && "Admin", !db && "DB"].filter(Boolean).join(', ');
        console.error(`Firebase service(s) not initialized when trying to access logMeal routes: ${missing}`);
        res.status(500).json({ error: "Server configuration error (Log Meal). Please try again later." });
        return false; 
    }
    return true; 
}


const logMeal = async (req, res) => {
  
    if (!checkFirebaseReady(res)) return;

    try {
        const {
            uid, mealType, date, source = 'recipe', recipeId,
            title, calories, protein, carbs, fat, fiber, imageUrl
        } = req.body;

        let errors = [];
        if (!uid) errors.push("User ID (uid) is required.");
        if (!mealType) errors.push("Meal Type is required.");
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push("Valid Date (YYYY-MM-DD) is required.");
        if (!title) errors.push("Title is required.");
        if (calories === undefined || protein === undefined || carbs === undefined || fat === undefined || fiber === undefined) {
             errors.push("Nutrient values (calories, protein, carbs, fat, fiber) are required.");
        }
        const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
        if (mealType && !validMealTypes.includes(mealType.toLowerCase())) {
            errors.push(`Invalid meal type. Must be one of: ${validMealTypes.join(', ')}.`);
        }
        if (errors.length > 0) {
            console.warn("Log Meal Validation Failed:", errors);
            return res.status(400).json({ error: "Validation failed", details: errors });
        }

        const mealTypeLower = mealType.toLowerCase();
        const numCalories = Number(calories) || 0;
        const numProtein = Number(protein) || 0;
        const numCarbs = Number(carbs) || 0;
        const numFat = Number(fat) || 0;
        const numFiber = Number(fiber) || 0;

        const mealDataToAdd = {
            logTimestamp: new Date(),
            source: source,
            recipeId: recipeId || null,
            title: String(title),
            calories: numCalories,
            protein: numProtein,
            carbs: numCarbs,
            fat: numFat,
            fiber: numFiber,
            imageUrl: imageUrl || null
        };

        const dailyLogRef = db.collection('users').doc(uid).collection('dailyConsumption').doc(date);

       
        const FieldValue = admin.firestore.FieldValue;

        await db.runTransaction(async (transaction) => {
            const dailyLogDoc = await transaction.get(dailyLogRef);

            if (!dailyLogDoc.exists) {
                console.log(`Creating new daily log for ${uid} on ${date} (Using Client Timestamp)`);
                transaction.set(dailyLogRef, {
                    dateString: date,
                    totals: { consumedCalories: 0, consumedProtein: 0, consumedCarbs: 0, consumedFat: 0, consumedFiber: 0 },
                    breakfast: [], lunch: [], dinner: [], snack: []
                });
                transaction.update(dailyLogRef, {
                    [`totals.consumedCalories`]: FieldValue.increment(numCalories),
                    [`totals.consumedProtein`]: FieldValue.increment(numProtein),
                    [`totals.consumedCarbs`]: FieldValue.increment(numCarbs),
                    [`totals.consumedFat`]: FieldValue.increment(numFat),
                    [`totals.consumedFiber`]: FieldValue.increment(numFiber),
                    [mealTypeLower]: FieldValue.arrayUnion(mealDataToAdd)
                });
            } else {
                console.log(`Updating existing daily log for ${uid} on ${date} (Using Client Timestamp)`);
                transaction.update(dailyLogRef, {
                    [`totals.consumedCalories`]: FieldValue.increment(numCalories),
                    [`totals.consumedProtein`]: FieldValue.increment(numProtein),
                    [`totals.consumedCarbs`]: FieldValue.increment(numCarbs),
                    [`totals.consumedFat`]: FieldValue.increment(numFat),
                    [`totals.consumedFiber`]: FieldValue.increment(numFiber),
                    [mealTypeLower]: FieldValue.arrayUnion(mealDataToAdd)
                });
            }
        });

        console.log(`Meal "${title}" logged successfully for user ${uid} on ${date} as ${mealTypeLower}`);
        res.status(200).json({ message: "Meal logged successfully" });

    } catch (error) {
        console.error(`Error logging meal for user ${req.body?.uid} on date ${req.body?.date}:`, error);
        res.status(500).json({
             message: "Error logging meal to Firestore",
             error: error.message,
             details: error.stack
            });
    }
};

const getCombinedDailyData = async (req, res) => {
    
    if (!checkFirebaseReady(res)) return; 

    try {
        const { uid, date } = req.params;
        if (!uid || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ error: "Valid User ID and Date (YYYY-MM-DD) are required." });
        }

        const today = new Date(date + 'T00:00:00Z');
        const yesterday = new Date(today);
        yesterday.setUTCDate(today.getUTCDate() - 1);
        const yesterdayDateStr = yesterday.toISOString().split('T')[0];

        const userRef = db.collection('users').doc(uid);
        const todayLogRef = userRef.collection('dailyConsumption').doc(date);
        const yesterdayLogRef = userRef.collection('dailyConsumption').doc(yesterdayDateStr);

        const [userDoc, todayDoc, yesterdayDoc] = await Promise.all([
            userRef.get(), todayLogRef.get(), yesterdayLogRef.get()
        ]);

        if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

        const userData = userDoc.data();
 
        const nutritionPlan = userData.nutritionPlan || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: { recommended: 0 }, fiberGoal: "0-0g", goal: '' };

        let consumedTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
        let streak = 0;

        if (todayDoc.exists) {
            const todayData = todayDoc.data();
            consumedTotals = {
                calories: todayData.totals?.consumedCalories || 0,
                protein: todayData.totals?.consumedProtein || 0,
                carbs: todayData.totals?.consumedCarbs || 0,
                fat: todayData.totals?.consumedFat || 0,
                fiber: todayData.totals?.consumedFiber || 0
            };
            streak = 1;
            if (yesterdayDoc.exists) streak = 2;
        }

        res.status(200).json({
            success: true,
            nutritionPlan, consumedTotals, streak
        });
    } catch (error) {
        console.error(`Error fetching combined daily data for user ${req.params.uid}:`, error);
        res.status(500).json({ error: "Internal server error fetching combined daily data", details: error.message });
    }
};


module.exports = {
    logMeal,
    getCombinedDailyData
};