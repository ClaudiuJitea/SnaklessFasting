import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import useStore from '../store/useStore';

const { width: screenWidth } = Dimensions.get('window');

const AchievementsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { achievements = [], checkStreakAchievements, isInitialized, forceCleanupDatabase } = useStore();

  useEffect(() => {
    console.log('AchievementsScreen: achievements data:', achievements);
    console.log('AchievementsScreen: isInitialized:', isInitialized);
    if (isInitialized) {
      checkStreakAchievements();
    }
  }, [isInitialized]);

  const handleEmergencyCleanup = async () => {
    try {
      console.log('🚨 EMERGENCY CLEANUP: Starting...');
      const result = await forceCleanupDatabase();
      console.log('🚨 EMERGENCY CLEANUP: Success!', result);
      alert(`Emergency cleanup completed! Now showing ${result.count} achievements.`);
    } catch (error) {
      console.error('🚨 EMERGENCY CLEANUP: Failed', error);
      alert('Emergency cleanup failed. Check console for details.');
    }
  };

  // Don't render until the app is initialized
  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Achievements</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show emergency cleanup if too many achievements
  if (achievements.length > 10) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🚨 Database Issue Detected</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <Ionicons name="warning" size={64} color="#FF6B6B" />
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20, textAlign: 'center' }}>
            Duplicate Achievements Detected
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginTop: 10, textAlign: 'center' }}>
            Found {achievements.length} achievements (should be 4)
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginTop: 5, textAlign: 'center' }}>
            This is causing the screen to crash. Tap below to fix:
          </Text>
          
          <TouchableOpacity 
            style={{
              backgroundColor: '#FF6B6B',
              paddingHorizontal: 30,
              paddingVertical: 15,
              borderRadius: 10,
              marginTop: 30
            }}
            onPress={handleEmergencyCleanup}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              🚨 Emergency Cleanup
            </Text>
          </TouchableOpacity>
          
          <Text style={{ fontSize: 12, color: '#999', marginTop: 15, textAlign: 'center' }}>
            This will reset achievements to the default 4 and fix the screen
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const getAchievementIcon = (type) => {
    switch (type) {
      case 'streak_7':
        return 'flame';
      case 'streak_30':
        return 'trophy';
      case 'longest_fast':
        return 'time';
      case 'weight_milestone':
        return 'trending-down';
      default:
        return 'medal';
    }
  };

  const getAchievementColor = (type, isUnlocked) => {
    if (!isUnlocked) return '#BDC3C7';
    
    switch (type) {
      case 'streak_7':
        return '#FF6B6B';
      case 'streak_30':
        return '#FFD700';
      case 'longest_fast':
        return '#4ECDC4';
      case 'weight_milestone':
        return '#96CEB4';
      default:
        return '#45B7D1';
    }
  };

  const renderAchievementCard = (achievement) => {
    if (!achievement) {
      console.warn('AchievementsScreen: achievement is null/undefined');
      return null;
    }

    const isUnlocked = Boolean(achievement.is_unlocked);
    const icon = getAchievementIcon(achievement.type || 'default');
    const color = getAchievementColor(achievement.type || 'default', isUnlocked);
    
    // Ensure title and description are strings
    const title = achievement.title ? String(achievement.title) : 'Achievement Title';
    const description = achievement.description ? String(achievement.description) : 'Achievement Description';
    
    console.log('AchievementsScreen: rendering achievement:', {
      id: achievement.id,
      type: achievement.type,
      title,
      description,
      isUnlocked
    });
    
    return (
      <View key={achievement.id || Math.random()} style={[
        styles.achievementCard,
        isUnlocked ? styles.unlockedCard : styles.lockedCard
      ]}>
        <View style={[
          styles.achievementIcon,
          { backgroundColor: isUnlocked ? color : '#F1F2F6' }
        ]}>
          <Ionicons 
            name={icon} 
            size={32} 
            color={isUnlocked ? '#FFFFFF' : '#BDC3C7'} 
          />
        </View>
        
        <View style={styles.achievementContent}>
          <Text style={[
            styles.achievementTitle,
            !isUnlocked && styles.lockedText
          ]}>
            {title}
          </Text>
          
          <Text style={[
            styles.achievementDescription,
            !isUnlocked && styles.lockedText
          ]}>
            {description}
          </Text>
          
          {isUnlocked && achievement.unlocked_at && (
            <Text style={styles.unlockedDate}>
              {String(t('achievements.unlocked') || 'Unlocked')} {dayjs(achievement.unlocked_at).format('MMM DD, YYYY')}
            </Text>
          )}
          
          {!isUnlocked && (
            <View style={styles.lockedBadge}>
              <Ionicons name="lock-closed" size={12} color="#BDC3C7" />
              <Text style={styles.lockedBadgeText}>{String(t('achievements.locked') || 'Locked')}</Text>
            </View>
          )}
        </View>
        
        {isUnlocked && (
          <View style={styles.unlockedBadge}>
            <Ionicons name="checkmark-circle" size={24} color={color} />
          </View>
        )}
      </View>
    );
  };

  const renderProgressSection = () => {
    const unlockedCount = achievements.filter(a => a && a.is_unlocked).length;
    const totalCount = achievements.length;
    const progressPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;
    
    console.log('AchievementsScreen: progress stats:', { unlockedCount, totalCount, progressPercentage });
    
    return (
      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>{String(t('achievements.yourProgress') || 'Your Progress')}</Text>
        
        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Text style={styles.progressNumber}>{String(unlockedCount)}</Text>
            <Text style={styles.progressLabel}>{String(t('achievements.unlocked') || 'Unlocked')}</Text>
          </View>
          
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill,
              { width: `${progressPercentage}%` }
            ]} />
          </View>
          
          <View style={styles.progressStat}>
            <Text style={styles.progressNumber}>{String(totalCount)}</Text>
            <Text style={styles.progressLabel}>{String(t('achievements.total') || 'Total')}</Text>
          </View>
        </View>
        
        <Text style={styles.progressDescription}>
          {progressPercentage === 100 
            ? `🎉 ${String(t('achievements.congratulations') || 'Congratulations! All achievements unlocked!')}` 
            : String(t('achievements.keepGoing', {count: totalCount - unlockedCount}) || `Keep going! ${totalCount - unlockedCount} more to unlock`)
          }
        </Text>
      </View>
    );
  };

  const renderUpcomingAchievements = () => {
    const lockedAchievements = achievements.filter(a => a && !a.is_unlocked);
    
    if (lockedAchievements.length === 0) {
      return null;
    }
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{String(t('achievements.comingUpNext') || 'Coming Up Next')}</Text>
        <Text style={styles.sectionSubtitle}>
          {String(t('achievements.keepFasting') || 'Keep fasting to unlock these achievements!')}
        </Text>
        
        {lockedAchievements.slice(0, 2).map((achievement, index) => {
          if (!achievement) return null;
          
          return (
            <View key={achievement.id || `upcoming-${index}`} style={styles.upcomingCard}>
              <View style={styles.upcomingIcon}>
                <Ionicons 
                  name={getAchievementIcon(achievement.type || 'default')} 
                  size={20} 
                  color="#7F8C8D" 
                />
              </View>
              
              <View style={styles.upcomingContent}>
                <Text style={styles.upcomingTitle}>{achievement.title ? String(achievement.title) : 'Achievement Title'}</Text>
                <Text style={styles.upcomingDescription}>{achievement.description ? String(achievement.description) : 'Achievement Description'}</Text>
              </View>
              
              <Ionicons name="lock-closed" size={16} color="#BDC3C7" />
            </View>
          );
        })}
      </View>
    );
  };

  const unlockedAchievements = achievements.filter(a => a && a.is_unlocked);
  const lockedAchievements = achievements.filter(a => a && !a.is_unlocked);

  console.log('AchievementsScreen: filtered achievements:', {
    total: achievements.length,
    unlocked: unlockedAchievements.length,
    locked: lockedAchievements.length
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderProgressSection()}
        {renderUpcomingAchievements()}
        
        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{String(t('achievements.unlockedAchievements') || 'Unlocked Achievements')}</Text>
            <Text style={styles.sectionSubtitle}>
              Great job! You've earned these badges.
            </Text>
            
            {unlockedAchievements.map(renderAchievementCard)}
          </View>
        )}
        
        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{String(t('achievements.lockedAchievements') || 'Locked Achievements')}</Text>
            <Text style={styles.sectionSubtitle}>
              Keep working towards these goals!
            </Text>
            
            {lockedAchievements.map(renderAchievementCard)}
          </View>
        )}
        
        {achievements.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color="#BDC3C7" />
            <Text style={styles.emptyTitle}>{String(t('achievements.noAchievements') || 'No Achievements Yet')}</Text>
            <Text style={styles.emptyDescription}>
              {String(t('achievements.startJourney') || 'Start your fasting journey to unlock achievements!')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  progressSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  progressStat: {
    alignItems: 'center',
    minWidth: 60,
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  progressLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    marginHorizontal: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  progressDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 20,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  unlockedCard: {
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  lockedCard: {
    backgroundColor: '#FAFBFC',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
  },
  lockedText: {
    color: '#BDC3C7',
  },
  unlockedDate: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '600',
    marginTop: 5,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  lockedBadgeText: {
    fontSize: 12,
    color: '#BDC3C7',
    marginLeft: 5,
    fontWeight: '600',
  },
  unlockedBadge: {
    marginLeft: 10,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F2F6',
  },
  upcomingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F2F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  upcomingDescription: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#BDC3C7',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#BDC3C7',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default AchievementsScreen;