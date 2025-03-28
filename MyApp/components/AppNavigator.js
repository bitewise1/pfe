import WelcomeScreen from './WelcomeScreen';
import NameScreen from './NameScreen';
import LogIn from './LogIn';
import ResetPassword from './ResetPassword';
import UserType from './UserType';
import GoalScreen from './goalScreen';
import NutritionForm from './NutritionForm';
import SettingProfile from './SettingProfile';
import MotivationalScreen from './MotivationalScreen';
import TransformationScreen from './TransformationScreen';
import DietaryPreferences from './dietaryPreferences';
import ActivityLevel from './ActivityLevel';
import Gratitude from './Gratitude';
import SignUp from './SignUp';
import Home from './Home';
import Chatbot from './Chatbot';
import Profile from './Profile';
import Recipes from './recipes';
import Notifications from './Notifications';
import Settings from './Settings';
import NutritionSection from './NutritionSection';
import NutritionPlan from './NutritionPlan';
import AddMeal from './AddMeal'
import ActivityScreen from './ActivityScreen';
import NutritionistInfo from './NutritionistInfo';
import MessagesGuidance from './MessagesGuidance';
import ProfessionalChat from './ProfessionalChat';
import ProfileInfoSettings from './ProfileInfoSettings';
import GoalInfoSettings from './GoalsInfoSettings';
import DieataryInfoSettings from './DieataryInfoSettings';
import ActivtyInfoSettings from './ActivtyInfoSettings';
import AccountSettings from './AccountSettings';
import RemindersSettings from './RemindersSettings';
import LogOutSettings from './LogOutSettings';

import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';



const Stack = createStackNavigator();
export default function AppNavigator(){
    return(
        <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}> 
                <Stack.Screen name='WelcomeScreen' component={WelcomeScreen}/> 
                <Stack.Screen name='LogIn' component={LogIn} />
                <Stack.Screen name='UserType' component={UserType}/>
                <Stack.Screen name='SignUp' component={SignUp}/>
                <Stack.Screen name='NameScreen' component={NameScreen} />
                <Stack.Screen name='ResetPassword' component={ResetPassword}/>
                <Stack.Screen name='GoalScreen' component={GoalScreen}/>
                <Stack.Screen name= 'SettingProfile' component={SettingProfile}/>
                <Stack.Screen name='NutritionForm' component={NutritionForm}/>
                <Stack.Screen name='MotivationalScreen' component={MotivationalScreen}/>
                <Stack.Screen name='TransformationScreen' component={TransformationScreen}/>
                <Stack.Screen name='DietaryPreferences' component={DietaryPreferences}/>
                <Stack.Screen name='ActivityLevel' component={ActivityLevel}/>
                <Stack.Screen name='Gratitude' component={Gratitude}/>
                <Stack.Screen name='Home' component={Home}/>
                <Stack.Screen name='Chatbot' component={Chatbot}/>
                <Stack.Screen name='Profile' component={Profile}/>
                <Stack.Screen name='Recipes' component={Recipes}/>
                <Stack.Screen name='NutritionSection' component={NutritionSection}/>
                <Stack.Screen name='Notifications' component={Notifications}/>
                <Stack.Screen name='Settings' component={Settings}/>
                <Stack.Screen name='NutritionPlan' component={NutritionPlan}/>
                <Stack.Screen name ='AddMeal' component={AddMeal}/>
                <Stack.Screen name ='ActivityScreen' component={ActivityScreen}/>
                <Stack.Screen name = 'NutritionistInfo' component={NutritionistInfo}/>
                <Stack.Screen name = 'MessagesGuidance' component={MessagesGuidance}/>
                <Stack.Screen name = 'ProfessionalChat' component={ProfessionalChat}/> 
                <Stack.Screen name = 'ProfileInfoSettings' component={ProfileInfoSettings} />
                <Stack.Screen name = 'GoalInfoSettings' component={GoalInfoSettings}/>
                <Stack.Screen name = 'DieataryInfoSettings' component={DieataryInfoSettings} />
                <Stack.Screen name = 'ActivtyInfoSettings' component={ActivtyInfoSettings} />
                <Stack.Screen name = 'AccountSettings' component={AccountSettings} />
                <Stack.Screen name = 'RemindersSettings' component={RemindersSettings}/>
                <Stack.Screen name = 'LogOutSettings' component={LogOutSettings}/>

            </Stack.Navigator>
        </NavigationContainer>
    );
}