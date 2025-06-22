import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import FastingScreen from '../screens/FastingScreen';
import StatsScreen from '../screens/StatsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import WeightEntryScreen from '../screens/WeightEntryScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Stats section
function StatsStack() {
  const { t } = useTranslation();
  
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="StatsMain" 
        component={StatsScreen} 
        options={{ title: t('navigation.statistics') }}
      />
      <Stack.Screen 
        name="WeightEntry" 
        component={WeightEntryScreen} 
        options={{ title: t('navigation.addWeight') }}
      />
    </Stack.Navigator>
  );
}

// Stack navigator for Profile section
function ProfileStack() {
  const { t } = useTranslation();
  
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ title: t('navigation.profile') }}
      />
      <Stack.Screen 
        name="Achievements" 
        component={AchievementsScreen} 
        options={{ title: t('navigation.achievements') }}
      />
    </Stack.Navigator>
  );
}

// Main tab navigator
function MainTabs() {
  const { t } = useTranslation();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Fasting') {
            iconName = focused ? 'timer' : 'timer-outline';
          } else if (route.name === 'Stats') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10
        }
      })}
    >
      <Tab.Screen 
        name="Fasting" 
        component={FastingScreen}
        options={{ title: t('navigation.timer') }}
      />
      <Tab.Screen 
        name="Stats" 
        component={StatsStack}
        options={{ title: t('navigation.stats') }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ title: t('navigation.profile') }}
      />
    </Tab.Navigator>
  );
}

// Root navigator
export default function AppNavigator({ isFirstLaunch }) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isFirstLaunch ? (
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        ) : null}
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}