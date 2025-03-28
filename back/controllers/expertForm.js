const bcrypt = require('bcrypt');
const admin = require('firebase-admin');
const { db, auth, storage } = require('../config/firebase.js');
const multer = require('multer');

// Configure multer for file upload
const upload = multer({
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

// SignUp
exports.registerNutritionist = async (req, res) => {
    console.log('Received Body:', req.body);
    console.log('Received Files:', req.files);

    try {
        // Destructure all fields from request body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            phoneNumber,
            yearsOfExperience,
            specialization,
            workplace,
            shortBio
        } = req.body;

        // Comprehensive Validation
        // 1. Required Fields Check
        const requiredFields = [
            'firstName', 'lastName', 'email', 'password', 'confirmPassword', 
             'phoneNumber', 'yearsOfExperience', 
            'specialization', 'workplace', 'shortBio'
        ];
        
        for (let field of requiredFields) {
            if (!req.body[field] || req.body[field].toString().trim() === '') {
                return res.status(400).json({ error: `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required.` });
            }
        }

        // 2. Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format." });
        }

        // 3. Password Validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                error: "Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character."
            });
        }

        // 4. Password Match
        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match." });
        }

        // 5. Phone Number Validation
        if ( !phoneNumber || !/^\d+$/.test(phoneNumber)) {
            return res.status(400).json({ error: "Invalid phone number." });
        }

        // 6. Years of Experience Validation
        const years = parseInt(yearsOfExperience, 10);
        if (isNaN(years) || years < 0 || years > 50) {
            return res.status(400).json({ error: "Invalid years of experience." });
        }

        // 7. Specialization Validation
        const validSpecializations = [
            "Clinical Nutrition",
            "Sports Nutrition",
            "Weight Management",
            "Pediatric Nutrition",
            "Digestive Health"
        ];
        if (!validSpecializations.includes(specialization)) {
            return res.status(400).json({ error: "Invalid specialization." });
        }

        // 8. Short Bio Validation
        const MAX_BIO_LENGTH = 250;
        if (shortBio.length > MAX_BIO_LENGTH) {
            return res.status(400).json({ 
                error: `Short bio must be ${MAX_BIO_LENGTH} characters or less.` 
            });
        }

        // 9. File Validations
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const allowedCertificateTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        const maxFileSize = 5 * 1024 * 1024; // 5MB

        // Check Professional Certificate
        if (!req.files || !req.files.professionalCertificate) {
            return res.status(400).json({ error: "Professional certificate is required." });
        }
        const certificate = req.files.professionalCertificate[0];
        if (!allowedCertificateTypes.includes(certificate.mimetype)) {
            return res.status(400).json({ 
                error: "Certificate must be a PDF or image (JPEG/PNG)." 
            });
        }
        if (certificate.size > maxFileSize) {
            return res.status(400).json({ error: "Certificate file must be less than 5MB." });
        }

        // Check Profile Image
        if (!req.files || !req.files.profileImage) {
            return res.status(400).json({ error: "Profile image is required." });
        }
        const profileImage = req.files.profileImage[0];
        if (!allowedImageTypes.includes(profileImage.mimetype)) {
            return res.status(400).json({ 
                error: "Profile image must be JPEG or PNG." 
            });
        }
        if (profileImage.size > maxFileSize) {
            return res.status(400).json({ error: "Profile image must be less than 5MB." });
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Upload Certificate to Firebase Storage
        const certificateFileName = `certificates/${Date.now()}_${certificate.originalname}`;
        const certificateFileRef = admin.storage().bucket().file(certificateFileName);
        await certificateFileRef.save(certificate.buffer, {
            metadata: { contentType: certificate.mimetype }
        });
        const certificateUrl = `https://storage.googleapis.com/${certificateFileRef.bucket.name}/${certificateFileRef.name}`;

        // Upload Profile Image to Firebase Storage
        const profileImageFileName = `profileImages/${Date.now()}_${profileImage.originalname}`;
        const profileImageFileRef = admin.storage().bucket().file(profileImageFileName);
        await profileImageFileRef.save(profileImage.buffer, {
            metadata: { contentType: profileImage.mimetype }
        });
        const profileImageUrl = `https://storage.googleapis.com/${profileImageFileRef.bucket.name}/${profileImageFileRef.name}`;

        // Create User in Firebase Authentication
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: `${firstName} ${lastName}`
        });

        // Save Additional User Info in Firestore
        await db.collection("nutritionists").doc(userRecord.uid).set({
            firstName,
            lastName,
            email,
            phoneNumber: `${phoneNumber}`,
            yearsOfExperience: years,
            specialization,
            workplace,
            shortBio,
            professionalCertificate: certificateUrl,
            profileImage: profileImageUrl,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending' // Optional: for approval process
        });

        // Successful Response
        res.status(201).json({
            message: "Nutritionist registration successful.",
            userId: userRecord.uid
        });

    } catch (error) {
        // Handle Specific Firebase Errors
        if (error.code === 'auth/email-already-exists') {
            return res.status(400).json({ error: "Email already in use." });
        }

        // Logging for server-side debugging
        console.error('Registration Error:', error);

        // Generic Error Response
        res.status(500).json({ 
            error: "Registration failed.", 
            details: error.message 
        });
    }
};

// Optional: Middleware for file upload
exports.uploadMiddleware = upload.fields([
    { name: 'professionalCertificate', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 }
]);