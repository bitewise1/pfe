import React, { useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, ScrollView, Alert, Platform } from 'react-native';
import styles from './Styles';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker'; 
import { Picker } from '@react-native-picker/picker';
import PhoneInput from 'react-native-phone-number-input';

export default function NutritionForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countryCode, setCountryCode] = useState('TN');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [shortBio, setShortBio] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [certificateImage, setCertificate] = useState(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [yearsOfExperience, setYearsOfExperience] = useState('');

  const phoneInput = useRef(null);
  const navigation = useNavigation();
  const route = useRoute();
  const handlePhoneChange = (formattedValue) => {
    setPhoneNumber(formattedValue); // Just set the phone number
  };
  
  
  const pickImage = async (type) => {
    try {
      if (type === 'certificate') {
        const result = await DocumentPicker.getDocumentAsync({ 
          type: [
            'application/pdf', 
            'image/jpeg', 
            'image/png', 
            'image/jpg'
          ],
          copyToCacheDirectory: true,
          multiple: false
        });

        console.log('Certificate Picker Result:', result);

        if (result.type === 'success') {
          setCertificate({
            uri: result.uri,
            name: result.name,
            type: result.mimeType
          });
        }
      } else if (type === 'profile') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({ 
          mediaTypes: ImagePicker.MediaTypeOptions.Images, 
          allowsEditing: false,
          quality: 1 
        });

        console.log('Profile Image Picker Result:', result);

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const selectedImage = result.assets[0];
          
          setProfileImage({
            uri: selectedImage.uri,
            name: selectedImage.fileName || 'profile.jpg',
            type: selectedImage.type || 'image/jpeg'
          });
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (
      !firstName || 
      !lastName ||
      !email || 
      !password || 
      !confirmPassword || 
      !phoneNumber || 
      !yearsOfExperience || 
      !specialization || 
      !workplace || 
      !shortBio ||
      !profileImage || 
      !certificateImage
    ) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert('Error', 'Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character.');
      return;
    }

    // Password match
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Years of experience validation
    const years = parseInt(yearsOfExperience, 10);
    if (isNaN(years) || years < 0 || years > 50) {
      Alert.alert('Error', 'Invalid years of experience');
      return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('confirmPassword', confirmPassword);
    formData.append('phoneNumber', phoneNumber);
    formData.append('yearsOfExperience', yearsOfExperience);
    formData.append('specialization', specialization);
    formData.append('workplace', workplace);
    formData.append('shortBio', shortBio);

    // Append files
    formData.append('professionalCertificate', {
      uri: Platform.OS === 'android' ? certificateImage.uri : certificateImage.uri.replace('file://', ''),
      type: certificateImage.type,
      name: certificateImage.name
    });

    formData.append('profileImage', {
      uri: Platform.OS === 'android' ? profileImage.uri : profileImage.uri.replace('file://', ''),
      type: profileImage.type,
      name: profileImage.name
    });

    try {
      
      console.log('Phone Number:', phoneNumber);
      console.log('Final Data Sent:', { phoneNumber });
      console.log('FormData before sending:', formData);

      // TODO: Replace with your actual API endpoint
      const response = await fetch('http://10.0.2.2:3000/expert/register', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData
      });

      const responseData = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Registration successful');
        // Navigate to next screen or do something on success
      } else {
        Alert.alert('Error', responseData.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Submission Error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { marginTop: 45 }]}>
        <Ionicons name="arrow-back" size={38} />
      </TouchableOpacity>

      <Image source={require('../assets/Images/leaf.png')} style={styles.topLeaf} />
      <Image source={require('../assets/Images/leaf.png')} style={styles.bottomLeaf} />

      <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%', marginVertical: 55 }}>
        <Text style={styles.helloText}>Create Nutritionist Account</Text>
        <Text style={styles.secondaryText}>Enter your professional details</Text>

        <Text style={[styles.caloriesText, { padding: 10 }]}>First Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder='First Name' 
          value={firstName} 
          onChangeText={setFirstName} 
        />

        <Text style={[styles.caloriesText, { padding: 10 }]}>Last Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder='Last Name' 
          value={lastName} 
          onChangeText={setLastName} 
        />

        <Text style={[styles.caloriesText, { padding: 10 }]}>E-mail address</Text>
        <TextInput 
          style={styles.input} 
          placeholder='E-mail' 
          keyboardType='email-address' 
          value={email} 
          onChangeText={setEmail} 
        />

        <Text style={[styles.caloriesText, { padding: 10 }]}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput 
            style={styles.passwordInput} 
            placeholder='Password' 
            secureTextEntry={!isPasswordVisible} 
            value={password} 
            onChangeText={setPassword} 
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
          />
          <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <Icon name={isPasswordVisible ? 'eye' : 'eye-off'} size={20} style={styles.eyeIcon} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.caloriesText, { padding: 10 }]}>Phone number</Text>
        <PhoneInput
  ref={phoneInput}
  defaultCode="TN"
  layout="first"
  onChangeFormattedText={(text, data) => handlePhoneChange(text, data)}
  containerStyle={styles.input}
  textContainerStyle={styles.TextInput}
/>


        <Text style={[styles.caloriesText, { padding: 10 }]}>Years of Experience</Text>
        <TextInput 
          style={styles.input} 
          placeholder='Enter a number' 
          keyboardType='numeric' 
          value={yearsOfExperience} 
          onChangeText={setYearsOfExperience} 
        />

        <Text style={styles.caloriesText}>Specialization</Text>
        <View style={styles.input}>
          <Picker 
            selectedValue={specialization} 
            onValueChange={(itemValue) => setSpecialization(itemValue)}
          >
            <Picker.Item label="Select Specialization" value="" />
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
          placeholder='Workplace' 
          value={workplace} 
          onChangeText={setWorkplace} 
        />

        <Text style={[styles.caloriesText, { padding: 10 }]}>Short Bio</Text>
        <TextInput 
          style={styles.bioInput} 
          placeholder='Write your bio' 
          value={shortBio} 
          onChangeText={setShortBio} 
          multiline={true}
          numberOfLines={4}
        />

        <TouchableOpacity 
          onPress={() => pickImage('certificate')} 
          style={styles.uploadButton}
        >
          <Text style={styles.caloriesSubText}>Upload Professional Certificate</Text>
          <Ionicons name='download-outline' size={35} />
        </TouchableOpacity>
        {certificateImage && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
            <Text>Certificate: </Text>
            <Text numberOfLines={1} style={{ flex: 1 }}>{certificateImage.name}</Text>
          </View>
        )}

        <TouchableOpacity 
          onPress={() => pickImage('profile')} 
          style={styles.uploadButton}
        >
          <Text style={styles.caloriesSubText}>Upload Profile Image</Text>
          <Ionicons name='download-outline' size={35} />
        </TouchableOpacity>
        {profileImage && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
            <Text>Profile Image: </Text>
            <Text numberOfLines={1} style={{ flex: 1 }}>{profileImage.name}</Text>
            <Image 
              source={{ uri: profileImage.uri }} 
              style={{ width: 100, height: 100, marginLeft: 10 }} 
            />
          </View>
        )}

        <TouchableOpacity 
          onPress={handleSubmit} 
          style={styles.submitButton}
        >
          <Text style={styles.textButton}>Create your account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}