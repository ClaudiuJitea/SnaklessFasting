import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import useStore from '../store/useStore';

const ProfileScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const {
    settings = {},
    updateSettings,
    currentWeight,
    targetWeight,
    setTargetWeight,
    exportData,
    achievements = [],
    userProfile,
    updateUserProfile,
    addWeightEntry,
    calculateBMI,
    getHealthStatus,
    resetAchievements,
    clearData,
    cleanupDuplicateAchievements,
    weeklyStats,
    loadWeeklyStats
  } = useStore();

  const [isExporting, setIsExporting] = useState(false);
  const [showTargetWeightModal, setShowTargetWeightModal] = useState(false);
  const [showFastingGoalsModal, setShowFastingGoalsModal] = useState(false);
  const [tempTargetWeight, setTempTargetWeight] = useState('');
  const [showWeightUnitModal, setShowWeightUnitModal] = useState(false);
  const [showHydrationGoalModal, setShowHydrationGoalModal] = useState(false);
  const [tempHydrationGoal, setTempHydrationGoal] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [tempProfile, setTempProfile] = useState({
    name: userProfile?.name || '',
    age: userProfile?.age?.toString() || '',
    height: userProfile?.height?.toString() || '',
    weight: currentWeight?.toString() || '',
    gender: userProfile?.gender || 'male'
  });

  // Custom Modal States
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertData, setCustomAlertData] = useState({
    title: '',
    message: '',
    type: 'success', // success, error, warning, confirmation
    buttons: [],
    icon: 'checkmark-circle'
  });

  // Load weekly stats when component mounts
  useEffect(() => {
    if (loadWeeklyStats) {
      loadWeeklyStats();
    }
  }, [loadWeeklyStats]);

  const changeLanguage = async (languageCode) => {
    await i18n.changeLanguage(languageCode);
    setShowLanguageModal(false);
  };

  const displayCustomAlert = (title, message, type = 'success', buttons = [], icon = 'checkmark-circle') => {
    setCustomAlertData({
      title,
      message,
      type,
      buttons: buttons.length > 0 ? buttons : [
        {
          text: t('common.ok'),
          onPress: () => setShowCustomAlert(false),
          style: 'primary'
        }
      ],
      icon
    });
    setShowCustomAlert(true);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await exportData();
      
      // Convert data to CSV format
      const csvContent = generateCSV(data);
      
      // Save to file
      const fileUri = FileSystem.documentDirectory + 'fasting_data.csv';
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        displayCustomAlert(t('profile.exportComplete'), t('profile.dataExportedSuccessfully'), 'success', [], 'checkmark-circle');
      }
    } catch (error) {
      displayCustomAlert(t('profile.exportFailed'), t('profile.failedToExportData'), 'error', [], 'close-circle');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSetTargetWeight = () => {
    setTempTargetWeight(targetWeight ? targetWeight.toString() : '');
    setShowTargetWeightModal(true);
  };

  const handleSaveTargetWeight = () => {
    const weight = parseFloat(tempTargetWeight);
    if (weight && weight > 0) {
      setTargetWeight(weight);
      setShowTargetWeightModal(false);
      setTempTargetWeight('');
    } else {
      displayCustomAlert(t('weight.invalidWeight'), t('weight.enterValidWeight'), 'error', [], 'warning');
    }
  };

  const handleWeightUnitChange = () => {
    setShowWeightUnitModal(true);
  };

  const handleSelectWeightUnit = (unit) => {
    updateSettings({ weightUnit: unit });
    setShowWeightUnitModal(false);
  };

  const handleHydrationGoalChange = () => {
    setTempHydrationGoal(settings.hydrationGoal ? settings.hydrationGoal.toString() : '2000');
    setShowHydrationGoalModal(true);
  };

  const handleSaveHydrationGoal = () => {
    const goal = parseInt(tempHydrationGoal);
    if (goal && goal > 0) {
      updateSettings({ hydrationGoal: goal });
      setShowHydrationGoalModal(false);
      setTempHydrationGoal('');
    } else {
      displayCustomAlert(t('profile.invalidGoal'), t('profile.enterValidGoal'), 'error', [], 'warning');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const profileData = {
        name: tempProfile.name || t('profile.fastingJourney'),
        age: parseInt(tempProfile.age) || null,
        height: parseFloat(tempProfile.height) || null,
        gender: tempProfile.gender
      };
      
      await updateUserProfile(profileData);
      
      // Save weight as a weight entry if provided
      if (tempProfile.weight && parseFloat(tempProfile.weight) > 0) {
        await addWeightEntry(parseFloat(tempProfile.weight), new Date().toISOString());
      }
      
      setShowProfileModal(false);
      displayCustomAlert(t('common.success'), t('profile.profileUpdatedSuccessfully'), 'success', [], 'checkmark-circle');
    } catch (error) {
      console.error('Profile update error:', error);
      displayCustomAlert(t('common.error'), t('profile.failedToUpdateProfile'), 'error', [], 'close-circle');
    }
  };

  const handleEditProfile = () => {
    setTempProfile({
      name: userProfile?.name || '',
      age: userProfile?.age?.toString() || '',
      height: userProfile?.height?.toString() || '',
      weight: currentWeight?.toString() || '',
      gender: userProfile?.gender || 'male'
    });
    setShowProfileModal(true);
  };

  const handleFastingGoals = () => {
    setShowFastingGoalsModal(true);
  };

  const handleResetAchievements = () => {
    displayCustomAlert(
      t('achievements.resetTitle'), 
      t('achievements.resetMessage'), 
      'warning',
      [
        { 
          text: t('common.cancel'), 
          onPress: () => setShowCustomAlert(false),
          style: 'cancel'
        },
        { 
          text: t('achievements.resetButton'), 
          onPress: async () => {
            setShowCustomAlert(false);
            try {
              await resetAchievements();
              displayCustomAlert(t('common.success'), t('achievements.resetSuccess'), 'success', [], 'checkmark-circle');
            } catch (error) {
              displayCustomAlert(t('common.error'), t('achievements.resetError'), 'error', [], 'close-circle');
            }
          },
          style: 'destructive'
        }
      ],
      'warning'
    );
  };

  const handleCleanupDuplicateAchievements = () => {
    displayCustomAlert(
      t('achievements.cleanupTitle'), 
      t('achievements.cleanupMessage'), 
      'warning',
      [
        { 
          text: t('common.cancel'), 
          onPress: () => setShowCustomAlert(false),
          style: 'cancel'
        },
        { 
          text: t('achievements.cleanupButton'), 
          onPress: async () => {
            setShowCustomAlert(false);
            try {
              await cleanupDuplicateAchievements();
              displayCustomAlert(t('common.success'), t('achievements.cleanupSuccess'), 'success', [], 'checkmark-circle');
            } catch (error) {
              displayCustomAlert(t('common.error'), t('achievements.cleanupError'), 'error', [], 'close-circle');
            }
          },
          style: 'destructive'
        }
      ],
      'warning'
    );
  };

  const generateCSV = (data) => {
    let csv = 'Date,Weight,Fasting Hours,Achievements\n';
    
    // Add weight entries
    data.weightEntries.forEach(entry => {
      csv += `${entry.date},${entry.weight},,\n`;
    });
    
    // Add achievements
    data.achievements.forEach(achievement => {
      csv += `${achievement.unlocked_at},,${achievement.title}\n`;
    });
    
    return csv;
  };



  const renderProfileHeader = () => {
    const bmi = currentWeight && userProfile?.height ? 
      calculateBMI(currentWeight, userProfile.height) : null;
    const healthStatus = getHealthStatus(bmi);
    
    return (
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#FFFFFF" />
          </View>
        </View>
        
        <View style={styles.profileInfo}>
          <View style={styles.profileNameContainer}>
            <Text style={styles.profileName}>{userProfile?.name || t('profile.fastingJourney')}</Text>
            <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
              <Ionicons name="settings" size={24} color="#7F8C8D" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileStats}>
            {achievements ? achievements.filter(a => a.is_unlocked).length : 0} {t('profile.achievementsUnlocked')}
          </Text>
          {userProfile?.age && (
            <Text style={styles.profileAge}>{t('profile.age')}: {userProfile.age}</Text>
          )}
          {bmi && (
            <View style={styles.healthStatusContainer}>
              <View style={[styles.healthStatusDot, { backgroundColor: healthStatus.color }]} />
              <Text style={[styles.healthStatusText, { color: healthStatus.color }]}>
                {t('profile.bmi')}: {bmi.toFixed(1)} - {healthStatus.status}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{currentWeight || '--'}</Text>
        <Text style={styles.statLabel}>{t('profile.currentWeight')}</Text>
        <Text style={styles.statUnit}>kg</Text>
      </View>
      
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{targetWeight || '--'}</Text>
        <Text style={styles.statLabel}>{t('profile.targetWeight')}</Text>
        <Text style={styles.statUnit}>kg</Text>
      </View>
      
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{weeklyStats?.currentStreak || 0}</Text>
        <Text style={styles.statLabel}>{t('stats.currentStreak')}</Text>
        <Text style={styles.statUnit}>days</Text>
      </View>
    </View>
  );

  const renderMenuItem = (icon, title, subtitle, onPress, rightElement) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>
          <Ionicons name={icon} size={24} color="#7F8C8D" />
        </View>
        <View style={styles.menuText}>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      
      <View style={styles.menuItemRight}>
        {rightElement || <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderProfileHeader()}
        {renderStatsCards()}
        
        {/* Goals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.goalsProgress')}</Text>
          
          {renderMenuItem(
            'trophy-outline',
            t('navigation.achievements'),
            t('profile.viewBadges'),
            () => navigation.navigate('Achievements')
          )}
          
          {renderMenuItem(
            'scale-outline',
            t('profile.setTargetWeight'),
            targetWeight ? `${targetWeight} ${settings.weightUnit || 'kg'}` : t('common.notSet'),
            handleSetTargetWeight
          )}
          
          {renderMenuItem(
            'time-outline',
            t('profile.fastingGoals'),
            t('profile.customizeSchedule'),
            handleFastingGoals
          )}
        </View>
        
        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
          

          
          {renderMenuItem(
            'scale-outline',
            t('profile.weightUnit'),
            (settings && settings.weightUnit) || 'kg',
            handleWeightUnitChange
          )}
          
          {renderMenuItem(
            'water-outline',
            t('profile.hydrationGoal'),
            `${settings.hydrationGoal || 2000} ${settings.hydrationUnit || 'ml'} ${t('common.daily')}`,
            handleHydrationGoalChange
          )}
          
          {renderMenuItem(
            'language-outline',
            t('profile.language'),
            i18n.language === 'ro' ? t('profile.romanian') : t('profile.english'),
            () => setShowLanguageModal(true)
          )}
        </View>
        
        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.dataPrivacy')}</Text>
          
          {renderMenuItem(
            'download-outline',
            t('profile.exportData'),
            t('profile.downloadCSV'),
            handleExportData,
            isExporting ? (
              <Text style={styles.exportingText}>{t('common.exporting')}</Text>
            ) : null
          )}
          
          {renderMenuItem(
            'refresh-outline',
            'Cleanup Duplicate Achievements',
            'Remove duplicate achievements from database',
            handleCleanupDuplicateAchievements
          )}
          
          {renderMenuItem(
            'trophy-outline',
            'Reset Achievements',
            'Reset all achievements to locked state',
            handleResetAchievements
          )}
          
          {renderMenuItem(
            'trash-outline',
            t('profile.clearData'),
            t('profile.resetApp'),
            () => {
              displayCustomAlert(
                t('profile.clearData'),
                t('profile.clearDataWarning'),
                'warning',
                [
                  { 
                    text: t('common.cancel'), 
                    onPress: () => setShowCustomAlert(false),
                    style: 'cancel'
                  },
                  { 
                    text: t('profile.clearDataButton'), 
                    onPress: async () => {
                      setShowCustomAlert(false);
                      try {
                        await clearData();
                        displayCustomAlert(t('common.success'), t('profile.clearDataSuccess'), 'success', [], 'checkmark-circle');
                      } catch (error) {
                        displayCustomAlert(t('common.error'), t('profile.clearDataError'), 'error', [], 'close-circle');
                      }
                    },
                    style: 'destructive'
                  }
                ],
                'warning'
              );
            }
          )}
        </View>
        
        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.about')}</Text>
          
          <View style={styles.privacyInfo}>
            <View style={styles.privacyIconContainer}>
              <Ionicons name="shield-checkmark" size={24} color="#27AE60" />
            </View>
            <View style={styles.privacyTextContainer}>
              <Text style={styles.privacyTitle}>{t('profile.privacySecurity')}</Text>
              <Text style={styles.privacyDescription}>
                {t('profile.privacyDescription')}
              </Text>
            </View>
          </View>
          
          {renderMenuItem(
            'information-circle-outline',
            t('profile.version'),
            '1.0.0',
            () => {}
          )}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('profile.footerText')}</Text>
        </View>
      </ScrollView>

      {/* Target Weight Modal */}
      <Modal
        visible={showTargetWeightModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTargetWeightModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.setTargetWeight')}</Text>
            <TextInput
              style={styles.modalInput}
              value={tempTargetWeight}
              onChangeText={setTempTargetWeight}
              placeholder={`${t('profile.enterWeightIn')} ${settings.weightUnit || 'kg'}`}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { flex: 0, width: '48%' }]}
                onPress={() => setShowTargetWeightModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { flex: 0, width: '48%' }]}
                onPress={handleSaveTargetWeight}
              >
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Weight Unit Modal */}
      <Modal
        visible={showWeightUnitModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWeightUnitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.selectWeightUnit')}</Text>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleSelectWeightUnit('kg')}
            >
              <Text style={styles.optionText}>{t('profile.kilograms')}</Text>
              {(settings.weightUnit || 'kg') === 'kg' && (
                <Ionicons name="checkmark" size={24} color="#FF6B6B" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleSelectWeightUnit('lbs')}
            >
              <Text style={styles.optionText}>{t('profile.pounds')}</Text>
              {settings.weightUnit === 'lbs' && (
                <Ionicons name="checkmark" size={24} color="#FF6B6B" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { marginTop: 20, flex: 0, width: '100%' }]}
              onPress={() => setShowWeightUnitModal(false)}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Hydration Goal Modal */}
      <Modal
        visible={showHydrationGoalModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHydrationGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.setHydrationGoal')}</Text>
            <TextInput
              style={styles.modalInput}
              value={tempHydrationGoal}
              onChangeText={setTempHydrationGoal}
              placeholder={`${t('profile.enterGoalIn')} ${settings.hydrationUnit || 'ml'}`}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { flex: 0, width: '48%' }]}
                onPress={() => setShowHydrationGoalModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { flex: 0, width: '48%' }]}
                onPress={handleSaveHydrationGoal}
              >
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fasting Goals Modal */}
      <Modal
        visible={showFastingGoalsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFastingGoalsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Fasting Goals</Text>
            <Text style={styles.modalSubtitle}>Choose your fasting schedule</Text>
            
            <TouchableOpacity
              style={styles.fastingOption}
              onPress={() => {
                updateSettings({ fastingGoal: '16:8' });
                setShowFastingGoalsModal(false);
              }}
            >
              <View>
                <Text style={styles.fastingOptionTitle}>16:8 Intermittent Fasting</Text>
                <Text style={styles.fastingOptionDesc}>Fast for 16 hours, eat within 8 hours</Text>
              </View>
              {settings.fastingGoal === '16:8' && (
                <Ionicons name="checkmark" size={24} color="#FF6B6B" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.fastingOption}
              onPress={() => {
                updateSettings({ fastingGoal: '18:6' });
                setShowFastingGoalsModal(false);
              }}
            >
              <View>
                <Text style={styles.fastingOptionTitle}>18:6 Intermittent Fasting</Text>
                <Text style={styles.fastingOptionDesc}>Fast for 18 hours, eat within 6 hours</Text>
              </View>
              {settings.fastingGoal === '18:6' && (
                <Ionicons name="checkmark" size={24} color="#FF6B6B" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.fastingOption}
              onPress={() => {
                updateSettings({ fastingGoal: '20:4' });
                setShowFastingGoalsModal(false);
              }}
            >
              <View>
                <Text style={styles.fastingOptionTitle}>20:4 Intermittent Fasting</Text>
                <Text style={styles.fastingOptionDesc}>Fast for 20 hours, eat within 4 hours</Text>
              </View>
              {settings.fastingGoal === '20:4' && (
                <Ionicons name="checkmark" size={24} color="#FF6B6B" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.fastingOption}
              onPress={() => {
                updateSettings({ fastingGoal: '24:0' });
                setShowFastingGoalsModal(false);
              }}
            >
              <View>
                <Text style={styles.fastingOptionTitle}>24 Hour Fast</Text>
                <Text style={styles.fastingOptionDesc}>One meal a day (OMAD)</Text>
              </View>
              {settings.fastingGoal === '24:0' && (
                <Ionicons name="checkmark" size={24} color="#FF6B6B" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { marginTop: 20, flex: 0, width: '100%' }]}
              onPress={() => setShowFastingGoalsModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Profile Setup Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.editProfile')}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('profile.name')}</Text>
              <TextInput
                style={styles.modalInput}
                value={tempProfile.name}
                onChangeText={(text) => setTempProfile({...tempProfile, name: text})}
                placeholder={t('profile.enterName')}
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('profile.age')}</Text>
              <TextInput
                style={styles.modalInput}
                value={tempProfile.age}
                onChangeText={(text) => setTempProfile({...tempProfile, age: text})}
                placeholder={t('profile.enterAge')}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('profile.height')}</Text>
              <TextInput
                style={styles.modalInput}
                value={tempProfile.height}
                onChangeText={(text) => setTempProfile({...tempProfile, height: text})}
                placeholder={t('profile.enterHeight')}
                keyboardType="decimal-pad"
                maxLength={6}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('profile.weight')} ({settings.weightUnit || 'kg'})</Text>
              <TextInput
                style={styles.modalInput}
                value={tempProfile.weight}
                onChangeText={(text) => setTempProfile({...tempProfile, weight: text})}
                placeholder={t('profile.enterWeight', { unit: settings.weightUnit || 'kg' })}
                keyboardType="decimal-pad"
                maxLength={6}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('profile.gender')}</Text>
              <View style={styles.genderContainer}>
                {['male', 'female'].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderOption,
                      tempProfile.gender === gender && styles.genderOptionSelected
                    ]}
                    onPress={() => setTempProfile({...tempProfile, gender})}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      tempProfile.gender === gender && styles.genderOptionTextSelected
                    ]}>
                      {t(`profile.${gender}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { flex: 0, width: '48%' }]}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { flex: 0, width: '48%' }]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.selectLanguage')}</Text>
            
            <TouchableOpacity
              style={[
                styles.languageOption,
                i18n.language === 'en' && styles.selectedLanguageOption
              ]}
              onPress={() => changeLanguage('en')}
            >
              <Text style={[
                styles.languageOptionText,
                i18n.language === 'en' && styles.selectedLanguageOptionText
              ]}>English</Text>
              {i18n.language === 'en' && (
                <Ionicons name="checkmark" size={20} color="#FF6B6B" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.languageOption,
                i18n.language === 'ro' && styles.selectedLanguageOption
              ]}
              onPress={() => changeLanguage('ro')}
            >
              <Text style={[
                styles.languageOptionText,
                i18n.language === 'ro' && styles.selectedLanguageOptionText
              ]}>Română</Text>
              {i18n.language === 'ro' && (
                <Ionicons name="checkmark" size={20} color="#FF6B6B" />
              )}
            </TouchableOpacity>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLanguageModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Alert Modal */}
      <Modal
        visible={showCustomAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomAlert(false)}
      >
        <View style={styles.customAlertOverlay}>
          <View style={styles.customAlertContainer}>
            <View style={[styles.customAlertIconContainer, { backgroundColor: customAlertData.type === 'success' ? '#F0FDFC' : customAlertData.type === 'error' ? '#FEF2F2' : '#FFF3E0' }]}>
              <Ionicons 
                name={customAlertData.icon} 
                size={50} 
                color={customAlertData.type === 'success' ? '#4ECDC4' : customAlertData.type === 'error' ? '#E74C3C' : '#FF9800'} 
              />
            </View>
            
            <Text style={styles.customAlertTitle}>{customAlertData.title}</Text>
            <Text style={styles.customAlertMessage}>{customAlertData.message}</Text>
            
            <View style={styles.customAlertButtons}>
              {customAlertData.buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.customAlertButton,
                    button.style === 'destructive' && styles.destructiveButton,
                    button.style === 'cancel' && styles.cancelAlertButton,
                    button.style === 'primary' && styles.primaryAlertButton,
                    customAlertData.buttons.length === 1 && { width: '100%' }
                  ]}
                  onPress={button.onPress}
                >
                  <Text style={[
                    styles.customAlertButtonText,
                    button.style === 'destructive' && styles.destructiveButtonText,
                    button.style === 'cancel' && styles.cancelAlertButtonText,
                    button.style === 'primary' && styles.primaryAlertButtonText
                  ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F6',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
  },
  editButton: {
    padding: 4,
  },
  profileStats: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  profileAge: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  healthStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  healthStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  statUnit: {
    fontSize: 10,
    color: '#BDC3C7',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  menuItemRight: {
    marginLeft: 10,
  },
  exportingText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#BDC3C7',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F8F9FA',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F6',
  },
  optionText: {
    fontSize: 16,
    color: '#2C3E50',
  },
  fastingOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F6',
  },
  fastingOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  fastingOptionDesc: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  privacyInfo: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  privacyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  privacyTextContainer: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  privacyDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  genderOptionText: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#FFFFFF',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 5,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
  },
  selectedLanguageOption: {
    backgroundColor: '#FF6B6B',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  selectedLanguageOptionText: {
    color: '#FFFFFF',
  },
  // Custom Alert Modal Styles
  customAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  customAlertContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  customAlertIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  customAlertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  customAlertMessage: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  customAlertButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  customAlertButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryAlertButton: {
    backgroundColor: '#4ECDC4',
  },
  destructiveButton: {
    backgroundColor: '#E74C3C',
  },
  cancelAlertButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  customAlertButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryAlertButtonText: {
    color: '#FFFFFF',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
  cancelAlertButtonText: {
    color: '#7F8C8D',
  },
});

export default ProfileScreen;