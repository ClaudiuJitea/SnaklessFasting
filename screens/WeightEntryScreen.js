import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import useStore from '../store/useStore';

const WeightEntryScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { addWeight, currentWeight, settings } = useStore();
  const [weight, setWeight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom Alert State
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertData, setCustomAlertData] = useState({
    title: '',
    message: '',
    type: 'success',
    buttons: [],
    icon: 'checkmark-circle'
  });

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

  const handleSaveWeight = async () => {
    if (!weight || isNaN(parseFloat(weight))) {
      displayCustomAlert(t('weight.invalidWeight'), t('weight.enterValidWeight'), 'error', [], 'warning');
      return;
    }

    const weightValue = parseFloat(weight);
    if (weightValue <= 0 || weightValue > 500) {
      displayCustomAlert(t('weight.invalidWeight'), t('weight.enterRealisticWeight'), 'error', [], 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await addWeight(weightValue);
      displayCustomAlert(
        t('weight.weightSaved'),
        t('weight.weightRecorded'),
        'success',
        [{ text: t('common.ok'), onPress: () => { setShowCustomAlert(false); navigation.goBack(); }, style: 'primary' }],
        'checkmark-circle'
      );
    } catch (error) {
      displayCustomAlert(t('common.error'), t('weight.failedToSave'), 'error', [], 'close-circle');
    } finally {
      setIsLoading(false);
    }
  };

  const getWeightUnit = () => {
    return settings.weightUnit || 'kg';
  };

  const getPlaceholderText = () => {
    const unit = getWeightUnit();
    return unit === 'kg' ? 'e.g., 70.5' : 'e.g., 155.5';
  };

  const getCurrentWeightDisplay = () => {
    if (!currentWeight) return t('weight.noPreviousWeight');
    return `${t('weight.current')}: ${currentWeight} ${getWeightUnit()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('weight.addWeight')}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Weight Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="scale-outline" size={60} color="#4ECDC4" />
          </View>
        </View>

        {/* Current Weight Display */}
        <View style={styles.currentWeightContainer}>
          <Text style={styles.currentWeightLabel}>{t('weight.weightTracking')}</Text>
          <Text style={styles.currentWeightValue}>{getCurrentWeightDisplay()}</Text>
          <Text style={styles.dateText}>Today, {dayjs().format('MMMM DD, YYYY')}</Text>
        </View>

        {/* Weight Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('weight.enterYourWeight')}</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.weightInput}
              value={weight}
              onChangeText={setWeight}
              placeholder={getPlaceholderText()}
              placeholderTextColor="#BDC3C7"
              keyboardType="decimal-pad"
              autoFocus
              maxLength={6}
            />
            <Text style={styles.unitText}>{getWeightUnit()}</Text>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <View style={styles.tipItem}>
            <Ionicons name="time-outline" size={16} color="#7F8C8D" />
            <Text style={styles.tipText}>Weigh yourself at the same time each day</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="trending-down-outline" size={16} color="#7F8C8D" />
            <Text style={styles.tipText}>{t('weight.morningTip')}</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#7F8C8D" />
            <Text style={styles.tipText}>Track progress, not daily fluctuations</Text>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.saveButton,
              (!weight || isLoading) && styles.saveButtonDisabled
            ]}
            onPress={handleSaveWeight}
            disabled={!weight || isLoading}
          >
            <Text style={[
              styles.saveButtonText,
              (!weight || isLoading) && styles.saveButtonTextDisabled
            ]}>
              {isLoading ? t('weight.saving') : t('weight.saveWeight')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
                    button.style === 'primary' && styles.primaryAlertButton,
                    customAlertData.buttons.length === 1 && { width: '100%' }
                  ]}
                  onPress={button.onPress}
                >
                  <Text style={[
                    styles.customAlertButtonText,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  placeholder: {
    width: 34,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0FDFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentWeightContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  currentWeightLabel: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  currentWeightValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 14,
    color: '#BDC3C7',
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  weightInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
  },
  unitText: {
    fontSize: 18,
    color: '#7F8C8D',
    fontWeight: '600',
    marginLeft: 10,
  },
  tipsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginLeft: 10,
    flex: 1,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingBottom: 20,
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#BDC3C7',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
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
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  primaryAlertButton: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  customAlertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  primaryAlertButtonText: {
    color: '#FFFFFF',
  },
});

export default WeightEntryScreen;