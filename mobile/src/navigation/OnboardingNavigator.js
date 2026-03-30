import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';

// Core Screens
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import GenderScreen from '../screens/onboarding/GenderScreen';
import ActivityLevelScreen from '../screens/onboarding/ActivityLevelScreen';
import SourceScreen from '../screens/onboarding/SourceScreen';
import PreviousAppsScreen from '../screens/onboarding/PreviousAppsScreen';
import ProgressGraphScreen from '../screens/onboarding/ProgressGraphScreen';
import HeightWeightScreen from '../screens/onboarding/HeightWeightScreen';
import BirthdayScreen from '../screens/onboarding/BirthdayScreen';
import GoalScreen from '../screens/onboarding/GoalScreen';
import DesiredWeightScreen from '../screens/onboarding/DesiredWeightScreen';
import RealisticTargetScreen from '../screens/onboarding/RealisticTargetScreen';
import SpeedScreen from '../screens/onboarding/SpeedScreen';
import TwiceAsMuchScreen from '../screens/onboarding/TwiceAsMuchScreen';
import ObstaclesScreen from '../screens/onboarding/ObstaclesScreen';
import DietaryPrefsScreen from '../screens/onboarding/DietaryPrefsScreen';
import MotivationScreen from '../screens/onboarding/MotivationScreen';
import GreatPotentialScreen from '../screens/onboarding/GreatPotentialScreen';
import HealthConnectScreen from '../screens/onboarding/HealthConnectScreen';
import BurnedBackScreen from '../screens/onboarding/BurnedBackScreen';
import RolloverScreen from '../screens/onboarding/RolloverScreen';
import RatingScreen from '../screens/onboarding/RatingScreen';
import ReferralCodeScreen from '../screens/onboarding/ReferralCodeScreen';
import GeneratePlanScreen from '../screens/onboarding/GeneratePlanScreen';
import PlanCreationScreen from '../screens/onboarding/PlanCreationScreen';
import PlanReadyScreen from '../screens/onboarding/PlanReadyScreen';
import LoginScreen from '../screens/onboarding/LoginScreen';

const Stack = createStackNavigator();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...TransitionPresets.SlideFromRightIOS,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Gender" component={GenderScreen} />
      <Stack.Screen name="ActivityLevel" component={ActivityLevelScreen} />
      <Stack.Screen name="Source" component={SourceScreen} />
      <Stack.Screen name="PreviousApps" component={PreviousAppsScreen} />
      <Stack.Screen name="ProgressGraph" component={ProgressGraphScreen} />
      <Stack.Screen name="HeightWeight" component={HeightWeightScreen} />
      <Stack.Screen name="Birthday" component={BirthdayScreen} />
      <Stack.Screen name="Goal" component={GoalScreen} />
      <Stack.Screen name="DesiredWeight" component={DesiredWeightScreen} />
      <Stack.Screen name="RealisticTarget" component={RealisticTargetScreen} />
      <Stack.Screen name="Speed" component={SpeedScreen} />
      <Stack.Screen name="TwiceAsMuch" component={TwiceAsMuchScreen} />
      <Stack.Screen name="Obstacles" component={ObstaclesScreen} />
      <Stack.Screen name="DietaryPrefs" component={DietaryPrefsScreen} />
      <Stack.Screen name="Motivation" component={MotivationScreen} />
      <Stack.Screen name="GreatPotential" component={GreatPotentialScreen} />
      <Stack.Screen name="HealthConnect" component={HealthConnectScreen} />
      <Stack.Screen name="BurnedBack" component={BurnedBackScreen} />
      <Stack.Screen name="Rollover" component={RolloverScreen} />
      <Stack.Screen name="Rating" component={RatingScreen} />
      <Stack.Screen name="ReferralCode" component={ReferralCodeScreen} />
      <Stack.Screen name="GeneratePlan" component={GeneratePlanScreen} />
      <Stack.Screen name="PlanCreation" component={PlanCreationScreen} />
      <Stack.Screen name="PlanReady" component={PlanReadyScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
