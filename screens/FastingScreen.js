import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { useTranslation } from 'react-i18next';
import useStore from '../store/useStore';

dayjs.extend(duration);

// Get screen dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenWidth < 380 || screenHeight < 700;
const circleSize = isSmallScreen ? Math.min(screenWidth * 0.6, 200) : 250;

const FastingScreen = () => {
  const { t } = useTranslation();
  const {
    currentFastingSession,
    fastingPresets,
    startFasting,
    endFasting,
    getFastingTimer,
    dailyHydration,
    hydrationGoal,
    addHydration,
    loadDailyHydration,
    addWeight,
    currentWeight,
    settings
  } = useStore();

  const [timerInfo, setTimerInfo] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('16:8');
  const [showEndFastModal, setShowEndFastModal] = useState(false);
  const [weight, setWeight] = useState('');
  const [skipWeightEntry, setSkipWeightEntry] = useState(false);
  const [isSubmittingWeight, setIsSubmittingWeight] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const animatedValue = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadDailyHydration();
    
    // Reset animated value when fasting session starts/ends
    if (currentFastingSession) {
      const info = getFastingTimer();
      if (info) {
        const progress = Math.min(info.elapsed / info.targetSeconds, 1);
        animatedValue.setValue(progress);
      }
    } else {
      animatedValue.setValue(0);
    }
    
    const interval = setInterval(() => {
      if (currentFastingSession) {
        const info = getFastingTimer();
        setTimerInfo(info);
        
        // Animate the progress circle (only for timed fasting)
        if (!info.isExtended) {
          const progress = Math.min(info.elapsed / info.targetSeconds, 1);
          
          Animated.timing(animatedValue, {
            toValue: progress,
            duration: 1000,
            useNativeDriver: false,
          }).start();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentFastingSession]);

  const formatTime = (seconds) => {
    const duration = dayjs.duration(seconds, 'seconds');
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const secs = duration.seconds();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCircleProgress = () => {
    if (!timerInfo) return 0;
    if (timerInfo.isExtended) return 0; // No progress circle for extended fasting
    return Math.min(timerInfo.elapsed / timerInfo.targetSeconds, 1);
  };

  const handleStartFasting = () => {
    const preset = fastingPresets[selectedPreset];
    startFasting(preset.fast);
  };

  const handleEndFasting = () => {
    setShowEndFastModal(true);
  };

  const confirmEndFasting = async () => {
    setIsSubmittingWeight(true);
    
    try {
      // If weight is provided and valid, save it first
      if (weight && !skipWeightEntry) {
        const weightValue = parseFloat(weight);
        if (weightValue > 0 && weightValue <= 500) {
          await addWeight(weightValue);
        }
      }
      
      // End the fasting session
      await endFasting();
      
      setShowEndFastModal(false);
      setWeight('');
      setSkipWeightEntry(false);
      
      // Show custom success modal
      const message = weight && !skipWeightEntry 
        ? t('fasting.fastEndedWithWeight')
        : t('fasting.fastEnded');
      setSuccessMessage(message);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error ending fast:', error);
      setSuccessMessage(t('fasting.errorEndingFast'));
      setShowSuccessModal(true);
    } finally {
      setIsSubmittingWeight(false);
    }
  };

  const getWeightUnit = () => {
    return settings?.weightUnit || 'kg';
  };

  const getPlaceholderText = () => {
    const unit = getWeightUnit();
    return unit === 'kg' ? 'e.g., 70.5' : 'e.g., 155.5';
  };

  const handleAddWater = (amount) => {
    addHydration(amount);
  };

  const getLocalizedPresetName = (preset) => {
    if (preset === 'extended') {
      return t('fasting.extended');
    }
    return preset;
  };

  const renderPresetButtons = () => {
    const presets = Object.keys(fastingPresets);
    const regularPresets = presets.filter(preset => preset !== 'extended');
    const extendedPreset = presets.find(preset => preset === 'extended');

    return (
      <>
        {/* Regular presets in 2x2 grid */}
        {regularPresets.map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[
              styles.presetButton,
              selectedPreset === preset && styles.selectedPreset
            ]}
            onPress={() => setSelectedPreset(preset)}
            disabled={!!currentFastingSession}
          >
            <Text style={[
              styles.presetText,
              selectedPreset === preset && styles.selectedPresetText
            ]}>
              {preset}
            </Text>
          </TouchableOpacity>
        ))}
        
        {/* Extended preset as full-width button */}
        {extendedPreset && (
          <TouchableOpacity
            key={extendedPreset}
            style={[
              styles.presetButton,
              styles.extendedPresetButton,
              selectedPreset === extendedPreset && styles.selectedPreset
            ]}
            onPress={() => setSelectedPreset(extendedPreset)}
            disabled={!!currentFastingSession}
          >
            <Text style={[
              styles.presetText,
              selectedPreset === extendedPreset && styles.selectedPresetText
            ]}>
              {t('fasting.extended')}
            </Text>
          </TouchableOpacity>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          {currentFastingSession && (
            <Text style={[styles.headerSubtitle, isSmallScreen && styles.headerSubtitleSmall]}>
              {timerInfo?.isCompleted ? t('fasting.fastCompleted') : 
               timerInfo?.isExtended ? t('fasting.extendedFasting') :
               selectedPreset === 'extended' ? t('fasting.extendedFasting') :
               `${selectedPreset} ${t('fasting.intermittentFast')}`}
            </Text>
          )}
        </View>

        {/* Timer Circle */}
        <View style={styles.timerContainer}>
          <View style={styles.timerCircle}>
            {/* Animated Progress Circle with SVG */}
            <Svg width={circleSize} height={circleSize} style={styles.svgCircle}>
              {/* Background Circle */}
              <Circle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={circleSize / 2 - 8}
                stroke="#E9ECEF"
                strokeWidth={8}
                fill="transparent"
              />
              {/* Progress Circle */}
              <AnimatedCircle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={circleSize / 2 - 8}
                stroke={currentFastingSession ? animatedValue.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: ['#E74C3C', '#FF6B6B', '#4ECDC4'],
                }) : 'transparent'}
                strokeWidth={8}
                fill="transparent"
                strokeDasharray={2 * Math.PI * (circleSize / 2 - 8)}
                strokeDashoffset={currentFastingSession ? animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [2 * Math.PI * (circleSize / 2 - 8), 0],
                }) : 2 * Math.PI * (circleSize / 2 - 8)}
                strokeLinecap="round"
                transform={`rotate(-90 ${circleSize / 2} ${circleSize / 2})`}
              />
            </Svg>
            
            {/* Progress Indicator Circle */}
            <Animated.View
              style={[
                styles.progressIndicator,
                {
                  width: circleSize,
                  height: circleSize,
                  transform: [
                    {
                      rotate: currentFastingSession ? animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }) : '0deg',
                    },
                  ],
                },
              ]}
            >
              <Animated.View style={[
                styles.indicatorCircle,
                { 
                  backgroundColor: currentFastingSession ? animatedValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: ['#E74C3C', '#FF6B6B', '#4ECDC4'],
                  }) : '#E74C3C'
                }
              ]} />
            </Animated.View>
            
            <View style={styles.timerContent}>
              {currentFastingSession ? (
                <>
                  <Text style={styles.elapsedLabel}>{t('fasting.elapsedTime')}</Text>
                  <Text style={styles.timerText}>
                    {timerInfo ? formatTime(timerInfo.elapsed) : '00:00:00'}
                  </Text>
                  {timerInfo?.isCompleted && (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.readyText}>{t('fasting.readyToStart')}</Text>
                  <Text style={[styles.presetDisplay, isSmallScreen && styles.presetDisplaySmall]} numberOfLines={2} adjustsFontSizeToFit>{getLocalizedPresetName(selectedPreset)}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Preset Selection or Session Info */}
        {!currentFastingSession ? (
          <View style={styles.presetsContainer}>
            <Text style={styles.presetsTitle}>{t('fasting.chooseFastingWindow')}</Text>
            <View style={styles.presetsGrid}>
              {renderPresetButtons()}
            </View>
          </View>
        ) : (
          <View style={styles.sessionInfo}>
            <View style={styles.sessionRow}>
              <Text style={styles.sessionLabel}>{t('fasting.started')}</Text>
              <Text style={styles.sessionValue}>
                {dayjs(currentFastingSession.start_time).format('MMM D, HH:mm')}
              </Text>
            </View>
            {timerInfo?.isExtended ? (
              <View style={styles.sessionRow}>
                <Text style={styles.sessionLabel}>{t('fasting.fastType')}</Text>
                <Text style={styles.sessionValue}>
                  {t('fasting.extendedFasting')}
                </Text>
              </View>
            ) : (
              <View style={styles.sessionRow}>
                <Text style={styles.sessionLabel}>{t('fasting.fastEnding')}</Text>
                <Text style={styles.sessionValue}>
                  {timerInfo ? dayjs(currentFastingSession.start_time).add(timerInfo.targetSeconds, 'second').format('MMM D, HH:mm') : '--'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Hydration Section */}
        <View style={styles.hydrationContainer}>
          <View style={styles.hydrationHeader}>
            <Ionicons name="water" size={24} color="#4ECDC4" />
            <Text style={styles.hydrationTitle}>{t('fasting.water')}</Text>
            <View style={styles.hydrationProgress}>
              <Text style={styles.hydrationText}>{dailyHydration}</Text>
              <Text style={styles.hydrationUnit}>{t('fasting.mlOf', {goal: hydrationGoal})}</Text>
            </View>
          </View>
          
          <View style={styles.waterButtons}>
            <TouchableOpacity 
              style={styles.waterButton}
              onPress={() => handleAddWater(250)}
            >
              <Text style={styles.waterButtonText}>{t('fasting.add250ml')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.waterButton}
              onPress={() => handleAddWater(500)}
            >
              <Text style={styles.waterButtonText}>{t('fasting.add500ml')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.waterButtons}>
            <TouchableOpacity 
              style={styles.removeWaterButton}
              onPress={() => handleAddWater(-250)}
            >
              <Text style={styles.removeWaterButtonText}>{t('fasting.remove250ml')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.removeWaterButton}
              onPress={() => handleAddWater(-500)}
            >
              <Text style={styles.removeWaterButtonText}>{t('fasting.remove500ml')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Button */}
        {!currentFastingSession ? (
          <TouchableOpacity 
            style={styles.startButton}
            onPress={handleStartFasting}
          >
            <Text style={styles.startButtonText}>{t('fasting.startFasting')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.endButton}
            onPress={handleEndFasting}
          >
            <Text style={styles.endButtonText}>{t('fasting.endFast')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Custom End Fast Modal with Weight Entry */}
      <Modal
        visible={showEndFastModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEndFastModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.customModalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Ionicons name="checkmark-circle" size={32} color="#4ECDC4" />
              </View>
              
              <Text style={styles.modalTitle}>{t('fasting.endFasting')}</Text>
              <Text style={styles.modalMessage}>
                {t('fasting.congratulationsMessage')}
              </Text>
              
              {/* Weight Entry Section */}
              <View style={styles.weightEntrySection}>
                <Text style={styles.weightSectionTitle}>{t('fasting.updateWeight')}</Text>
                <Text style={styles.weightSectionSubtitle}>{t('fasting.trackProgress')}</Text>
                
                {!skipWeightEntry && (
                  <View style={styles.weightInputContainer}>
                    <View style={styles.weightInputWrapper}>
                      <TextInput
                        style={styles.weightInput}
                        value={weight}
                        onChangeText={setWeight}
                        placeholder={getPlaceholderText()}
                        placeholderTextColor="#BDC3C7"
                        keyboardType="decimal-pad"
                        maxLength={6}
                      />
                      <Text style={styles.weightUnitText}>{getWeightUnit()}</Text>
                    </View>
                    
                    {currentWeight && (
                      <Text style={styles.previousWeightText}>
                        {t('weight.current')}: {currentWeight} {getWeightUnit()}
                      </Text>
                    )}
                  </View>
                )}
                
                <TouchableOpacity
                  style={styles.skipWeightButton}
                  onPress={() => setSkipWeightEntry(!skipWeightEntry)}
                >
                  <Ionicons 
                    name={skipWeightEntry ? "checkbox" : "square-outline"} 
                    size={20} 
                    color="#7F8C8D" 
                  />
                  <Text style={styles.skipWeightText}>{t('fasting.skipWeightEntry')}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => {
                    setShowEndFastModal(false);
                    setWeight('');
                    setSkipWeightEntry(false);
                  }}
                  disabled={isSubmittingWeight}
                >
                  <Text style={styles.cancelModalButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmModalButton]}
                  onPress={confirmEndFasting}
                  disabled={isSubmittingWeight}
                >
                  <Text style={styles.confirmModalButtonText}>
                    {isSubmittingWeight ? t('common.saving') : t('fasting.completeFast')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContainer}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={60} color="#4ECDC4" />
            </View>
            
            <Text style={styles.successModalTitle}>{t('fasting.fastCompleted')}</Text>
            <Text style={styles.successModalMessage}>{successMessage}</Text>
            
            <TouchableOpacity
              style={styles.successModalButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.successModalButtonText}>{t('common.ok') || 'OK'}</Text>
            </TouchableOpacity>
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
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7F8C8D',
    textAlign: 'center',
    paddingHorizontal: 10,
    flexWrap: 'wrap',
  },
  headerSubtitleSmall: {
    fontSize: 14,
    lineHeight: 18,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerCircle: {
    width: circleSize,
    height: circleSize,
    borderRadius: circleSize / 2,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svgCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  progressIndicator: {
    position: 'absolute',
    justifyContent: 'flex-start',
    alignItems: 'center',
    top: 0,
    left: 0,
  },
  indicatorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginTop: -2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  timerContent: {
    alignItems: 'center',
  },
  elapsedLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  timerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  readyText: {
    fontSize: 18,
    color: '#7F8C8D',
    marginBottom: 10,
  },
  presetDisplay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  presetDisplaySmall: {
    fontSize: 18,
    lineHeight: 22,
  },
  completedBadge: {
    marginTop: 10,
  },
  presetsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  presetsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 20,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  presetButton: {
    width: '48%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    marginBottom: 10,
    alignItems: 'center',
  },
  extendedPresetButton: {
    width: '100%',
    marginTop: 5,
  },
  selectedPreset: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  presetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  selectedPresetText: {
    color: '#FFFFFF',
  },
  sessionInfo: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionLabel: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  sessionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  hydrationContainer: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  hydrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  hydrationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 10,
    flex: 1,
  },
  hydrationProgress: {
    alignItems: 'flex-end',
  },
  hydrationText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  hydrationUnit: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  waterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  waterButton: {
    flex: 1,
    backgroundColor: '#4ECDC4',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  waterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  removeWaterButton: {
    flex: 1,
    backgroundColor: '#E74C3C',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  removeWaterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    width: '100%',
    backgroundColor: '#FF6B6B',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  endButton: {
    width: '100%',
    backgroundColor: '#E74C3C',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Custom Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  customModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 350,
    maxHeight: '85%',
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
  modalHeader: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0FDFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  confirmModalButton: {
    backgroundColor: '#E74C3C',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  confirmModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Weight Entry Modal Styles
  weightEntrySection: {
    width: '100%',
    marginBottom: 16,
  },
  weightSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 3,
    textAlign: 'center',
  },
  weightSectionSubtitle: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 12,
  },
  weightInputContainer: {
    marginBottom: 12,
  },
  weightInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  weightInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
    padding: 0,
  },
  weightUnitText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '600',
    marginLeft: 8,
  },
  previousWeightText: {
    fontSize: 11,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 6,
  },
  skipWeightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  skipWeightText: {
    fontSize: 12,
    color: '#7F8C8D',
    marginLeft: 6,
  },
  // Custom Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxWidth: 320,
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
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
  successModalMessage: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  successModalButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: '#4ECDC4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  successModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FastingScreen;