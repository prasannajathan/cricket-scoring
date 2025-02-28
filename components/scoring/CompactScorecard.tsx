import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { 
  selectCurrentInnings, 
  selectBattingTeam, 
  selectBowlingTeam,
  selectCurrentBatsmen,
  selectCurrentBowler,
  selectMatchProgress
} from '@/store/cricket/selectors';

export default function CompactScorecard() {
  const currentInnings = useSelector(selectCurrentInnings);
  const battingTeam = useSelector(selectBattingTeam);
  const { striker, nonStriker } = useSelector(selectCurrentBatsmen);
  const currentBowler = useSelector(selectCurrentBowler);
  const { currentOver, currentBall, totalOvers } = useSelector(selectMatchProgress);

  if (!currentInnings || !striker || !nonStriker || !currentBowler) {
    return <View style={styles.container}><Text>Loading match data...</Text></View>;
  }

  return (
    <View style={styles.container}>
      {/* Team Score */}
      <View style={styles.scoreHeader}>
        <Text style={styles.teamName}>{battingTeam.name}</Text>
        <Text style={styles.score}>
          {currentInnings.totalRuns}/{currentInnings.wickets}
        </Text>
        <Text style={styles.overs}>
          {currentOver}.{currentBall}/{totalOvers}
        </Text>
      </View>

      {/* Current Batsmen */}
      <View style={styles.infoRow}>
        <View style={styles.batsmanColumn}>
          <Text style={[styles.playerName, styles.strikerName]}>
            {striker.name} {' '}
            <Text style={styles.strikerIndicator}>*</Text>
          </Text>
          <Text style={styles.batsmanStats}>
            {striker.runs}({striker.balls}) • SR: {striker.strikeRate.toFixed(1)}
          </Text>
        </View>
        <View style={styles.batsmanColumn}>
          <Text style={styles.playerName}>{nonStriker.name}</Text>
          <Text style={styles.batsmanStats}>
            {nonStriker.runs}({nonStriker.balls}) • SR: {nonStriker.strikeRate.toFixed(1)}
          </Text>
        </View>
      </View>

      {/* Current Bowler */}
      <View style={styles.bowlerRow}>
        <Text style={styles.bowlerName}>{currentBowler.name}</Text>
        <Text style={styles.bowlerStats}>
          {currentBowler.overs}.{currentBowler.ballsThisOver} • {currentBowler.runsConceded}-{currentBowler.wickets} • Econ: {currentBowler.economy.toFixed(1)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  overs: {
    fontSize: 14,
    color: '#757575',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  batsmanColumn: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  strikerName: {
    fontWeight: 'bold',
  },
  strikerIndicator: {
    color: '#D32F2F',
  },
  batsmanStats: {
    fontSize: 13,
    color: '#757575',
  },
  bowlerRow: {
    marginBottom: 4,
  },
  bowlerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  bowlerStats: {
    fontSize: 13,
    color: '#757575',
  },
});