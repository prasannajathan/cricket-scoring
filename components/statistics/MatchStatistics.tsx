import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { 
  selectPartnershipRecords, 
  selectMatchMilestones, 
  selectBestPerformances,
  selectTeamComparison 
} from '@/store/cricket/selectors';

export const MatchStatistics: React.FC = () => {
  const partnerships = useSelector(selectPartnershipRecords);
  const milestones = useSelector(selectMatchMilestones);
  const performances = useSelector(selectBestPerformances);
  const comparison = useSelector(selectTeamComparison);

  return (
    <View style={styles.container}>
      {/* Partnerships Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Partnerships</Text>
        {partnerships.current && (
          <Text style={styles.highlight}>
            Current: {partnerships.current.runs} runs
            ({partnerships.current.batsman1Id} & {partnerships.current.batsman2Id})
          </Text>
        )}
        <Text>Highest: {partnerships.highest?.runs || 0} runs</Text>
      </View>

      {/* Best Performances Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Best Performances</Text>
        <View style={styles.performanceRow}>
          <Text style={styles.subTitle}>Batting</Text>
          {performances.batting.map(player => (
            <Text key={player.playerId}>
              {player.runs} runs (SR: {player.strikeRate})
            </Text>
          ))}
        </View>
      </View>

      {/* Team Comparison Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Comparison</Text>
        <View style={styles.comparisonRow}>
          <Text>Run Rate: {comparison.runRateComparison.team1} vs {comparison.runRateComparison.team2}</Text>
          <Text>Boundaries: {comparison.boundaryComparison.team1} vs {comparison.boundaryComparison.team2}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  highlight: {
    color: '#1B5E20',
    fontWeight: '500',
  },
  performanceRow: {
    marginVertical: 8,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  }
});