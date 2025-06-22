import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import useStore from '../store/useStore';

const { width: screenWidth } = Dimensions.get('window');

const StatsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const {
    weeklyStats,
    loadWeeklyStats,
    weightEntries,
    currentWeight,
    dailyHydration,
    hydrationGoal,
    weeklyFastingData,
    weeklyHydrationData,
    loadWeeklyChartData
  } = useStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ title: '', content: '' });

  const [activeTab, setActiveTab] = useState('week');

  useEffect(() => {
    loadWeeklyStats();
    loadWeeklyChartData();
  }, []);

  // Process weekly fasting data from database
  const generateWeeklyFastingData = () => {
    const days = [t('days.mon'), t('days.tue'), t('days.wed'), t('days.thu'), t('days.fri'), t('days.sat'), t('days.sun')];
    const goal = 16;
    
    // Create array for last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const dayData = weeklyFastingData?.find(d => d.date === date);
      last7Days.push(dayData ? dayData.total_hours : 0);
    }
    
    return {
      labels: days,
      datasets: [{
        data: last7Days.map(hours => hours || 0.1), // Avoid zero values for chart
        color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
        strokeWidth: 3
      }]
    };
  };

  // Process weekly hydration data from database
  const generateWeeklyHydrationData = () => {
    const days = [t('days.mon'), t('days.tue'), t('days.wed'), t('days.thu'), t('days.fri'), t('days.sat'), t('days.sun')];
    const goal = 2.0; // 2 liters goal
    
    // Create array for last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const dayData = weeklyHydrationData?.find(d => d.date === date);
      const liters = dayData ? dayData.total_amount / 1000 : 0; // Convert ml to liters
      last7Days.push(liters);
    }
    
    return {
      labels: days,
      datasets: [{
        data: last7Days.map(liters => liters || 0.1), // Avoid zero values for chart
        colors: last7Days.map(liters => 
          liters >= goal ? () => '#4ECDC4' : () => '#E8F8F7'
        )
      }]
    };
  };

  const generateWeightData = () => {
    if (weightEntries.length === 0) {
      return {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          data: [70, 69.5, 69, 68.5],
          color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
          strokeWidth: 3
        }]
      };
    }

    const recentEntries = weightEntries.slice(0, 7).reverse();
    return {
      labels: recentEntries.map(entry => dayjs(entry.date).format('MMM DD')),
      datasets: [{
        data: recentEntries.map(entry => entry.weight),
        color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
        strokeWidth: 3
      }]
    };
  };

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(127, 140, 141, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#FFFFFF'
    }
  };

  const renderMetricCard = (title, value, unit, icon, color, onPress) => (
    <TouchableOpacity 
      style={[styles.metricCard, { borderLeftColor: color }]}
      onPress={onPress}
    >
      <View style={styles.metricHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <View style={styles.metricContent}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricUnit}>{unit}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderWeeklyOverview = () => (
    <View style={styles.section}>
      <View style={styles.metricsGrid}>
        {renderMetricCard(
          t('stats.totalFasts'),
          weeklyStats?.fasting?.total_sessions || '0',
          t('stats.sessions'),
          'timer-outline',
          '#FF6B6B'
        )}
        
        {renderMetricCard(
          t('stats.avgFast'),
          weeklyStats?.fasting?.avg_duration?.toFixed(1) || '0.0',
          t('stats.hours'),
          'time-outline',
          '#96CEB4'
        )}
        
        {renderMetricCard(
          t('stats.currentWeight'),
          currentWeight || (weightEntries.length > 0 ? weightEntries[0].weight.toFixed(1) : '0.0'),
          t('stats.kg'),
          'scale-outline',
          '#45B7D1',
          () => navigation.navigate('WeightEntry')
        )}
        
        {renderMetricCard(
          t('stats.weightLoss'),
          Math.abs(weeklyStats?.weightChange || 0).toFixed(1),
          t('stats.kg'),
          'trending-down-outline',
          '#4ECDC4'
        )}
        
        {renderMetricCard(
          t('stats.currentStreak'),
          weeklyStats?.currentStreak?.toString() || '0',
          t('stats.days'),
          'flame-outline',
          '#FECA57'
        )}
        
        {renderMetricCard(
          t('stats.dailyWater'),
          ((dailyHydration || 0) / 1000).toFixed(1),
          t('stats.liters'),
          'water-outline',
          '#4ECDC4'
        )}
      </View>
    </View>
  );

  const renderFastingChart = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('stats.weeklyFastingHours')}</Text>
        <TouchableOpacity>
          <Text style={styles.seeMoreText}>{t('stats.seeMore')}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.chartContainer}>
        <BarChart
          data={generateWeeklyFastingData()}
          width={screenWidth - 40}
          height={200}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
          }}
          style={styles.chart}
          showValuesOnTopOfBars
        />
      </View>
      
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
          <Text style={styles.legendText}>Goal met</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFE5E5' }]} />
          <Text style={styles.legendText}>Goal not met</Text>
        </View>
      </View>
    </View>
  );

  const renderHydrationChart = () => {
    const hydrationData = generateWeeklyHydrationData();
    
    const handleHydrationSeeMore = () => {
      const last7Days = [];
      let totalWeeklyLiters = 0;
      const goal = 2.0;
      
      for (let i = 6; i >= 0; i--) {
        const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        const dayData = weeklyHydrationData?.find(d => d.date === date);
        const liters = dayData ? dayData.total_amount / 1000 : 0;
        last7Days.push(liters);
        totalWeeklyLiters += liters;
      }
      
      const content = `${t('stats.weeklySummary')}:\n\n` +
        `${t('stats.totalWater')}: ${totalWeeklyLiters.toFixed(1)}L\n` +
        `${t('stats.averagePerDay')}: ${(totalWeeklyLiters / 7).toFixed(1)}L\n` +
        `${t('stats.daysWithGoalMet')}: ${last7Days.filter(l => l >= goal).length}/7\n` +
        `${t('stats.bestDay')}: ${Math.max(...last7Days).toFixed(1)}L\n` +
        `${t('stats.goal')}: ${goal}L ${t('stats.perDay')}`;
      
      showModal(t('stats.hydrationDetails'), content);
    };
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('stats.weeklyWaterIntake')}</Text>
          <TouchableOpacity onPress={handleHydrationSeeMore}>
             <Text style={styles.seeMoreText}>{t('stats.seeMore')}</Text>
          </TouchableOpacity>
        </View>
      
        <View style={styles.chartContainer}>
          <BarChart
            data={hydrationData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
          
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4ECDC4' }]} />
              <Text style={styles.legendText}>Goal met</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E8F8F7' }]} />
              <Text style={styles.legendText}>Goal not met</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const handleWeightSeeMore = () => {
    if (weightEntries.length === 0) {
      const content = `${t('stats.weightSummary')}:\n\n` +
        `${t('stats.currentWeight')}: 68.5 kg\n` +
        `${t('stats.startingWeight')}: 70.0 kg\n` +
        `${t('stats.weightLost')}: 1.5 kg\n` +
        `${t('stats.progress')}: ${t('stats.onTrack')}!\n` +
        `${t('stats.goal')}: ${t('stats.continueHealthyManagement')}`;
      
      showModal(t('stats.weightDetails'), content);
      return;
    }
    
    const recentEntries = weightEntries.slice(0, 7);
    const currentWeight = recentEntries[0]?.weight || 0;
    const startWeight = recentEntries[recentEntries.length - 1]?.weight || currentWeight;
    const weightChange = currentWeight - startWeight;
    const avgWeight = recentEntries.reduce((sum, entry) => sum + entry.weight, 0) / recentEntries.length;
    
    const content = `${t('stats.weightSummary')}:\n\n` +
      `${t('stats.currentWeight')}: ${currentWeight.toFixed(1)} kg\n` +
      `${t('stats.startingWeight')}: ${startWeight.toFixed(1)} kg\n` +
      `${t('stats.weightChange')}: ${weightChange >= 0 ? '+' : ''}${weightChange.toFixed(1)} kg\n` +
      `${t('stats.averageWeight')}: ${avgWeight.toFixed(1)} kg\n` +
      `${t('stats.entriesThisWeek')}: ${recentEntries.length}`;
    
    showModal(t('stats.weightDetails'), content);
  };

  const renderWeightChart = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('weight.weightTracking')}</Text>
        <TouchableOpacity onPress={handleWeightSeeMore}>
          <Text style={styles.seeMoreText}>{t('stats.seeMore')}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.chartContainer}>
        <LineChart
          data={generateWeightData()}
          width={screenWidth - 40}
          height={200}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
          }}
          style={styles.chart}
          bezier
        />
      </View>
      
      <View style={styles.weightSummary}>
        <Text style={styles.weightSummaryText}>
          {t('stats.youveLost')} <Text style={styles.weightHighlight}>1.5 kg</Text> {t('stats.thisMonth')}!
        </Text>
      </View>
    </View>
  );

  const showModal = (title, content) => {
    setModalData({ title, content });
    setModalVisible(true);
  };

  const CustomModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modalData.title}</Text>
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#7F8C8D" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>{modalData.content}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.modalButtonText}>{t('common.gotIt')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderTotalFastingHours = () => {
    const goalHours = 16;
    
    // Process real data for last 7 days
    const last7Days = [];
    let totalWeeklyHours = 0;
    
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const dayData = weeklyFastingData?.find(d => d.date === date);
      const hours = dayData ? dayData.total_hours : 0;
      last7Days.push(hours);
      totalWeeklyHours += hours;
    }
    
    const formatTotalTime = (totalHours) => {
      const hours = Math.floor(totalHours);
      const minutes = Math.round((totalHours - hours) * 60);
      return `${hours}h ${minutes}m`;
    };
    
    const handleSeeMore = () => {
      const content = `${t('stats.weeklySummary')}:\n\n` +
        `${t('stats.totalHours')}: ${formatTotalTime(totalWeeklyHours)}\n` +
        `${t('stats.averagePerDay')}: ${formatTotalTime(totalWeeklyHours / 7)}\n` +
        `${t('stats.daysWithGoalMet')}: ${last7Days.filter(h => h >= goalHours).length}/7\n` +
        `${t('stats.longestDay')}: ${formatTotalTime(Math.max(...last7Days))}\n` +
        `${t('stats.currentStreak')}: ${last7Days.slice(-3).every(h => h >= goalHours) ? t('stats.threePlusDays') : t('stats.building')}`;
      
      showModal(t('stats.fastingDetails'), content);
    };
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('stats.weeklyProgress')}</Text>
          <TouchableOpacity onPress={handleSeeMore}>
            <Text style={styles.seeMoreText}>{t('stats.seeMore')}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.totalHoursContainer}>
          <Text style={styles.totalHoursValue}>{formatTotalTime(totalWeeklyHours)}</Text>
          <Text style={styles.totalHoursPeriod}>
            {dayjs().subtract(6, 'day').format('MMM DD')} - {dayjs().format('MMM DD')}
          </Text>
          
          <View style={styles.enhancedWeeklyBars}>
            {last7Days.map((hours, index) => (
              <View key={index} style={styles.enhancedBarContainer}>
                <Text style={styles.barValue}>{hours > 0 ? Math.round(hours) : '0'}</Text>
                <View 
                  style={[
                    styles.enhancedBar,
                    { 
                      height: Math.max(hours * 8, 8),
                      backgroundColor: hours >= goalHours ? '#FF6B6B' : hours > 0 ? '#FFE5E5' : '#F0F0F0'
                    }
                  ]} 
                />
                <Text style={styles.enhancedBarLabel}>
                  {[t('days.mon'), t('days.tue'), t('days.wed'), t('days.thu'), t('days.fri'), t('days.sat'), t('days.sun')][index]}
                </Text>
              </View>
            ))}
          </View>
          
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
              <Text style={styles.legendText}>Goal met</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FFE5E5' }]} />
              <Text style={styles.legendText}>Goal not met</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderWeeklyOverview()}
        {renderHydrationChart()}
        {renderTotalFastingHours()}
        {renderWeightChart()}
      </ScrollView>
      
      <CustomModal />
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
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  titleContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  titleUnderline: {
    width: 40,
    height: 3,
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
  },
  seeMoreText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricTitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginLeft: 8,
    flex: 1,
  },
  metricContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  metricUnit: {
    fontSize: 12,
    color: '#7F8C8D',
    marginLeft: 4,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  chart: {
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  weightSummary: {
    alignItems: 'center',
    marginTop: 15,
  },
  weightSummaryText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  weightHighlight: {
    color: '#4ECDC4',
    fontWeight: 'bold',
  },
  totalHoursContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  totalHoursValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  totalHoursPeriod: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 20,
  },
  weeklyBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    height: 80,
  },
  weeklyBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyBar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 5,
  },
  weeklyBarLabel: {
    fontSize: 10,
    color: '#7F8C8D',
  },
  enhancedWeeklyBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    width: '100%',
    height: 180,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  enhancedBarContainer: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 45,
  },
  enhancedBar: {
    width: 22,
    borderRadius: 11,
    marginBottom: 8,
    minHeight: 8,
  },
  enhancedBarLabel: {
    fontSize: 11,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  barValue: {
    fontSize: 12,
    color: '#2C3E50',
    fontWeight: '600',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 0,
    width: '100%',
    maxWidth: 350,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#34495E',
    fontFamily: 'System',
  },
  modalButton: {
    backgroundColor: '#FF6B6B',
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StatsScreen;