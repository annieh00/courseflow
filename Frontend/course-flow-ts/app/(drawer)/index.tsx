import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../components/ThemeContext';
import PieChart from '../../components/PieChart';
import ProgressBar from '../../components/ProgressBar'; // import the component

export default function Home() {
  const { theme } = useTheme();
  const spacing = 0.02;

  // #TODO hardcoded percentages for three charts
  const chartData = [
    { percent: 0.45, label: 'Software Major' },
    { percent: 0.7, label: 'AI Minor' },
    { percent: 0.25, label: 'Cyber Security Minor' },
  ];

  // Calculate total progress
  const totalProgress = chartData.reduce((sum, chart) => sum + chart.percent, 0) / chartData.length;
  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Greeting */}
      <Text style={[styles.greetingText, { color: theme.text }]}>Hello Student</Text>

      {/* Pie Charts Row */}
      <View style={styles.chartsRow}>
        {chartData.map((chart, index) => {
          const segments = [
            { startAngle: 0, endAngle: 2 * Math.PI, color: '#FFC72C' },
            { startAngle: 0, endAngle: 2 * Math.PI * chart.percent - spacing, color: theme.primary },
          ];

          return (
            <View key={index} style={styles.chartContainer}>
              {/* Pie chart wrapper */}
              <View style={{ width: 180, height: 180, justifyContent: 'center', alignItems: 'center' }}>
                <PieChart size={300} strokeWidth={40} segments={segments} />

                {/* Percentage in middle */}
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    { justifyContent: 'center', alignItems: 'center' }
                  ]}
                  pointerEvents="none"
                >
                  <Text style={{ fontSize: 40, fontWeight: 'bold', color: theme.text }}>
                    {Math.round(chart.percent * 100)}%
                  </Text>
                </View>
              </View>

              {/* Label under chart */}
              <Text style={[styles.chartLabel, { color: theme.text }]}>{chart.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Total Progress Bar at bottom */}
      <View style={styles.progressContainer}>
        <Text style={[styles.progressLabel, { color: theme.text }]}>Total Progress</Text>
        <ProgressBar
          progress={totalProgress}
          width={screenWidth - 40}
          height={40}
          completedColor={theme.primary}
          remainingColor='#FFC72C'
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 40,
  },
  chartsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flex: 0.9, 
  },
  chartContainer: {
    width: 180,
    height: 200, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLabel: {
    marginTop: 70,
    fontSize: 18,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 'auto',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
  },
});
