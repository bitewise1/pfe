import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import styles from './Styles';
import Header from './Header';
import { useNavigation} from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ProTabNavigation from './ProTabNavigation';
export default function Clients() {
  const navigation = useNavigation();
  

  return (
    <View style= {styles.mainContainer}>
        <Header subtitle={"Welcome Back! "} />
        <ProTabNavigation/>
     

    </View>
  );
}
