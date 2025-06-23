import { create } from 'zustand';
import dayjs from 'dayjs';
import i18n from '../i18n';
import {
  initDatabase,
  startFastingSession,
  endFastingSession,
  getCurrentFastingSession,
  addWeightEntry,
  getWeightEntries,
  addHydrationEntry,
  getHydrationForDate,
  unlockAchievement,
  getAchievements,
  resetAchievements,
  cleanupDuplicateAchievements,
  forceCleanupDatabase,
  getFastingStats,
  getWeeklyFastingData,
  getWeeklyHydrationData,
  getCurrentStreak,
  getUserProfile,
  updateUserProfile,
  clearAllData
} from '../database/database';

const useStore = create((set, get) => ({
  // App initialization
  isInitialized: false,
  initializeApp: async () => {
    try {
      console.log('Initializing app...');
      
      // Initialize database first
      await initDatabase();
      console.log('Database initialized successfully');
      
      // Load initial data with individual error handling
      let currentSession = null;
      let achievements = [];
      let weightEntries = [];
      let userProfile = null;
      
      try {
        currentSession = await getCurrentFastingSession();
      } catch (error) {
        console.error('Failed to load current fasting session:', error);
      }
      
      try {
        achievements = await getAchievements();
      } catch (error) {
        console.error('Failed to load achievements:', error);
      }
      
      try {
        weightEntries = await getWeightEntries(30);
      } catch (error) {
        console.error('Failed to load weight entries:', error);
      }
      
      try {
        userProfile = await getUserProfile();
      } catch (error) {
        console.error('Failed to load user profile:', error);
      }
      
      set({
        isInitialized: true,
        currentFastingSession: currentSession,
        achievements: achievements || [],
        weightEntries: weightEntries || [],
        userProfile
      });
      
      console.log('App initialization completed');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      // Set as initialized even if there are errors to prevent infinite loading
      set({ isInitialized: true });
    }
  },

  // Fasting state
  currentFastingSession: null,
  fastingPresets: {
    '16:8': { fast: 16, eat: 8 },
    '18:6': { fast: 18, eat: 6 },
    '20:4': { fast: 20, eat: 4 },
    '24h': { fast: 24, eat: 0 },
    'extended': { fast: -1, eat: 0 } // -1 indicates unlimited fasting
  },
  fastingStreak: 0,
  
  // Start fasting
  startFasting: async (presetType) => {
    try {
      const sessionId = await startFastingSession(presetType);
      const session = {
        id: sessionId,
        start_time: new Date().toISOString(),
        preset_type: presetType,
        is_completed: false
      };
      
      set({ currentFastingSession: session });
      return session;
    } catch (error) {
      console.error('Failed to start fasting:', error);
      throw error;
    }
  },

  // End fasting
  endFasting: async () => {
    const { currentFastingSession } = get();
    if (!currentFastingSession) return;

    try {
      await endFastingSession(currentFastingSession.id);
      
      // Calculate duration and check for achievements
      const startTime = dayjs(currentFastingSession.start_time);
      const endTime = dayjs();
      const durationHours = endTime.diff(startTime, 'hour', true);
      
      // Check for streak achievements
      await get().checkStreakAchievements();
      
      set({ currentFastingSession: null });
    } catch (error) {
      console.error('Failed to end fasting:', error);
      throw error;
    }
  },

  // Get fasting timer info
  getFastingTimer: () => {
    const { currentFastingSession, fastingPresets } = get();
    if (!currentFastingSession) return null;

    const startTime = dayjs(currentFastingSession.start_time);
    const now = dayjs();
    const elapsed = now.diff(startTime, 'second');
    const preset = fastingPresets[currentFastingSession.preset_type];
    
    // Handle extended fasting (unlimited)
    if (preset && preset.fast === -1) {
      return {
        elapsed,
        remaining: 0,
        targetSeconds: -1, // Indicates unlimited
        isCompleted: false, // Extended fasting is never automatically completed
        startTime: startTime.toISOString(),
        presetType: currentFastingSession.preset_type,
        isExtended: true
      };
    }
    
    const targetSeconds = preset ? preset.fast * 3600 : 16 * 3600;
    const remaining = Math.max(0, targetSeconds - elapsed);

    return {
      elapsed,
      remaining,
      targetSeconds,
      isCompleted: remaining === 0,
      startTime: startTime.toISOString(),
      presetType: currentFastingSession.preset_type,
      isExtended: false
    };
  },

  // Weight tracking
  weightEntries: [],
  currentWeight: null,
  targetWeight: null,
  
  addWeight: async (weight) => {
    try {
      const date = dayjs().format('YYYY-MM-DD');
      await addWeightEntry(weight, date);
      
      const updatedEntries = await getWeightEntries(30);
      set({ 
        weightEntries: updatedEntries,
        currentWeight: weight
      });
    } catch (error) {
      console.error('Failed to add weight:', error);
      throw error;
    }
  },

  addWeightEntry: async (weight, date) => {
    try {
      await addWeightEntry(weight, date);
      
      const updatedEntries = await getWeightEntries(30);
      set({ 
        weightEntries: updatedEntries,
        currentWeight: weight
      });
    } catch (error) {
      console.error('Failed to add weight entry:', error);
      throw error;
    }
  },

  // Hydration tracking
  dailyHydration: 0,
  hydrationGoal: 2000, // ml
  
  addHydration: async (amount) => {
    try {
      const date = dayjs().format('YYYY-MM-DD');
      await addHydrationEntry(amount, date);
      
      const total = await getHydrationForDate(date);
      set({ dailyHydration: total });
    } catch (error) {
      console.error('Failed to add hydration:', error);
      throw error;
    }
  },

  loadDailyHydration: async () => {
    try {
      const date = dayjs().format('YYYY-MM-DD');
      const total = await getHydrationForDate(date);
      set({ dailyHydration: total });
    } catch (error) {
      console.error('Failed to load hydration:', error);
    }
  },

  // Achievements
  achievements: [],
  
  resetAchievements: async () => {
    try {
      await resetAchievements();
      const updatedAchievements = await getAchievements();
      set({ achievements: updatedAchievements });
    } catch (error) {
      console.error('Failed to reset achievements:', error);
    }
  },

  clearData: async () => {
    try {
      await clearAllData();
      // Reset all state to initial values
      set({
        currentFastingSession: null,
        achievements: [],
        weightEntries: [],
        userProfile: null,
        fastingStreak: 0
      });
      // Re-initialize the app to load fresh data
      const { initializeApp } = get();
      await initializeApp();
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  },

  cleanupDuplicateAchievements: async () => {
    try {
      await cleanupDuplicateAchievements();
      const updatedAchievements = await getAchievements();
      set({ achievements: updatedAchievements });
    } catch (error) {
      console.error('Failed to cleanup duplicate achievements:', error);
    }
  },

  forceCleanupDatabase: async () => {
    try {
      const result = await forceCleanupDatabase();
      const updatedAchievements = await getAchievements();
      set({ achievements: updatedAchievements });
      return result;
    } catch (error) {
      console.error('Failed to force cleanup database:', error);
      throw error;
    }
  },
  
  checkStreakAchievements: async () => {
    try {
      const currentStreak = await getCurrentStreak();
      const { achievements } = get();
      
      // Check 7-day streak
      if (currentStreak >= 7) {
        const streak7 = achievements.find(a => a.type === 'streak_7');
        if (streak7 && !streak7.is_unlocked) {
          await unlockAchievement('streak_7');
        }
      }
      
      // Check 30-day streak  
      if (currentStreak >= 30) {
        const streak30 = achievements.find(a => a.type === 'streak_30');
        if (streak30 && !streak30.is_unlocked) {
          await unlockAchievement('streak_30');
        }
      }
      
      // Check longest fast achievement
      const stats = await getFastingStats(365); // Check all time
      if (stats.avg_duration >= 24) { // 24+ hour fast
        const longestFast = achievements.find(a => a.type === 'longest_fast');
        if (longestFast && !longestFast.is_unlocked) {
          await unlockAchievement('longest_fast');
        }
      }
      
      // Reload achievements
      const updatedAchievements = await getAchievements();
      set({ achievements: updatedAchievements });
    } catch (error) {
      console.error('Failed to check achievements:', error);
    }
  },

  // Statistics
  weeklyStats: null,
  weeklyFastingData: [],
  weeklyHydrationData: [],
  
  loadWeeklyStats: async () => {
    try {
      const [fastingStats, weightEntries, currentStreak] = await Promise.all([
        getFastingStats(7),
        getWeightEntries(7),
        getCurrentStreak()
      ]);
      
      // Calculate weekly hydration total
      let totalWeeklyHydration = 0;
      for (let i = 0; i < 7; i++) {
        const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        const dailyAmount = await getHydrationForDate(date);
        totalWeeklyHydration += dailyAmount;
      }
      
      const weeklyStats = {
        fasting: fastingStats,
        weightChange: weightEntries.length >= 2 ? 
          weightEntries[0].weight - weightEntries[weightEntries.length - 1].weight : 0,
        totalHydration: totalWeeklyHydration,
        currentStreak
      };
      
      set({ weeklyStats });
    } catch (error) {
      console.error('Failed to load weekly stats:', error);
    }
  },

  // Load weekly chart data
  loadWeeklyChartData: async () => {
    try {
      const [fastingData, hydrationData] = await Promise.all([
        getWeeklyFastingData(),
        getWeeklyHydrationData()
      ]);
      
      set({ 
        weeklyFastingData: fastingData,
        weeklyHydrationData: hydrationData
      });
    } catch (error) {
      console.error('Failed to load weekly chart data:', error);
    }
  },

  // Settings
  settings: {
    reminderTime: '08:00',
    weightUnit: 'kg',
    hydrationUnit: 'ml'
  },
  
  updateSettings: (newSettings) => {
    set(state => ({
      settings: { ...state.settings, ...newSettings }
    }));
  },

  // Target weight management
  setTargetWeight: (weight) => {
    set({ targetWeight: weight });
  },

  // Export data
  exportData: async () => {
    try {
      const { weightEntries, achievements } = get();
      const fastingStats = await getFastingStats(365); // Last year
      
      const csvData = {
        weightEntries,
        fastingStats,
        achievements: achievements.filter(a => a.is_unlocked)
      };
      
      return csvData;
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  },

  // User profile management
  userProfile: null,
  
  updateUserProfile: async (profileData) => {
    try {
      const updatedProfile = await updateUserProfile(profileData);
      set({ userProfile: updatedProfile });
      return updatedProfile;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  },

  // BMI and health status calculation
  calculateBMI: (weight, height) => {
    if (!weight || !height) return null;
    const heightInMeters = height / 100; // Convert cm to meters
    return weight / (heightInMeters * heightInMeters);
  },

  getHealthStatus: (bmi) => {
    if (!bmi) return { status: i18n.t('health.unknown'), color: '#95A5A6' };
    
    if (bmi < 18.5) {
      return { status: i18n.t('health.underweight'), color: '#3498DB' };
    } else if (bmi >= 18.5 && bmi < 25) {
      return { status: i18n.t('health.normal'), color: '#27AE60' };
    } else if (bmi >= 25 && bmi < 30) {
      return { status: i18n.t('health.overweight'), color: '#F39C12' };
    } else if (bmi >= 30 && bmi < 35) {
      return { status: i18n.t('health.obeseClass1'), color: '#E67E22' };
    } else if (bmi >= 35 && bmi < 40) {
      return { status: i18n.t('health.obeseClass2'), color: '#E74C3C' };
    } else {
      return { status: i18n.t('health.obeseClass3'), color: '#8E44AD' };
    }
  }
}));

export default useStore;