import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView, // Keep for better UX
  // Linking // Keep if you add 'Open Settings' functionality
} from 'react-native';
import styles from './Styles'; // Uses styles from your original './Styles.js'
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // Used for back button, upload icons, previews
import Icon from 'react-native-vector-icons/Feather'; // Used for original password visibility toggle
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Picker } from '@react-native-picker/picker'; // Needed for Specialization
import PhoneInput from 'react-native-phone-number-input'; // Keep the phone input library

// --- Configuration ---
const API_BASE_URL = 'http://10.0.2.2:3000'; // ADJUST IF YOUR SERVER IP IS DIFFERENT

export default function NutritionForm() {

  // --- State Variables (From Corrected Logic) ---
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Used for both password fields in original structure
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); // Raw phone number input state
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState(''); // Formatted number for backend
  const [specialization, setSpecialization] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [shortBio, setShortBio] = useState('');
  // Detailed file states: { uri, name, type }
  const [profileImage, setProfileImage] = useState(null);
  const [certificateImage, setCertificateImage] = useState(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // Original used setIsPasswordVisble
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Refs ---
  const phoneInput = useRef(null); // Ref for PhoneInput library
  const navigation = useNavigation();
  const route = useRoute(); // Used for navigation and params if needed
  const { userType } = route.params || {}; // Get userType from params if needed
  // --- Request Permissions (From Corrected Logic) ---
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libraryStatus.status !== 'granted') {
          console.warn('[Permissions] Media Library permissions were not granted.');
          // Alert.alert(...); // Keep alert if needed
        }
      }
    })();
  }, []);

  // --- Phone Number Handling (From Corrected Logic) ---
  const handlePhoneChange = (number) => {
    setPhoneNumber(number); // Update raw input state
    const checkValid = phoneInput.current?.isValidNumber(number);
    if (checkValid) {
        const numberInfo = phoneInput.current?.getNumberAfterPossiblyEliminatingZero();
        setFormattedPhoneNumber(numberInfo?.formattedNumber || ''); // Store formatted number
        console.log("Formatted Phone:", numberInfo?.formattedNumber);
    } else {
        setFormattedPhoneNumber(''); // Clear if not valid
        console.log("Invalid phone number input:", number);
    }
  };

  // --- Image/Document Picking (From Corrected Logic - Robust Version) ---
  const pickImage = async (type) => {
    try {
      if (type === 'certificate') {
        console.log('[File Picker] Attempting to pick certificate...');
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
          copyToCacheDirectory: true,
        });
        console.log('[File Picker] Certificate Result:', JSON.stringify(result, null, 2));
        if (result.canceled) return;
        if (result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          if (!asset.uri || !asset.mimeType) { 
            Alert.alert('File Error', 'Could not get certificate details.');
            return;
          }
          let fileName = asset.name || `certificate_${Date.now()}.${asset.mimeType?.split('/')[1] || 'file'}`;
          const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
          if (!allowedMimeTypes.includes(asset.mimeType.toLowerCase())) { 
            Alert.alert('Invalid File Type', 'Certificate must be PDF, JPG, or PNG.');
            return;
          }
          setCertificateImage({ uri: asset.uri, name: fileName, type: asset.mimeType });
        } else { 
          Alert.alert('File Error', 'Failed to retrieve certificate.');
        }

      } else if (type === 'profile') {
        console.log('[File Picker] Attempting to pick profile image...');
        const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (status !== 'granted') { 
          Alert.alert('Permission Required', 'Photo library access needed.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.7,
        });
        console.log('[File Picker] Profile Image Result:', JSON.stringify(result, null, 2));
        if (result.canceled) return;
        if (result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          if (!asset.uri) { 
            Alert.alert('Image Error', 'Could not get image location.');
            return;
          }
          // Simplified determination from corrected logic
          let mimeType = asset.mimeType || 'image/jpeg';
          let fileExtension = 'jpg';
          const uriParts = asset.uri.split('.');
          const extFromUri = uriParts.pop()?.toLowerCase();
          if (extFromUri && ['jpg', 'jpeg', 'png'].includes(extFromUri)) {
              fileExtension = extFromUri === 'jpeg' ? 'jpg' : extFromUri;
              mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
          } else if (mimeType.startsWith('image/')) {
              const possibleExt = mimeType.split('/')[1];
              if (possibleExt && ['jpeg', 'png', 'jpg'].includes(possibleExt)) {
                  fileExtension = possibleExt === 'jpeg' ? 'jpg' : possibleExt;
              }
          }
          const validImageMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
          if (!validImageMimeTypes.includes(mimeType.toLowerCase())) {
              mimeType = 'image/jpeg'; fileExtension = 'jpg'; // Fallback
          }
          let baseName = asset.fileName || `profile_${Date.now()}`;
          const nameParts = baseName.split('.');
          if (nameParts.length > 1 && ['jpg', 'jpeg', 'png'].includes(nameParts[nameParts.length - 1].toLowerCase())) {
              nameParts.pop(); // Remove existing extension
              baseName = nameParts.join('.');
          }
          const finalFileName = `${baseName}.${fileExtension}`;
          setProfileImage({ uri: asset.uri, name: finalFileName, type: mimeType });
        } else { 
          Alert.alert('Image Error', 'Failed to retrieve image.');
        }
      }
    } catch (error) {
      console.error(`[File Picker Error] Error picking ${type}:`, error);
      Alert.alert('Error', `Failed to pick ${type}. Please try again.`);
    }
  };

  // --- Form Submission (From Corrected Logic) ---
  const handleSubmit = async () => {
    console.log('[Submit] Starting...');
    // --- Frontend Validation (Using corrected logic) ---
    let errors = [];
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedYears = yearsOfExperience.trim();

    if (!trimmedFirstName) errors.push('First Name');
    if (!trimmedLastName) errors.push('Last Name');
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) errors.push('Valid E-mail');
    if (!password) errors.push('Password');
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password)) { 
      Alert.alert('Weak Password', 'Password needs uppercase, lowercase, number, symbol (8+ chars).'); 
      return; 
    }
    if (!confirmPassword) errors.push('Confirm Password');
    else if (password !== confirmPassword) { 
      Alert.alert('Password Mismatch', 'Passwords do not match.'); 
      return; 
    }
    if (!formattedPhoneNumber) errors.push('Valid Phone Number');
    if (!trimmedYears || isNaN(parseInt(trimmedYears, 10)) || parseInt(trimmedYears, 10) < 0 || parseInt(trimmedYears, 10) > 70) { 
      errors.push('Valid Years of Experience (0-70)'); 
    }
    if (!specialization) errors.push('Specialization');
    if (!workplace.trim()) errors.push('Workplace');
    if (!shortBio.trim()) errors.push('Short Bio');
    if (!profileImage) errors.push('Profile Image');
    if (!certificateImage) errors.push('Certificate File');

    if (errors.length > 0) { 
      Alert.alert('Missing Information', `Please complete:\n- ${errors.join('\n- ')}`); 
      return; 
    }
    // --- End Validation ---

    console.log('[Submit] Validation OK. Creating FormData...');
    const formData = new FormData();
    formData.append('firstName', trimmedFirstName);
    formData.append('lastName', trimmedLastName);
    formData.append('email', trimmedEmail.toLowerCase());
    formData.append('password', password);
    formData.append('confirmPassword', confirmPassword);
    formData.append('phoneNumber', formattedPhoneNumber);
    formData.append('yearsOfExperience', trimmedYears);
    formData.append('specialization', specialization);
    formData.append('workplace', workplace.trim());
    formData.append('shortBio', shortBio.trim());
    formData.append('userType', userType || ''); 
    // Append Files (checking objects)
    if (!certificateImage || !certificateImage.uri || !certificateImage.name || !certificateImage.type) { 
      Alert.alert('File Error', 'Certificate details incomplete.'); 
      return; 
    }
    formData.append('professionalCertificate', { 
      uri: Platform.OS === 'android' ? certificateImage.uri : certificateImage.uri.replace('file://', ''), 
      type: certificateImage.type, 
      name: certificateImage.name 
    });
    if (!profileImage || !profileImage.uri || !profileImage.name || !profileImage.type) { 
      Alert.alert('File Error', 'Profile image details incomplete.'); 
      return; 
    }
    formData.append('profileImage', { 
      uri: Platform.OS === 'android' ? profileImage.uri : profileImage.uri.replace('file://', ''), 
      type: profileImage.type, 
      name: profileImage.name 
    });

    // --- Send Request ---
    setIsSubmitting(true);
    console.log('[Submit] Sending to API...');
    try {
      const response = await fetch(`${API_BASE_URL}/expert/register`, { 
        method: 'POST', 
        headers: { 'Accept': 'application/json' }, 
        body: formData 
      });
      const responseData = await response.json();
      console.log('[Submit] Response:', response.status, responseData);
      if (response.ok) {
        Alert.alert('Success', responseData.message || 'Registration successful!');
        navigation.navigate('Gratitude');
      } else {
        Alert.alert('Registration Failed', responseData.error || `Server error (${response.status}).`);
      }
    } catch (error) {
      console.error('[Submit] Network/Fetch Error:', error);
      Alert.alert('Network Error', 'Could not connect to the server. Check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Component (Using Original Structure/Styles + Corrected Logic/State) ---
  return (
    <KeyboardAvoidingView
       behavior={Platform.OS === "ios" ? "padding" : "height"}
       style={styles.container}
       keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      {/* Back Button and Leaves from original */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { marginTop: 45 }]}>
        <Ionicons name="arrow-back" size={38} />
      </TouchableOpacity>
      <Image source={require('../assets/Images/leaf.png')} style={styles.topLeaf} />
      <Image source={require('../assets/Images/leaf.png')} style={styles.bottomLeaf} />

      <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%', marginVertical: 55, paddingHorizontal: 20 }}>
        {/* Use generic title instead of relying on params */}
        <Text style={styles.helloText}>Create Nutritionist Account</Text>
        <Text style={styles.secondaryText}>Enter your professional details</Text>

        {/* --- Fields using Original Labels/Styles but Corrected State --- */}
        <Text style={[styles.caloriesText, { padding: 10 }]}>First Name</Text>
        <TextInput
            style={styles.input}
            placeholder='Enter First Name'
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            returnKeyType="next"
        />

        <Text style={[styles.caloriesText, { padding: 10 }]}>Last Name</Text>
        <TextInput
            style={styles.input}
            placeholder='Enter Last Name'
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            returnKeyType="next"
        />

        <Text style={[styles.caloriesText, { padding: 10 }]}>E-mail address</Text>
        <TextInput
            style={styles.input}
            placeholder='E-mail'
            keyboardType='email-address'
            autoCapitalize='none'
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
        />

        <Text style={[styles.caloriesText, { padding: 10 }]}>Password</Text>
        <View style={styles.passwordContainer}>
            <TextInput
                style={styles.passwordInput}
                placeholder='Password'
                secureTextEntry={!isPasswordVisible}
                value={password}
                onChangeText={setPassword}
                textContentType="newPassword"
                returnKeyType="next"
            />
            <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                <Icon name={isPasswordVisible ? 'eye' : 'eye-off'} size={20} style={styles.eyeIcon} />
            </TouchableOpacity>
        </View>

        <Text style={[styles.caloriesText, { padding: 10 }]}>Confirm Password</Text>
        <View style={styles.passwordContainer}>
            <TextInput
                style={styles.passwordInput}
                placeholder='Confirm Password'
                secureTextEntry={!isPasswordVisible}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                textContentType="newPassword"
                returnKeyType="next"
            />
            <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                <Icon name={isPasswordVisible ? 'eye' : 'eye-off'} size={20} style={styles.eyeIcon} />
            </TouchableOpacity>
        </View>

        <Text style={[styles.caloriesText, { padding: 10 }]}>Phone number</Text>
        <PhoneInput
            ref={phoneInput}
            defaultValue={phoneNumber}
            defaultCode='TN'
            layout='first'
            onChangeText={handlePhoneChange}
            containerStyle={styles.input}
            textInputStyle={styles.TextInput}
            textInputProps={{ returnKeyType: 'next' }}
            withShadow={false}
            withDarkTheme={false}
        />

        <Text style={[styles.caloriesText, { padding: 10 }]}>Years of Experience</Text>
        <TextInput
            style={styles.input}
            placeholder='e.g., 5'
            keyboardType='numeric'
            value={yearsOfExperience}
            onChangeText={setYearsOfExperience}
            returnKeyType="next"
        />

        <Text style={[styles.caloriesText, { padding: 10 }]}>Specialization</Text>
        <View style={[styles.input, { paddingHorizontal: 0, height: 55 }]}>
            <Picker
                selectedValue={specialization}
                onValueChange={(itemValue) => setSpecialization(itemValue)}
                style={{ flex: 1 }}
                prompt="Select Specialization"
            >
                <Picker.Item label="Select Specialization..." value="" enabled={false} style={{ color: 'grey' }} />
                <Picker.Item label="Clinical Nutrition" value="Clinical Nutrition" />
                <Picker.Item label="Sports Nutrition" value="Sports Nutrition" />
                <Picker.Item label="Weight Management" value="Weight Management" />
                <Picker.Item label="Pediatric Nutrition" value="Pediatric Nutrition" />
                <Picker.Item label="Digestive Health" value="Digestive Health" />
            </Picker>
        </View>

        <Text style={[styles.caloriesText, { padding: 10 }]}>Workplace</Text>
        <TextInput
            style={styles.input}
            placeholder='e.g., Clinic, Hospital, Self-employed'
            value={workplace}
            onChangeText={setWorkplace}
            returnKeyType="next"
        />

        <Text style={[styles.caloriesText, { padding: 10 }]}>Short Bio</Text>
        <TextInput
            style={styles.bioInput}
            placeholder='Tell clients about yourself (max 500 chars)'
            multiline={true}
            maxLength={500}
            value={shortBio}
            onChangeText={setShortBio}
            returnKeyType="done"
        />

        <TouchableOpacity
            onPress={() => pickImage('certificate')}
            style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor:'#FCCF94', borderRadius: 20, paddingVertical: 8, marginVertical: 10, paddingHorizontal: 15, alignItems: 'center' }}
        >
            <Text style={styles.caloriesSubText}>
                {certificateImage ? 'Change Certificate' : 'Upload Certificate\n(PDF/Image)'}
            </Text>
            <Ionicons name='document-attach-outline' size={35} />
        </TouchableOpacity>

        {certificateImage && (
          <View style={styles.filePreviewContainer}>
            <Ionicons name="checkmark-circle" size={20} color="green" style={{ marginRight: 8 }} />
            <Text numberOfLines={1} ellipsizeMode="middle" style={styles.fileNameText}>{certificateImage.name}</Text>
            <TouchableOpacity onPress={() => setCertificateImage(null)} style={styles.removeFileButton}>
               <Ionicons name="close-circle" size={22} color="#cc0000" />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
            onPress={() => pickImage('profile')}
            style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor:'#FCCF94', borderRadius: 20, paddingVertical: 8, marginVertical: 10, paddingHorizontal: 15, alignItems: 'center' }}
        >
          <Text style={styles.caloriesSubText}>
             {profileImage ? 'Change Profile Image' : 'Upload Profile Image'}
          </Text>
          <Ionicons name='image-outline' size={35} />
        </TouchableOpacity>

        {profileImage && (
          <View style={styles.filePreviewContainer}>
            <Image source={{ uri: profileImage.uri }} style={styles.profileImagePreview} />
            <Text numberOfLines={1} ellipsizeMode="middle" style={[styles.fileNameText, { flexShrink: 1 }]}>{profileImage.name}</Text>
            <TouchableOpacity onPress={() => setProfileImage(null)} style={styles.removeFileButton}>
               <Ionicons name="close-circle" size={22} color="#cc0000" />
             </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
            onPress={handleSubmit}
            style={[
                { backgroundColor:'#2E4A32', alignItems: 'center', borderRadius: 20, paddingVertical: 13, marginTop: 20, marginBottom: 50 },
                isSubmitting && { opacity: 0.6 }
            ]}
            disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.textButton}>Create Account</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

