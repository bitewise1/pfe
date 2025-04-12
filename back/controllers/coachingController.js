// controllers/coachingController.js
const { firebaseInstances } = require('../config/firebase'); // Adjust path if needed
const admin = firebaseInstances.admin; // Needed for FieldValue
const db = firebaseInstances.db;       // Firestore instance
const FieldValue = admin.firestore.FieldValue; // Import FieldValue

// Helper: Check Firebase DB readiness
function checkFirebaseReady(res, action = "perform action") {
    if (!db) {
        console.error(`Firebase DB service not initialized when trying to ${action}.`);
        res.status(500).json({ error: `Server configuration error (${action}).` });
        return false;
    }
    return true;
}

// Helper: Get LIMITED, public details for one nutritionist
const getNutritionistPublicDetails = async (nutritionistId) => {
    if (!nutritionistId || !db) return null;
    console.log(`CTRL Helper: getNutritionistPublicDetails - Fetching single: ${nutritionistId}`);
    try {
        const docRef = db.collection('nutritionists').doc(nutritionistId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            console.log(`CTRL Helper: getNutritionistPublicDetails - Found: ${nutritionistId}`);
            const data = docSnap.data();
            const yearsExpNum = parseInt(data.yearsOfExperience, 10);
            // Ensure all needed fields are returned
            return {
                firstName: data.firstName || '', lastName: data.lastName || '', specialization: data.specialization || '',
                profileImageUrl: data.profileImage || data.profileImageUrl || null, // Check both potential fields
                yearsOfExperience: !isNaN(yearsExpNum) ? yearsExpNum : (data.yearsOfExperience || 0),
                workplace: data.workplace || '', shortBio: data.shortBio || '',
                averageRating: data.averageRating || 0,
                ratingCount: data.ratingCount || 0
            };
        } else { console.warn(`CTRL Helper: getNutritionistPublicDetails - Not Found: ${nutritionistId}`); return null; }
    } catch (error) { console.error(`CTRL Helper: Error fetching nutri ${nutritionistId}:`, error); return null; }
};

// Helper: Get details for MULTIPLE nutritionists
const getMultipleNutritionistPublicDetails = async (nutritionistIds) => {
    if (!db || !nutritionistIds || nutritionistIds.length === 0) {
         console.log("CTRL Helper: getMultiple... - Skipping, no IDs or DB.");
         return {};
    }
    const uniqueIds = [...new Set(nutritionistIds.filter(id => !!id))];
    if (uniqueIds.length === 0) {
         console.log("CTRL Helper: getMultiple... - Skipping, no unique valid IDs.");
         return {};
    }
    console.log(`CTRL Helper: getMultiple... - Fetching details for IDs: ${uniqueIds.join(', ')}`);
    // Ensure 'refs' definition is correct
    const refs = uniqueIds.map(id => db.collection('nutritionists').doc(id));
    try {
        console.log("CTRL Helper: getMultiple... - Calling db.getAll()...");
        const docSnaps = await db.getAll(...refs); // Use spread operator
        console.log(`CTRL Helper: getMultiple... - db.getAll() returned ${docSnaps.length} snapshots.`);
        const detailsMap = {};
        docSnaps.forEach(docSnap => {
            if (docSnap.exists) {
                const data = docSnap.data(); const yearsExpNum = parseInt(data.yearsOfExperience, 10);
                detailsMap[docSnap.id] = {
                    firstName: data.firstName || '', lastName: data.lastName || '', specialization: data.specialization || '',
                    profileImageUrl: data.profileImage || data.profileImageUrl || null,
                    yearsOfExperience: !isNaN(yearsExpNum) ? yearsExpNum : (data.yearsOfExperience || 0),
                    workplace: data.workplace || '', shortBio: data.shortBio || '',
                     averageRating: data.averageRating || 0,
                     ratingCount: data.ratingCount || 0
                }; } });
        console.log(`CTRL Helper: getMultiple... - Finished mapping. Map size: ${Object.keys(detailsMap).length}`);
        return detailsMap;
    } catch (error) {
        console.error("CTRL Helper: Error in getMultipleNutritionistPublicDetails (db.getAll):", error);
        return {}; // Return empty object on error
    }
};


// --- Get user's coaching status ---
exports.getCoachingStatus = async (req, res) => {
    console.log("CTRL: getCoachingStatus - ENTER"); // Log entry
    if (!checkFirebaseReady(res, "get coaching status")) return;
    const userId = req.user?.uid; if (!userId) return res.status(401).json({ error: "User auth missing." });
    console.log(`CTRL: getCoachingStatus - Processing for user: ${userId}`);
    try {
        console.log(`CTRL: getCoachingStatus - Fetching user document: users/${userId}`);
        const userDocRef = db.collection('users').doc(userId);
        const userDocSnap = await userDocRef.get();
        const userData = userDocSnap.exists ? userDocSnap.data() : {};
        const activeCoachId = userData?.activeCoachId;
        console.log(`CTRL: getCoachingStatus - User doc fetched. Active coach ID: ${activeCoachId || 'null'}`);

        if (activeCoachId) {
            console.log(`CTRL: getCoachingStatus - User HAS active coach: ${activeCoachId}`);
            console.log(`CTRL: getCoachingStatus - Fetching details for active coach: ${activeCoachId}`);
            const activeCoachDetails = await getNutritionistPublicDetails(activeCoachId);
            console.log(`CTRL: getCoachingStatus - Active coach details fetched:`, activeCoachDetails ? 'Found' : 'Not Found/Error');
            if (activeCoachDetails) {
                 console.log("CTRL: getCoachingStatus - Sending response for ACTIVE state.");
                 return res.status(200).json({ activeCoachId, activeCoachDetails, pendingRequests: [], acceptedRequests: [] });
            } else {
                console.warn(`CTRL: getCoachingStatus - Active coach details missing for ${activeCoachId}. Sending null activeCoachId.`);
                 return res.status(200).json({ activeCoachId: null, pendingRequests: [], acceptedRequests: [] });
            }
        } else {
            // No active coach - fetch requests
            console.log(`CTRL: getCoachingStatus - No active coach. Querying requests subcollection: users/${userId}/coachRequests`);
            const requestsCollectionRef = db.collection('users').doc(userId).collection('coachRequests');
            // Query for pending OR accepted requests
            const requestsQuery = requestsCollectionRef.where("status", "in", ["pending", "accepted"]);
            console.log(`CTRL: getCoachingStatus - Executing request query...`);
            const querySnapshot = await requestsQuery.get(); // <<<--- CHECK FOR INDEX ERRORS IN LOGS
            console.log(`CTRL: getCoachingStatus - Request query executed. Found ${querySnapshot.size} requests.`);

            const pending = [], accepted = [], nutritionistIdsToFetch = [];
            querySnapshot.forEach(docSnap => {
                const request = { id: docSnap.id, ...docSnap.data() };
                if (request.nutritionistId) {
                     nutritionistIdsToFetch.push(request.nutritionistId);
                     if (request.status === 'pending') pending.push(request);
                     else if (request.status === 'accepted') accepted.push(request); // Explicitly check accepted
                } else {
                     console.warn(`CTRL: getCoachingStatus - Request ${docSnap.id} missing nutritionistId!`);
                }
            });
             console.log(`CTRL: getCoachingStatus - Need details for ${nutritionistIdsToFetch.length} unique nutritionists:`, [...new Set(nutritionistIdsToFetch)]);

            // Fetch details for all nutritionists involved
            const nutritionistDetailsMap = await getMultipleNutritionistPublicDetails(nutritionistIdsToFetch); // <<<--- CHECK HELPER LOGS/ERRORS
            console.log(`CTRL: getCoachingStatus - Fetched details map size: ${Object.keys(nutritionistDetailsMap).length}`);

            // Map details back onto the requests, filtering out those where details couldn't be fetched
            const mapRequests = (reqList) => reqList.map(req => {
                 const details = nutritionistDetailsMap[req.nutritionistId] || null;
                 if (!details) {
                      console.warn(`CTRL: getCoachingStatus - Failed to map details for ${req.status} request ${req.id} (NutriID: ${req.nutritionistId})`);
                 }
                 return {...req, details: details };
            }).filter(req => req.details !== null);

            const mappedAccepted = mapRequests(accepted);
            const mappedPending = mapRequests(pending);
            console.log(`CTRL: getCoachingStatus - Final counts - Accepted with details: ${mappedAccepted.length}, Pending with details: ${mappedPending.length}`);

            console.log("CTRL: getCoachingStatus - Sending response for PENDING/ACCEPTED state.");
            return res.status(200).json({
                activeCoachId: null,
                acceptedRequests: mappedAccepted,
                pendingRequests: mappedPending
            });
        }
    } catch (error) {
        console.error(`CTRL Error: getCoachingStatus FAILED for user ${userId}:`, error);
        const isIndexError = error.message?.includes("requires an index");
        if (isIndexError) {
             console.error("!!! FIRESTORE INDEX LIKELY MISSING for users/{userId}/coachRequests query on 'status' field !!!");
             return res.status(500).json({ message: "Database config error.", error: "Missing DB index. Check backend logs/Firebase console." });
        }
        // Send generic error for other issues
        res.status(500).json({ message: "Server error fetching coaching info", error: error.message });
    }
     // Fallback error if no response sent (shouldn't happen)
     console.error(`CTRL: getCoachingStatus reached end without returning for user ${userId}!`);
     if (!res.headersSent) { res.status(500).json({ error: "Unknown server error in getCoachingStatus." }); }
};


// --- User selects a coach ---
exports.selectCoach = async (req, res) => {
    if (!checkFirebaseReady(res, "select coach")) return;
    const userId = req.user?.uid; const { requestId, nutritionistId } = req.body;
    if (!userId) return res.status(401).json({ error: "Authentication required." });
    if (!requestId || !nutritionistId) return res.status(400).json({ error: "Request ID and Nutritionist ID required." });
    console.log(`CTRL: selectCoach user: ${userId}, nutri: ${nutritionistId}, req: ${requestId}`);
    try {
        const requestDocRef = db.collection('users').doc(userId).collection('coachRequests').doc(requestId);
        const userDocRef = db.collection('users').doc(userId);
        await db.runTransaction(async (transaction) => {
            const requestDoc = await transaction.get(requestDocRef);
            const userDoc = await transaction.get(userDocRef);
            if (!requestDoc.exists) throw new Error(`Request ${requestId} not found for user ${userId}.`);
            const requestData = requestDoc.data();
            if (requestData.nutritionistId !== nutritionistId) throw new Error(`Request mismatch: Nutritionist`);
            if (requestData.status !== 'accepted') throw new Error(`Cannot select: Request status is '${requestData.status}'.`);
            if (userDoc.exists && userDoc.data()?.activeCoachId) throw new Error(`Conflict: User already has an active coach.`);
            console.log(`CTRL Transaction: Updating user ${userId}, request ${requestId}`);
            transaction.set(userDocRef, { activeCoachId: nutritionistId }, { merge: true });
            transaction.update(requestDocRef, { status: 'selected' });
        });
        console.log(`CTRL: Coach ${nutritionistId} selected by ${userId}.`);
        res.status(200).json({ message: "Coach selected successfully." });
    } catch (error) {
        console.error(`CTRL Error: selecting coach for user ${userId}:`, error);
        const isConflict = error.message?.includes("already has an active coach");
        res.status(isConflict ? 409 : 500).json({ message: "Failed to select coach", error: error.message });
    }
};


// --- User sends a request TO a coach ---
exports.sendCoachRequest = async (req, res) => {
    if (!checkFirebaseReady(res, "send coach request")) return;
    const userId = req.user?.uid; const { nutritionistId } = req.body;
    if (!userId) return res.status(401).json({ error: "User authentication missing." });
    if (!nutritionistId) return res.status(400).json({ error: "Nutritionist ID is required." });
    console.log(`CTRL: sendCoachRequest from user: ${userId} to nutritionist: ${nutritionistId}`);
    try {
        const userDocRef = db.collection('users').doc(userId);
        const userDocSnap = await userDocRef.get();
        if (userDocSnap.exists && userDocSnap.data()?.activeCoachId) { return res.status(409).json({ error: "You already have an active coach." }); }

        const requestsCollectionRef = db.collection('users').doc(userId).collection('coachRequests');
        const existingQuery = requestsCollectionRef.where("nutritionistId", "==", nutritionistId).where("status", "in", ["pending", "accepted", "selected"]);
        const existingSnapshot = await existingQuery.get();
        if (!existingSnapshot.empty) { return res.status(409).json({ error: "A request to this coach already exists." }); }

        const nutritionistDocRef = db.collection('nutritionists').doc(nutritionistId);
        const nutritionistDocSnap = await nutritionistDocRef.get();
        if (!nutritionistDocSnap.exists) { return res.status(404).json({ error: "Selected nutritionist not found." }); }

        const newRequestData = { nutritionistId, status: 'pending', requestTimestamp: FieldValue.serverTimestamp() };
        const docRef = await requestsCollectionRef.add(newRequestData);
        console.log(`CTRL: Coach request created: ${docRef.id} under user ${userId}`);
        res.status(201).json({ message: "Request sent successfully.", requestId: docRef.id });
    } catch (error) {
        console.error(`CTRL Error: sending coach request from user ${userId} to ${nutritionistId}:`, error);
        res.status(500).json({ message: "Server error sending request", error: "An internal error occurred." });
    }
};

// --- Get status of request between user and ONE specific nutritionist ---
exports.getSpecificRequestStatus = async (req, res) => {
    if (!checkFirebaseReady(res, "get specific request status")) return;
    const userId = req.user?.uid; const { nutritionistId } = req.params;
    if (!userId) return res.status(401).json({ error: "User authentication missing." });
    if (!nutritionistId) return res.status(400).json({ error: "Nutritionist ID parameter is required." });
    console.log(`CTRL: getSpecificRequestStatus for user: ${userId}, target nutritionist: ${nutritionistId}`);
    try {
        const requestsCollectionRef = db.collection('users').doc(userId).collection('coachRequests');
        const q = requestsCollectionRef.where("nutritionistId", "==", nutritionistId).where("status", "in", ["pending", "accepted", "selected"]).limit(1);
        console.log("CTRL: getSpecificRequestStatus - Executing query...");
        const querySnapshot = await q.get(); // <<<--- CHECK FOR INDEX ERRORS IN LOGS
        console.log(`CTRL: getSpecificRequestStatus - Query executed. Found ${querySnapshot.size} requests.`);

        if (!querySnapshot.empty) {
            const existingRequest = querySnapshot.docs[0].data();
            console.log(`CTRL: Found existing request with status: ${existingRequest.status}`);
            res.status(200).json({ status: existingRequest.status });
        } else {
            console.log(`CTRL: No existing request found.`);
            res.status(200).json({ status: 'none' });
        }
    } catch (error) {
        console.error(`CTRL Error: getting specific request status for user ${userId} to ${nutritionistId}:`, error);
         const isIndexError = error.message?.includes("requires an index");
        if (isIndexError) { console.error("!!! FIRESTORE INDEX LIKELY MISSING for users/{userId}/coachRequests query on (nutritionistId, status) fields !!!"); return res.status(500).json({ message: "Database config error.", error: "Missing DB index. Check backend logs/Firebase console." }); }
        res.status(500).json({ message: "Server error checking request status", error: "An internal error occurred." });
    }
};


// --- End Active Coaching Relationship ---
exports.endRelationship = async (req, res) => {
    if (!checkFirebaseReady(res, "end relationship")) return;
    const userId = req.user?.uid; if (!userId) return res.status(401).json({ error: "User authentication missing." });
    console.log(`CTRL: endRelationship request for user: ${userId}`);
    try {
        const userDocRef = db.collection('users').doc(userId);
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef); if (!userDoc.exists) throw new Error("User not found.");
            const userData = userDoc.data(); const activeCoachId = userData.activeCoachId;
            if (!activeCoachId) { console.log(`CTRL: User ${userId} has no active coach to end.`); return; }
            const requestsCollectionRef = userDocRef.collection('coachRequests');
            const q = requestsCollectionRef.where("nutritionistId", "==", activeCoachId).where("status", "==", "selected").limit(1);
            const requestSnap = await transaction.get(q);
            console.log(`CTRL Transaction: Removing activeCoachId for user ${userId}`);
            transaction.update(userDocRef, { activeCoachId: FieldValue.delete() });
            if (!requestSnap.empty) {
                 const requestRefToUpdate = requestSnap.docs[0].ref;
                 console.log(`CTRL Transaction: Setting request ${requestRefToUpdate.id} status to ended_by_user`);
                 transaction.update(requestRefToUpdate, { status: 'ended_by_user', endedTimestamp: FieldValue.serverTimestamp() });
            } else { console.warn(`CTRL: Could not find 'selected' request to update for user ${userId} and coach ${activeCoachId}.`); }
        });
        console.log(`CTRL: Relationship ended successfully for user ${userId}.`);
        res.status(200).json({ message: "Coaching relationship ended." });
    } catch (error) {
        console.error(`CTRL Error: ending relationship for user ${userId}:`, error);
        res.status(500).json({ message: "Server error ending relationship", error: error.message });
    }
};


// --- Block a Coach ---
exports.blockCoach = async (req, res) => {
    if (!checkFirebaseReady(res, "block coach")) return;
    const userId = req.user?.uid; const { nutritionistId } = req.body;
    if (!userId) return res.status(401).json({ error: "User authentication missing." });
    if (!nutritionistId) return res.status(400).json({ error: "Nutritionist ID to block is required." });
    console.log(`CTRL: blockCoach request from user: ${userId} for nutritionist: ${nutritionistId}`);
    try {
        const userDocRef = db.collection('users').doc(userId);
        const blockDocRef = userDocRef.collection('blockedCoaches').doc(nutritionistId);
         await db.runTransaction(async (transaction) => {
             const userDoc = await transaction.get(userDocRef);
             const userData = userDoc.exists ? userDoc.data() : {}; const activeCoachId = userData.activeCoachId;
             if (activeCoachId && activeCoachId === nutritionistId) {
                 console.log(`CTRL Transaction: Ending relationship with ${activeCoachId} due to block.`);
                 transaction.update(userDocRef, { activeCoachId: FieldValue.delete() });
                 const requestsCollectionRef = userDocRef.collection('coachRequests');
                 const q = requestsCollectionRef.where("nutritionistId", "==", activeCoachId).where("status", "==", "selected").limit(1);
                 const requestSnap = await transaction.get(q);
                 if (!requestSnap.empty) { transaction.update(requestSnap.docs[0].ref, { status: 'blocked_by_user', endedTimestamp: FieldValue.serverTimestamp() }); }
             }
             console.log(`CTRL Transaction: Setting block document for coach ${nutritionistId}`);
             transaction.set(blockDocRef, { blockedAt: FieldValue.serverTimestamp() });
         });
        console.log(`CTRL: Nutritionist ${nutritionistId} blocked successfully by user ${userId}.`);
        res.status(200).json({ message: "Coach blocked and relationship ended if active." });
    } catch (error) {
        console.error(`CTRL Error: blocking coach ${nutritionistId} for user ${userId}:`, error);
        res.status(500).json({ message: "Server error blocking coach", error: error.message });
    }
};

// --- Unblock a Coach ---
exports.unblockCoach = async (req, res) => {
     if (!checkFirebaseReady(res, "unblock coach")) return;
     const userId = req.user?.uid; const { nutritionistId } = req.body;
     if (!userId) return res.status(401).json({ error: "User authentication missing." });
     if (!nutritionistId) return res.status(400).json({ error: "Nutritionist ID to unblock is required." });
     console.log(`CTRL: unblockCoach request from user: ${userId} for nutritionist: ${nutritionistId}`);
     try {
         const blockDocRef = db.collection('users').doc(userId).collection('blockedCoaches').doc(nutritionistId);
         await blockDocRef.delete();
         console.log(`CTRL: Nutritionist ${nutritionistId} unblocked successfully by user ${userId}.`);
         res.status(200).json({ message: "Coach unblocked successfully." });
     } catch (error) {
         console.error(`CTRL Error: unblocking coach ${nutritionistId} for user ${userId}:`, error);
         res.status(500).json({ message: "Server error unblocking coach", error: error.message });
     }
 };

 exports.rateCoach = async (req, res) => {
    if (!checkFirebaseReady(res, "rate coach")) return;
    const userId = req.user?.uid;
    const { nutritionistId, rating } = req.body;

    if (!userId) return res.status(401).json({ error: "User authentication missing." });
    if (!nutritionistId) return res.status(400).json({ error: "Nutritionist ID to rate is required." });
    if (rating === undefined || typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return res.status(400).json({ error: "Rating must be an integer between 1 and 5." });
    }
    console.log(`CTRL: rateCoach request from user: ${userId} for nutritionist: ${nutritionistId} with rating: ${rating}`);

    try {
        await db.runTransaction(async (transaction) => {
            const nutritionistDocRef = db.collection('nutritionists').doc(nutritionistId);
            const ratingDocRef = nutritionistDocRef.collection('ratings').doc(userId); // User's rating subdoc under nutritionist
            const userRequestsRef = db.collection('users').doc(userId).collection('coachRequests'); // Ref to user's requests

            // --- PERFORM ALL READS FIRST ---
            console.log("CTRL Transaction (Rate): Reading nutritionist doc...");
            const nutritionistDoc = await transaction.get(nutritionistDocRef);
            console.log("CTRL Transaction (Rate): Reading previous rating doc...");
            const previousRatingDoc = await transaction.get(ratingDocRef);

            // Find the relevant coach request (if any) to update its status later
             console.log("CTRL Transaction (Rate): Querying for related coach request...");
             const requestQuery = userRequestsRef
                  .where("nutritionistId", "==", nutritionistId)
                  .where("status", "in", ["selected", "ended_by_user", "ended_by_coach"]) // Find active or recently ended
                  .limit(1);
             const requestSnap = await transaction.get(requestQuery);
             console.log(`CTRL Transaction (Rate): Coach request query found ${requestSnap.size} results.`);
             // --- END READS ---


            // --- VALIDATIONS ---
            if (!nutritionistDoc.exists) throw new Error("Nutritionist not found.");
            // --- END VALIDATIONS ---

             // --- CALCULATIONS ---
            const nutritionistData = nutritionistDoc.data();
            const previousRatingData = previousRatingDoc.exists ? previousRatingDoc.data() : null;
            const currentAvg = nutritionistData.averageRating || 0;
            const currentCount = nutritionistData.ratingCount || 0;
            let newCount = currentCount;
            let newSum = currentAvg * currentCount;

            if (previousRatingData) {
                console.log(`CTRL Transaction (Rate): Updating existing rating from ${previousRatingData.rating} to ${rating}.`);
                newSum -= previousRatingData.rating; // Subtract old rating
            } else {
                console.log(`CTRL Transaction (Rate): Adding new rating (${rating}). Incrementing count.`);
                newCount += 1; // Increment count only for new raters
            }
            newSum += rating; // Add the new rating

            const newAverage = newCount > 0 ? newSum / newCount : 0;
            const newAverageRounded = Math.round(newAverage * 10) / 10;
            // --- END CALCULATIONS ---


            // --- PERFORM ALL WRITES ---
            // 1. Set/Overwrite the user's rating document under the nutritionist
            console.log(`CTRL Transaction (Rate): Writing rating doc for user ${userId}`);
            transaction.set(ratingDocRef, {
                rating: rating,
                ratedAt: FieldValue.serverTimestamp()
                // Optionally store userId again if needed for other queries, though key is userId
                // userId: userId
            });

            // 2. Update the aggregate rating on the main nutritionist document
            console.log(`CTRL Transaction (Rate): Updating nutritionist ${nutritionistId} aggregate.`);
            transaction.update(nutritionistDocRef, {
                averageRating: newAverageRounded,
                ratingCount: newCount
            });

            // 3. Update the related coachRequest status (if one was found in the reads)
             if (!requestSnap.empty) {
                 const requestRefToUpdate = requestSnap.docs[0].ref;
                 console.log(`CTRL Transaction (Rate): Updating request ${requestRefToUpdate.id} status to rated.`);
                 transaction.update(requestRefToUpdate, { status: 'rated', ratingGiven: rating });
             } else {
                  console.log(`CTRL Transaction (Rate): No suitable coachRequest found to mark as rated.`);
             }
             // --- END WRITES ---
        }); // End Transaction

        console.log(`CTRL: Nutritionist ${nutritionistId} rated ${rating} successfully by user ${userId}.`);
        res.status(200).json({ message: "Rating submitted successfully." });

    } catch (error) {
        console.error(`CTRL Error: rating coach ${nutritionistId} for user ${userId}:`, error);
         if (error.message === "Nutritionist not found.") return res.status(404).json({ error: error.message });
        // Handle transaction errors specifically if needed
        res.status(500).json({ message: "Server error submitting rating", error: error.message });
    }
};