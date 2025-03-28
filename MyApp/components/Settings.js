import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Header from './Header';
import styles from './Styles';
import TabNavigation from './TabNavigation';
import { useNavigation } from '@react-navigation/native';
export default function Settings() {
  const navigation= useNavigation();
  return (
    <View style={styles.mainContainer}>
      <Header subtitle={"Settings"}/>
      <TabNavigation/>
      <View >
        <Text style={styles.RatingEntry}>My Profile </Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Text style={styles.buttonHomeText} onPress={() => navigation.navigate('ProfileInfoSettings')}>My Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsButton}>
          <Text style={styles.buttonHomeText} onPress={() => navigation.navigate('GoalInfoSettings')}>My goals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsButton}>
          <Text style={styles.buttonHomeText} onPress={() => navigation.navigate('DieataryInfoSettings')}>My dietary preferences</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('ActivtyInfoSettings')}>
          <Text style={styles.buttonHomeText}>My activity level</Text>
        </TouchableOpacity>
      </View>
      <View >
        <Text style={styles.RatingEntry}>Others </Text>
        <TouchableOpacity style={styles.settingsButton}  onPress={() => navigation.navigate('AccountSettings')}>
          <Text style={styles.buttonHomeText}>My account</Text>
        </TouchableOpacity >
        <TouchableOpacity style={styles.settingsButton}  onPress={() => navigation.navigate('RemindersSettings')}>
          <Text style={styles.buttonHomeText}>Reminders</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.settingsButton}  onPress={() => navigation.navigate('LogOutSettings')}>
          <Text style={styles.buttonHomeText}>Log out </Text>
        </TouchableOpacity>
    </View>
  );
}
