/**
 * profileController.js
 * Handles Profile screen specific actions:
 * - Logging current weight (saving to weightHistory and user doc).
 * - Retrieving historical CALORIE consumption data for the chart (reading from dailyConsumption).
 */

const { firebaseInstances } = require('../config/firebase'); // Adjust path if needed
const admin = firebaseInstances.admin;
const db = firebaseInstances.db;

// Basic Firebase service check helper function
function checkFirebaseReady(res, action = "perform action") {
    if (!admin || !db) {
        const missing = [!admin && "Admin", !db && "DB"].filter(Boolean).join(', ');
        console.error(`Firebase service(s) not initialized when trying to ${action}: ${missing}`);
        res.status(500).json({ error: `Server configuration error (${action}). Please try again later.` });
        return false;
    }
    return true;
}

// --- Weight Logging Function (Keep for Profile screen ruler) ---
const logWeight = async (req, res) => {
    if (!checkFirebaseReady(res, "log weight")) return;
    console.log("Executing logWeight in profileController");
    try {
        const { uid, weight, date } = req.body; // Expecting date: "YYYY-MM-DD"

        // --- Validation ---
        let errors = [];
        if (!uid) errors.push("UID required.");
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push("Valid Date (YYYY-MM-DD) required.");
        const numWeight = Number(weight);
        if (isNaN(numWeight) || numWeight <= 0 || numWeight > 500) { errors.push("Valid positive weight required."); }
        if (errors.length > 0) { return res.status(400).json({ error: "Validation failed", details: errors }); }
        // -----------------

        const userRef = db.collection('users').doc(uid);
        const weightEntryRef = userRef.collection('weightHistory').doc(date); // Store in dedicated weight history
        const weightData = { weight: numWeight, logTimestamp: new Date() };

        // Transaction: Update history AND current weight on user profile
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw new Error("User not found.");
            transaction.set(weightEntryRef, weightData);       // Set/Overwrite history entry for the date
            transaction.update(userRef, { weight: numWeight }); // Update user.weight
        });

        console.log(`Weight ${numWeight}kg logged for ${uid} on ${date} (profileController)`);
        res.status(200).json({ message: "Weight logged successfully (profileController)" });

    } catch (error) {
        console.error(`profileController: Error logging weight for ${req.body?.uid}:`, error);
        if (error.message === "User not found.") return res.status(404).json({ message: "User not found." });
        res.status(500).json({ message: "Error logging weight", error: error.message });
    }
};


// *** Get CALORIE History for Profile Chart ***
const getCalorieHistory = async (req, res) => {
    if (!checkFirebaseReady(res, "get calorie history")) return;
     console.log("Executing getCalorieHistory in profileController");
    try {
        const { uid } = req.params;
        const { period } = req.query; // 'Week', 'Month', 'Year'

        // --- Validation ---
        if (!uid) return res.status(400).json({ error: "UID parameter required." });
        const validPeriods = ['Week', 'Month', 'Year'];
        if (!period || !validPeriods.includes(period)) {
            return res.status(400).json({ error: `Query 'period' (${validPeriods.join('/')}) required.` });
        }
        // -----------------

        // --- Calculate Date Range ---
        const endDate = new Date();
        let startDate = new Date();
        switch (period) {
             case 'Week': startDate.setDate(endDate.getDate() - 6); break;
             case 'Month': startDate.setDate(endDate.getDate() - 29); break;
             case 'Year': startDate.setFullYear(endDate.getFullYear() - 1); startDate.setDate(startDate.getDate() + 1); break;
             default: startDate.setDate(endDate.getDate() - 6); // Default to Week
        }
        const formatDate = (date) => date.toISOString().split('T')[0];
        const startDateStr = formatDate(startDate);
        const endDateStr = formatDate(endDate);
        // --------------------------
        console.log(`Fetching CALORIE history for ${uid} (${period}): ${startDateStr} to ${endDateStr}`);

        // --- Firestore Query (Target 'dailyConsumption') ---
        const dailyConsumptionRef = db.collection('users').doc(uid).collection('dailyConsumption');
        const query = dailyConsumptionRef
            .where(admin.firestore.FieldPath.documentId(), '>=', startDateStr)
            .where(admin.firestore.FieldPath.documentId(), '<=', endDateStr)
            .orderBy(admin.firestore.FieldPath.documentId(), 'asc');

        const snapshot = await query.get();
        // ---------------------

        // --- Process Results (Format for Chart Kit) ---
        let resultChartData = { labels: [], datasets: [{ data: [] }] }; // Target structure
        const dailyTotals = [];

        if (!snapshot.empty) {
            snapshot.forEach(doc => {
                const data = doc.data();
                dailyTotals.push({
                    date: doc.id, // YYYY-MM-DD
                    calories: data.totals?.consumedCalories || 0 // Get total calories for that day
                });
            });
        } else {
            console.log(`No daily consumption data found for ${uid} in period ${period}.`);
        }

        // --- AGGREGATION / FORMATTING for Chart ---
        if (period === 'Week') {
            // Create a map for the last 7 days initialized to 0 calories
            const weekDataMap = new Map();
            for (let i = 6; i >= 0; i--) { // Ensure chronological order of keys
                const d = new Date();
                d.setDate(endDate.getDate() - i);
                weekDataMap.set(formatDate(d), 0);
            }
            // Fill the map with actual fetched calorie data
            dailyTotals.forEach(day => {
                if (weekDataMap.has(day.date)) {
                    weekDataMap.set(day.date, Math.round(day.calories));
                }
            });
            // Convert map to the ChartKit structure
            resultChartData = {
                 labels: Array.from(weekDataMap.keys()).map(dateStr => new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })), // 'Sun', 'Mon'...
                 datasets: [{ data: Array.from(weekDataMap.values()) }]
             };

        } else { // Month / Year - Aggregation logic is complex, providing placeholder structure
                 // ** Ideal: Implement proper weekly/monthly aggregation here based on `dailyTotals` **
                 console.warn(`Aggregation logic for ${period} calorie history is a basic sample.`);
                 if (period === 'Month') {
                     // Placeholder: first 4 daily values as "weeks"
                     resultChartData = {
                         labels: dailyTotals.slice(0, 4).map((d, i) => `W${i + 1}`), // W1, W2...
                         datasets: [{ data: dailyTotals.slice(0, 4).map(d => Math.round(d.calories)) }]
                     };
                 } else { // Year
                     // Placeholder: first 12 daily values as "months"
                      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      resultChartData = {
                         labels: dailyTotals.slice(0, 12).map((d, i) => months[new Date(d.date + 'T00:00:00').getMonth()]), // Get actual month
                         datasets: [{ data: dailyTotals.slice(0, 12).map(d => Math.round(d.calories)) }]
                     };
                 }
                 // Ensure data exists even for placeholder
                 if (resultChartData.labels.length === 0) {
                     const placeholders = { Month: { labels: ['W1', 'W2', 'W3', 'W4'], datasets: [{ data: [] }] }, Year: { labels: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'], datasets: [{ data: [] }] } };
                     resultChartData = placeholders[period];
                 }
        }
        // --- END AGGREGATION ---

        console.log(`Sending formatted calorie history for ${uid} (${period}). Labels: ${resultChartData.labels.length}, Data Points: ${resultChartData.datasets[0].data.length}`);
        // ----------------------
        res.status(200).json(resultChartData); // Send the ChartKit-ready object

    } catch (error) {
        console.error(`profileController: Error fetching calorie history for ${req.params?.uid}:`, error);
        res.status(500).json({ message: "Error fetching calorie history", error: error.message });
    }
};

// --- Export functions used by profileRoutes ---
module.exports = {
    logWeight,
    getCalorieHistory // Export calorie history function
};