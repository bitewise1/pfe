
import HomeCoach from './HomeCoach';

import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();
export default function ProfessionalNavigator(){
    return(

            <Stack.Navigator screenOptions={{headerShown: false}}> 
                <Stack.Screen name='HomeCoach' component={HomeCoach}/> 
                
            </Stack.Navigator>

    )
}