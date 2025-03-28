import React, { useState, useEffect } from 'react';
import {View, Text} from 'react-native';
import styles from './Styles';
import Header from './Header';
import {auth, db} from '../firebaseConfig';
import { doc, setDoc } from "firebase/firestore";
export default function ProfileInfoSettings() {
  return (
    <View style={styles.mainContainer}>
     <Header subtitle={"My Profile"} />
     <View></View>
    </View>
  )
}

