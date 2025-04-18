
import HomeCoach from './HomeCoach';
import Invitations from './Invitations';
import Clients from './Clients';
import Messages from './Messages';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();
export default function ProfessionalNavigator(){
    return(

            <Stack.Navigator screenOptions={{headerShown: false}}> 
                <Stack.Screen name='HomeCoach' component={HomeCoach}/> 
                <Stack.Screen name='Invitations' component={Clients}/>
                <Stack.Screen name = 'Clients' component= {Invitations}/>
                <Stack.Screen name = 'Messages' component={Messages}/>
            </Stack.Navigator>

    )
}