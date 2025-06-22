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
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { useTranslation } from 'react-i18next';
import useStore from '../store/useStore';

dayjs.extend(duration);

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
    loadDailyHydration
  } = useStore();

  const [timerInfo, setTimerInfo] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('16:8');
  const [showEndFastModal, setShowEndFastModal] = useState(false);
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
        
        // Animate the progress circle
        const progress = Math.min(info.elapsed / info.targetSeconds, 1);
        
        Animated.timing(animatedValue, {
          toValue: progress,
          duration: 1000,
          useNativeDriver: false,
        }).start();
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
    return Math.min(timerInfo.elapsed / timerInfo.targetSeconds, 1);
  };

  const handleStartFasting = () => {
    const preset = fastingPresets[selectedPreset];
    startFasting(preset.fast);
  };

  const handleEndFasting = () => {
    setShowEndFastModal(true);
  };

  const confirmEndFasting = () => {
    setShowEndFastModal(false);
    endFasting();
  };

  const handleAddWater = (amount) => {
    addHydration(amount);
  };

  const renderPresetButtons = () => {
    return Object.keys(fastingPresets).map((preset) => (
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
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          {currentFastingSession && (
            <Text style={styles.headerSubtitle}>
              {timerInfo?.isCompleted ? t('fasting.fastCompleted') : `${selectedPreset} ${t('fasting.intermittentFast')}`}
            </Text>
          )}
        </View>

        {/* Timer Circle */}
        <View style={styles.timerContainer}>
          <View style={styles.timerCircle}>
            {/* Animated Progress Circle with SVG */}
            <Svg width={250} height={250} style={styles.svgCircle}>
              {/* Background Circle */}
              <Circle
                cx={125}
                cy={125}
                r={117}
                stroke="#E9ECEF"
                strokeWidth={8}
                fill="transparent"
              />
              {/* Progress Circle */}
              <AnimatedCircle
                cx={125}
                cy={125}
                r={117}
                stroke={currentFastingSession ? animatedValue.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: ['#E74C3C', '#FF6B6B', '#4ECDC4'],
                }) : 'transparent'}
                strokeWidth={8}
                fill="transparent"
                strokeDasharray={735.4}
                strokeDashoffset={currentFastingSession ? animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [735.4, 0],
                }) : 735.4}
                strokeLinecap="round"
                transform="rotate(-90 125 125)"
              />
            </Svg>
            
            {/* Progress Indicator Circle */}
            <Animated.View
              style={[
                styles.progressIndicator,
                {
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
                  <Text style={styles.elapsedLabel}>Elapsed Time</Text>
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
                  <Text style={styles.presetDisplay}>{selectedPreset}</Text>
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
            <View style={styles.sessionRow}>
              <Text style={styles.sessionLabel}>{t('fasting.fastEnding')}</Text>
              <Text style={styles.sessionValue}>
                {timerInfo ? dayjs(currentFastingSession.start_time).add(timerInfo.targetSeconds, 'second').format('MMM D, HH:mm') : '--'}
              </Text>
            </View>
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

      {/* Custom End Fast Modal */}
      <Modal
        visible={showEndFastModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEndFastModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customModalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={32} color="#E74C3C" />
            </View>
            
            <Text style={styles.modalTitle}>{t('fasting.endFasting')}</Text>
            <Text style={styles.modalMessage}>
              {t('fasting.confirmEndMessage')}
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowEndFastModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={confirmEndFasting}
              >
                <Text style={styles.confirmModalButtonText}>{t('fasting.endFast')}</Text>
              </TouchableOpacity>
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
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
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
    width: 250,
    height: 250,
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
    padding: 24,
    width: '100%',
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
  modalHeader: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
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
});

export default FastingScreen;