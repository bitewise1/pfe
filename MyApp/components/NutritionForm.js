import React, { useRef, useState, useContext, useEffect } from 'react'; // Added useEffect
import { View, Text, Image, TouchableOpacity, TextInput, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native'; // Added ActivityIndicator
import styles from './Styles';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Picker } from '@react-native-picker/picker';
import PhoneInput from 'react-native-phone-number-input';
import { AuthContext } from './AuthContext'; // Assuming AuthContext provides user info if needed, though registration might not need it immediately

// --- Configuration ---
// It's better to use react-native-dotenv for this URL!
// import { API_URL } from '@env'; // <-- Ideal way
const API_BASE_URL = 'http://10.0.2.2:3000'; // Or your current IP. Using 10.0.2.2 for Android emulator host access.

export default function NutritionForm() {
  // If registration needs the currently logged-in user's UID for some reason (unlikely for initial registration)
  // const { user } = useContext(AuthContext);
  // const uid = user?.uid;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); // Raw phone number from input
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState(''); // Formatted number for display/sending
  const [specialization, setSpecialization] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [shortBio, setShortBio] = useState('');
  const [profileImage, setProfileImage] = useState(null); // Stores { uri, name, type }
  const [certificateImage, setCertificateImage] = useState(null); // Stores { uri, name, type }
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // For loading indicator

  const phoneInput = useRef(null);
  const navigation = useNavigation();

  // Request permissions on component mount (optional but good practice)
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libraryStatus.status !== 'granted') {
          // Alert('Permission Denied', 'Camera roll permissions are needed to upload a profile image.');
          console.warn('Camera roll permissions not granted.');
        }
        // Document Picker doesn't require explicit permissions beforehand on mobile
      }
    })();
  }, []);

  const handlePhoneChange = (number) => {
    // The component provides the raw number and formatted number separately
    // Store the formatted number which often includes country code for sending
    setPhoneNumber(number); // Keep raw if needed
    // Use the ref to get formatted value if needed, or rely on onChangeFormattedText if component provides it directly
     const formatted = phoneInput.current?.getNumberAfterPossiblyEliminatingZero()?.formattedNumber || number;
     setFormattedPhoneNumber(formatted); // Store formatted number
     console.log("Formatted Phone:", formatted);
  };


  const pickImage = async (type) => {
    try {
      if (type === 'certificate') {
        // Use DocumentPicker for PDFs and images
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
          copyToCacheDirectory: true, // Recommended for reliable access
        });

        console.log('Certificate Picker Result:', JSON.stringify(result, null, 2)); // Detailed log

        // Updated check for Expo SDK 48+ (DocumentPicker changes)
        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
             if (!asset.uri || !asset.name || !asset.mimeType) {
                console.error("Certificate Picker Error: Missing uri, name, or mimeType in asset", asset);
                Alert.alert('Error', 'Could not get complete certificate file details.');
                return;
            }
            setCertificateImage({
              uri: asset.uri,
              name: asset.name,
              type: asset.mimeType // Use mimeType consistently
            });
        } else if (result.type === 'success') {
            // Fallback for older SDK versions or different result structure (less likely now)
             if (!result.uri || !result.name || !result.mimeType) {
                console.error("Certificate Picker Error: Missing uri, name, or mimeType in result", result);
                Alert.alert('Error', 'Could not get complete certificate file details.');
                return;
            }
            setCertificateImage({
              uri: result.uri,
              name: result.name,
              type: result.mimeType // Use mimeType consistently
            });
        }

      } else if (type === 'profile') {
        // Use ImagePicker for profile images
        const { status } = await ImagePicker.getMediaLibraryPermissionsAsync(); // Check status again just in case
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Please grant camera roll permissions in your device settings.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false, // Or true if you want cropping
          quality: 0.8, // Slightly reduce quality for faster uploads
        });

        console.log('Profile Image Picker Result:', JSON.stringify(result, null, 2)); // Detailed log

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
           if (!asset.uri || !asset.type) { // Name might be optional depending on source
                console.error("Profile Image Picker Error: Missing uri or type in asset", asset);
                Alert.alert('Error', 'Could not get complete profile image details.');
                return;
            }
          setProfileImage({
            uri: asset.uri,
            // Generate a name if missing (important for FormData)
            name: asset.fileName || `profile_${Date.now()}.${asset.type.split('/')[1] || 'jpg'}`,
            type: asset.type // e.g., 'image/jpeg'
          });
        }
      }
    } catch (error) {
      console.error(`Error picking ${type}:`, error);
      Alert.alert('Error', `Failed to pick ${type}. Please try again.`);
    }
  };

  const handleSubmit = async () => {
    // --- Basic Frontend Validation ---
    // (Backend does more thorough validation)
    if (
      !firstName || !lastName || !email || !password || !confirmPassword ||
      !formattedPhoneNumber || !yearsOfExperience || !specialization || !workplace ||
      !shortBio || !profileImage || !certificateImage
    ) {
      Alert.alert('Missing Information', 'Please fill in all fields and upload both files.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
     const years = parseInt(yearsOfExperience, 10);
    if (isNaN(years) || years < 0 || years > 60) {
      Alert.alert('Invalid Input', 'Please enter a valid number of years of experience (0-60).');
      return;
    }
    // Basic password complexity check (optional on frontend)
     const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      return;
    }
    // --- End Validation ---


    // --- Prepare FormData ---
    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('confirmPassword', confirmPassword); // Backend re-validates
    formData.append('phoneNumber', formattedPhoneNumber); // Send the formatted number
    formData.append('yearsOfExperience', yearsOfExperience);
    formData.append('specialization', specialization);
    formData.append('workplace', workplace);
    formData.append('shortBio', shortBio);

    // Log file details before appending
    console.log("Appending Certificate:", JSON.stringify(certificateImage));
    console.log("Appending Profile Image:", JSON.stringify(profileImage));

    // Append files using the correct structure for React Native fetch
    // Ensure name and type are present!
    formData.append('professionalCertificate', {
      uri: Platform.OS === 'android' ? certificateImage.uri : certificateImage.uri.replace('file://', ''),
      type: certificateImage.type, // Should be the MIME type e.g. 'application/pdf' or 'image/jpeg'
      name: certificateImage.name // Should be the original file name e.g. 'cert.pdf' or 'doc.jpg'
    });

    formData.append('profileImage', {
      uri: Platform.OS === 'android' ? profileImage.uri : profileImage.uri.replace('file://', ''),
      type: profileImage.type, // e.g. 'image/jpeg'
      name: profileImage.name // e.g. 'photo.jpg'
    });

    // --- Send Request ---
    setIsSubmitting(true); // Show loading indicator
    try {
      const response = await fetch(`${API_BASE_URL}/expert/register`, { // Ensure '/expert/register' matches backend route
        method: 'POST',
        headers: {
          // DO NOT set 'Content-Type': 'multipart/form-data' manually.
          // Fetch does this automatically when body is FormData.
          'Accept': 'application/json', // Tell the server we expect JSON back
        },
        body: formData,
      });

      // Log raw response text for debugging if JSON parsing fails
       // const rawResponseText = await response.text();
      // console.log("Raw Server Response:", rawResponseText);
       // const responseData = JSON.parse(rawResponseText); // Manually parse if needed

      const responseData = await response.json(); // Expect JSON response

      if (response.ok) { // Status code 200-299
        Alert.alert('Success', responseData.message || 'Registration successful!');
        // Navigate away on success (e.g., to a login screen or success page)
        // navigation.navigate('Login');
      } else {
        // Handle specific error messages from the backend
        console.error('Registration Failed:', response.status, responseData);
        Alert.alert('Registration Failed', responseData.error || 'An error occurred. Please check your input and try again.');
      }
    } catch (error) {
      console.error('Network/Submission Error:', error);
      Alert.alert('Network Error', 'Could not connect to the server. Please check your internet connection and try again.');
    } finally {
      setIsSubmitting(false); // Hide loading indicator regardless of success/failure
    }
  };

  // --- Render Component ---
  return (
    <View style={styles.container}>
      {/* Back Button and Decorative Images */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { marginTop: 45 }]}>
        <Ionicons name="arrow-back" size={38} />
      </TouchableOpacity>
      <Image source={require('../assets/Images/leaf.png')} style={styles.topLeaf} />
      <Image source={require('../assets/Images/leaf.png')} style={styles.bottomLeaf} />

      {/* Scrollable Form Content */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%', marginVertical: 55 }} contentContainerStyle={{ paddingBottom: 50 }}>
        <Text style={styles.helloText}>Create Nutritionist Account</Text>
        <Text style={styles.secondaryText}>Enter your professional details</Text>

        {/* Input Fields */}
        <Text style={[styles.caloriesText, { padding: 10 }]}>First Name</Text>
        <TextInput style={styles.input} placeholder='First Name' value={firstName} onChangeText={setFirstName} />

        <Text style={[styles.caloriesText, { padding: 10 }]}>Last Name</Text>
        <TextInput style={styles.input} placeholder='Last Name' value={lastName} onChangeText={setLastName} />

        <Text style={[styles.caloriesText, { padding: 10 }]}>E-mail address</Text>
        <TextInput style={styles.input} placeholder='E-mail' keyboardType='email-address' value={email} onChangeText={setEmail} autoCapitalize="none" />

        <Text style={[styles.caloriesText, { padding: 10 }]}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput style={styles.passwordInput} placeholder='Password' secureTextEntry={!isPasswordVisible} value={password} onChangeText={setPassword} />
          <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <Icon name={isPasswordVisible ? 'eye' : 'eye-off'} size={20} style={styles.eyeIcon} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.caloriesText, { padding: 10 }]}>Confirm Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput style={styles.passwordInput} placeholder='Confirm Password' secureTextEntry={!isPasswordVisible} value={confirmPassword} onChangeText={setConfirmPassword} />
          <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <Icon name={isPasswordVisible ? 'eye' : 'eye-off'} size={20} style={styles.eyeIcon} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.caloriesText, { padding: 10 }]}>Phone number</Text>
        {/* Ensure PhoneInput is correctly configured */}
         <PhoneInput
            ref={phoneInput}
            defaultValue={phoneNumber}
            defaultCode="TN" // Or your default country
            layout="first"
            onChangeText={handlePhoneChange} // Raw number
            // onChangeFormattedText={setFormattedPhoneNumber} // Use this if the component provides it directly
            containerStyle={styles.input} // Style the container
            textInputStyle={styles.TextInput} // Style the text input part if needed
            // countryPickerButtonStyle={{}} // Style button if needed
            // textContainerStyle={{}} // Style the view around the text input
            withDarkTheme={false}
            withShadow={false}
            autoFocus={false}
          />


        <Text style={[styles.caloriesText, { padding: 10 }]}>Years of Experience</Text>
        <TextInput style={styles.input} placeholder='e.g., 5' keyboardType='numeric' value={yearsOfExperience} onChangeText={setYearsOfExperience} />

        <Text style={styles.caloriesText}>Specialization</Text>
        <View style={styles.input}>
          <Picker selectedValue={specialization} onValueChange={(itemValue) => setSpecialization(itemValue)} style={{ height: 50, width: '100%' }}>
            <Picker.Item label="Select Specialization..." value="" />
            <Picker.Item label="Clinical Nutrition" value="Clinical Nutrition" />
            <Picker.Item label="Sports Nutrition" value="Sports Nutrition" />
            <Picker.Item label="Weight Management" value="Weight Management" />
            <Picker.Item label="Pediatric Nutrition" value="Pediatric Nutrition" />
            <Picker.Item label="Digestive Health" value="Digestive Health" />
          </Picker>
        </View>

        <Text style={[styles.caloriesText, { padding: 10 }]}>Workplace</Text>
        <TextInput style={styles.input} placeholder='e.g., Clinic Name, Hospital, Self-employed' value={workplace} onChangeText={setWorkplace} />

        <Text style={[styles.caloriesText, { padding: 10 }]}>Short Bio</Text>
        <TextInput style={styles.bioInput} placeholder='Tell clients about yourself (max 500 chars)' value={shortBio} onChangeText={setShortBio} multiline={true} maxLength={500} />

        {/* File Upload Buttons and Previews */}
        <TouchableOpacity onPress={() => pickImage('certificate')} style={styles.uploadButton}>
          <Text style={styles.caloriesSubText}>Upload Certificate (PDF/Image)</Text>
          <Ionicons name='cloud-upload-outline' size={35} />
        </TouchableOpacity>
        {certificateImage && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, paddingHorizontal: 10 }}>
            <Ionicons name="document-attach-outline" size={20} color="green" style={{ marginRight: 5 }}/>
            <Text numberOfLines={1} ellipsizeMode="middle" style={{ flex: 1 }}>{certificateImage.name}</Text>
          </View>
        )}

        <TouchableOpacity onPress={() => pickImage('profile')} style={styles.uploadButton}>
          <Text style={styles.caloriesSubText}>Upload Profile Image</Text>
          <Ionicons name='image-outline' size={35} />
        </TouchableOpacity>
        {profileImage && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, paddingHorizontal: 10 }}>
            <Image source={{ uri: profileImage.uri }} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }} />
            <Text numberOfLines={1} ellipsizeMode="middle" style={{ flex: 1 }}>{profileImage.name}</Text>
          </View>
        )}

        {/* Submit Button with Loading Indicator */}
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} // Optional: style disabled state
          disabled={isSubmitting} // Disable button while submitting
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.textButton}>Create Account</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Add a disabled style to styles.js if you want visual feedback
// e.g., styles.submitButtonDisabled: { opacity: 0.6 }