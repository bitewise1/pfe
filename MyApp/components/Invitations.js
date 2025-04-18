import React, {useContext, useCallback, useState, useEffect} from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import styles from './Styles';
import Header from './Header';
import { useNavigation, useIsFocused} from '@react-navigation/native';
import ProTabNavigation from './ProTabNavigation';
import { AuthContext } from './AuthContext';
export default function Invitations() {
  const navigation = useNavigation();
  const isFocused = useIsFocused ();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState (null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState();
  const [filteredRequests, setFielteredRequests] = useState();
  const [processingRequest, setProcessingRequest]= useState(null);
  const API_BASE_URL = 'http://10.0.2.2:3000';
  const fetchingInvitations = (useCallback(async ()=>{
      if (!user) {
        setLoading(false);
        return;
      }
      try {
         const token = await getIdToken();
         if (!token) throw new Error ("Not authenticated");
      }catch{
        
      }
  }))

  return (
  
    <View style= {styles.mainContainer}>
        <Header subtitle={"Connection Requests "} />
        <ProTabNavigation/>
     

    </View>
  );
}
