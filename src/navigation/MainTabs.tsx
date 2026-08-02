import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MainTabsParamList } from './types';
import { HomeScreen } from '../screens/home/HomeScreen';
import { PracticeStack } from './PracticeStack';
import { ProgressStack } from './ProgressStack';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { useLanguage } from '../hooks/useLanguage';
import { colors, gradients } from '../constants/theme';

const Tab = createBottomTabNavigator<MainTabsParamList>();

const ICONS_OUTLINE: Record<keyof MainTabsParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Practice: 'mic-outline',
  Progress: 'stats-chart-outline',
  Profile: 'person-outline',
};

const ICONS_FILLED: Record<keyof MainTabsParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Practice: 'mic',
  Progress: 'stats-chart',
  Profile: 'person',
};

export function MainTabs() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ focused, color }) => {
          const iconName = focused ? ICONS_FILLED[route.name] : ICONS_OUTLINE[route.name];
          if (focused) {
            return (
              <LinearGradient
                colors={gradients.primaryButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activeIconWrap}
              >
                <Ionicons name={iconName} size={20} color="#fff" />
              </LinearGradient>
            );
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('tabs.home') }} />
      <Tab.Screen name="Practice" component={PracticeStack} options={{ title: t('tabs.practice') }} />
      <Tab.Screen name="Progress" component={ProgressStack} options={{ title: t('tabs.progress') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('tabs.profile') }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: Platform.OS === 'ios' ? 30 : 16,
    height: 64,
    borderRadius: 32,
    borderTopWidth: 0,
    backgroundColor: '#fff',
    shadowColor: '#4C1D95',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  tabItem: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
