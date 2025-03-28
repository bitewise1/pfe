import React from 'react';
import { View, Text } from 'react-native';
import Header from './Header';
import styles from './Styles';
export default function ProfessionalChat() {
  return (
    <View style={[styles.mainContainer, {backgroundColor:'#FCCF94'}]}>
      <Header subtitle={"Chat Section"}/>
    </View>
  );
}