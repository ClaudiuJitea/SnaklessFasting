import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import AppNavigator from './navigation/AppNavigator';
import useStore from './store/useStore';
import './i18n/index.js';

export default function App() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const { initializeApp, isInitialized } = useStore();

  useEffect(() => {
    initializeAppAsync();
  }, []);

  const initializeAppAsync = async () => {
    try {
      // Check if this is the first launch
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched === null) {
        setIsFirstLaunch(true);
        await AsyncStorage.setItem('hasLaunched', 'true');
      }

      // Initialize the app
      await initializeApp();
    } catch (error) {
      console.error('Error during app initialization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator isFirstLaunch={isFirstLaunch} />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 18,
    color: '#333333',
  },
});
