import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
    Team,
    InningsData,
    Cricketer,
    ScoreboardState
} from '@/types';
import { getBattingOrder } from '@/utils/scorecardTab';

// --------------------------------------------------------------------------
// BatsmanRow
// --------------------------------------------------------------------------
interface BatsmanRowProps {
    player: Cricketer;
    dismissalInfo: string;
    isStriker?: boolean;
    isNonStriker?: boolean;
  }
  const BatsmanRow: React.FC<BatsmanRowProps> = ({
    player,
    dismissalInfo,
    isStriker = false,
    isNonStriker = false
  }) => {
    const sr = player.balls > 0
      ? ((player.runs / player.balls) * 100).toFixed(1)
      : '0.0';
  
    return (
      <View style={styles.scoreRow}>
        <View style={[styles.scoreCell, styles.nameCell]}>
          <Text style={styles.playerName}>
            {player.name}
            {isStriker ? ' *' : ''}
            {isNonStriker ? ' †' : ''}
          </Text>
          {dismissalInfo ? (
            <Text style={styles.dismissalInfo}>{dismissalInfo}</Text>
          ) : null}
        </View>
        <Text style={styles.scoreCell}>{player.runs || 0}</Text>
        <Text style={styles.scoreCell}>{player.balls || 0}</Text>
        <Text style={styles.scoreCell}>{player.fours || 0}</Text>
        <Text style={styles.scoreCell}>{player.sixes || 0}</Text>
        <Text style={styles.scoreCell}>{sr}</Text>
      </View>
    );
  };
  
  // --------------------------------------------------------------------------
  // BowlerRow
  // --------------------------------------------------------------------------
  interface BowlerRowProps {
    player: Cricketer;
    isBowling?: boolean;
  }
  const BowlerRow: React.FC<BowlerRowProps> = ({ player, isBowling = false }) => {
    const oversFraction = player.overs + player.ballsThisOver / 6;
    const econ = oversFraction > 0
      ? (player.runsConceded / oversFraction).toFixed(2)
      : '0.00';
  
    const oversText = `${player.overs}.${player.ballsThisOver}`;
    return (
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreCell, styles.nameCell]}>
          {player.name}
          {isBowling ? ' *' : ''}
        </Text>
        <Text style={styles.scoreCell}>{oversText}</Text>
        <Text style={styles.scoreCell}>{player.maidens || 0}</Text>
        <Text style={styles.scoreCell}>{player.runsConceded}</Text>
        <Text style={styles.scoreCell}>{player.wickets}</Text>
        <Text style={styles.scoreCell}>{econ}</Text>
      </View>
    );
  };
  
  // --------------------------------------------------------------------------
  // InningsExtras
  // --------------------------------------------------------------------------
  interface InningsExtrasProps {
    innings: InningsData;
  }
  const InningsExtras: React.FC<InningsExtrasProps> = ({ innings }) => {
    const wideDeliveries = innings.deliveries.filter(d => d.extraType === 'wide');
    const noBallDeliveries = innings.deliveries.filter(d => d.extraType === 'no-ball');
    const byeRuns = innings.deliveries
      .filter(d => d.extraType === 'bye')
      .reduce((sum, d) => sum + (d.runs || 0), 0);
    const legByeRuns = innings.deliveries
      .filter(d => d.extraType === 'leg-bye')
      .reduce((sum, d) => sum + (d.runs || 0), 0);
  
    return (
      <View style={styles.extrasRow}>
        <Text style={styles.extrasText}>
          Extras: {innings.extras || 0} (
          b {byeRuns}, lb {legByeRuns}, w {wideDeliveries.length}, nb {noBallDeliveries.length})
        </Text>
      </View>
    );
  };
  
  // --------------------------------------------------------------------------
  // InningsTotal
  // --------------------------------------------------------------------------
  interface InningsTotalProps {
    innings: InningsData;
  }
  const InningsTotal: React.FC<InningsTotalProps> = ({ innings }) => (
    <View style={styles.totalRow}>
      <Text style={styles.totalText}>
        Total: {innings.totalRuns}/{innings.wickets} ({innings.completedOvers}.{innings.ballInCurrentOver} Overs)
      </Text>
    </View>
  );
  
  // --------------------------------------------------------------------------
  // FallOfWickets
  // --------------------------------------------------------------------------
  interface FallOfWicketsProps {
    innings: InningsData;
    state: ScoreboardState;
  }
  const FallOfWickets: React.FC<FallOfWicketsProps> = ({ innings, state }) => {
    if (innings.wickets === 0) return null;
  
    const battingTeam = innings.battingTeamId === state.teamA.id
      ? state.teamA
      : state.teamB;
  
    // Gather each non-retired wicket
    const dismissals = innings.deliveries
      .filter(del => del.wicket && del.wicketType !== 'retired')
      .map((del, idx) => {
        const outBatter = battingTeam.players.find(p => p.id === del.outBatsmanId) || { name: 'Unknown' };
        // deliveries up to and including this wicket
        const i = innings.deliveries.indexOf(del);
        const sub = innings.deliveries.slice(0, i + 1);
  
        // Count only legal deliveries for overs/balls
        const legalBalls = sub.filter(d => !d.extraType || (d.extraType !== 'wide' && d.extraType !== 'no-ball'));
        const overNumber = Math.floor(legalBalls.length / 6);
        const ballNumber = legalBalls.length % 6;
  
        // Runs at time of this wicket
        const runsAtDismissal = sub.reduce((acc, d2) => {
          return acc + (d2.totalRuns ?? d2.runs ?? 0);
        }, 0);
  
        return `${idx + 1}-${runsAtDismissal} (${outBatter.name}, ${overNumber}.${ballNumber})`;
      });
  
    if (!dismissals.length) return null;
  
    return (
      <View style={styles.fallOfWickets}>
        <Text style={styles.fowTitle}>Fall of Wickets:</Text>
        <Text style={styles.fowText}>
          {dismissals.join(', ')}
        </Text>
      </View>
    );
  };
  
  // --------------------------------------------------------------------------
  // BattingScorecard
  // --------------------------------------------------------------------------
  interface BattingScorecardProps {
    innings: InningsData;
    battingTeam: Team;
    bowlingTeam: Team;
    state: ScoreboardState;
  }
  const BattingScorecard: React.FC<BattingScorecardProps> = ({
    innings,
    battingTeam,
    bowlingTeam,
    state
  }) => {
    // 1) Build a batting order from the deliveries
    const battingOrder = getBattingOrder(innings);
  
    // 2) Possibly add any players who might have faced a ball or are out
    //    but didn't appear in `battingOrder` for some reason.
    const fallbackIds = battingTeam.players
      .filter(p => p.balls > 0 || p.isOut ||
        p.id === innings.currentStrikerId || p.id === innings.currentNonStrikerId)
      .map(p => p.id);
  
    const fullSet = new Set([...battingOrder, ...fallbackIds]);
    const finalOrder = Array.from(fullSet);
  
    // 3) Dismissal info helpers
    const getBowlerName = (bowlerId?: string): string => {
      if (!bowlerId) return 'Unknown';
      const bowler = bowlingTeam.players.find(p => p.id === bowlerId);
      return bowler ? bowler.name : 'Unknown';
    };
  
    const getFielderName = (fielderId?: string): string => {
      if (!fielderId) return 'Unknown';
      const fielder = bowlingTeam.players.find(p => p.id === fielderId);
      return fielder ? fielder.name : 'Unknown';
    };
  
    const getDismissalInfo = (player: Cricketer): string => {
      if (!player.isOut) {
        // If not out, either "not out", "did not bat", or blank
        const isAtCrease =
          player.id === innings.currentStrikerId ||
          player.id === innings.currentNonStrikerId;
        if (isAtCrease) return 'not out';
        if (player.balls === 0) return 'did not bat';
        return '';
      }
      // Else find the relevant wicket delivery
      const del = innings.deliveries.find(
        d => d.wicket && d.outBatsmanId === player.id
      );
      if (!del) return 'out';
  
      switch (del.wicketType) {
        case 'bowled':
          return `b ${getBowlerName(del.bowlerId)}`;
        case 'caught':
          return `c ${getFielderName(del.fielderId)} b ${getBowlerName(del.bowlerId)}`;
        case 'lbw':
          return `lbw b ${getBowlerName(del.bowlerId)}`;
        case 'caught & bowled':
          return `c&b b ${getBowlerName(del.bowlerId)}`;
        case 'runout':
        case 'run out':
          return `run out (${getFielderName(del.fielderId)})`;
        case 'stumped':
          return `st ${getFielderName(del.fielderId)} b ${getBowlerName(del.bowlerId)}`;
        default:
          return del.wicketType || 'out';
      }
    };
  
    return (
      <View style={styles.scorecardSection}>
        <Text style={styles.sectionHeader}>
          {battingTeam.teamName}
        </Text>
  
        <View style={styles.scoreTableHeader}>
          <Text style={[styles.headerCell, styles.nameCell]}>Batsman</Text>
          <Text style={styles.headerCell}>R</Text>
          <Text style={styles.headerCell}>B</Text>
          <Text style={styles.headerCell}>4s</Text>
          <Text style={styles.headerCell}>6s</Text>
          <Text style={styles.headerCell}>SR</Text>
        </View>
  
        {finalOrder.map(batsmanId => {
          const p = battingTeam.players.find(x => x.id === batsmanId);
          if (!p) return null;
  
          const isStriker = p.id === innings.currentStrikerId;
          const isNonStriker = p.id === innings.currentNonStrikerId;
          const dismissInfo = getDismissalInfo(p);
  
          return (
            <BatsmanRow
              key={p.id}
              player={p}
              dismissalInfo={dismissInfo}
              isStriker={isStriker}
              isNonStriker={isNonStriker}
            />
          );
        })}
  
        {/* Extras, Total, FallOfWickets inline */}
        <InningsExtras innings={innings} />
        <InningsTotal innings={innings} />
        <FallOfWickets innings={innings} state={state} />
      </View>
    );
  };
  
  // --------------------------------------------------------------------------
  // BowlingScorecard
  // --------------------------------------------------------------------------
  interface BowlingScorecardProps {
    innings: InningsData;
    bowlingTeam: Team;
  }
  const BowlingScorecard: React.FC<BowlingScorecardProps> = ({ innings, bowlingTeam }) => {
    const bowlerHasBowled = (c: Cricketer) =>
      c.overs > 0 || c.ballsThisOver > 0 || c.runsConceded > 0 || c.wickets > 0;
  
    return (
      <View style={styles.scorecardSection}>
        <Text style={styles.sectionHeader}>
          {bowlingTeam.teamName} Bowling
        </Text>
        <View style={styles.scoreTableHeader}>
          <Text style={[styles.headerCell, styles.nameCell]}>Bowler</Text>
          <Text style={styles.headerCell}>O</Text>
          <Text style={styles.headerCell}>M</Text>
          <Text style={styles.headerCell}>R</Text>
          <Text style={styles.headerCell}>W</Text>
          <Text style={styles.headerCell}>Econ</Text>
        </View>
  
        {bowlingTeam.players
          .filter(bowlerHasBowled)
          .map(bowler => (
            <BowlerRow
              key={bowler.id}
              player={bowler}
              isBowling={bowler.id === innings.currentBowlerId}
            />
          ))}
      </View>
    );
  };
  
  // --------------------------------------------------------------------------
  // ScorecardTab
  // --------------------------------------------------------------------------
  interface ScorecardTabProps {
    battingTeam?: Team;
    bowlingTeam?: Team;
    currentInnings?: InningsData;
    currentInning: number;
    targetScore?: number;
    matchResult?: string;
    state: ScoreboardState;
  }
  
  const ScorecardTab: React.FC<ScorecardTabProps> = ({
    battingTeam,
    bowlingTeam,
    currentInnings,
    currentInning,
    targetScore,
    matchResult,
    state
  }) => {
    // console.log('ScorecardTab rendering...', JSON.stringify(state));
    // We detect if we are missing any core data
    const isLoading = !battingTeam || !bowlingTeam || !currentInnings;
  
    const firstInnings = state.innings1; // if they batted first
    const secondInnings = state.innings2;
  
    const firstInningsBattingTeam = firstInnings.battingTeamId === state.teamA.id ? state.teamA : state.teamB;
    const firstInningsBowlingTeam = firstInnings.bowlingTeamId === state.teamA.id ? state.teamA : state.teamB;
  
    const secondInningsBattingTeam = secondInnings.battingTeamId === state.teamA.id ? state.teamA : state.teamB;
    const secondInningsBowlingTeam = secondInnings.bowlingTeamId === state.teamA.id ? state.teamA : state.teamB;
  
    return (
      <ScrollView style={styles.container}>
        {isLoading && (
          <View style={styles.scorecardSection}>
            <Text>Loading match information...</Text>
          </View>
        )}
  
        {/* 1) Indian Royals - first innings */}
        {!isLoading && (
          <>
            <BattingScorecard
              innings={firstInnings}
              battingTeam={firstInningsBattingTeam}
              bowlingTeam={firstInningsBowlingTeam}
              state={state}
            />
            <BowlingScorecard
              innings={firstInnings}
              bowlingTeam={firstInningsBowlingTeam}
            />
          </>
        )}
  
        {/* 2) The second innings */}
        {(secondInnings.totalRuns > 0 || secondInnings.isCompleted) && (
          <>
            <BattingScorecard
              innings={secondInnings}
              battingTeam={secondInningsBattingTeam}
              bowlingTeam={secondInningsBowlingTeam}
              state={state}
            />
            <BowlingScorecard
              innings={secondInnings}
              bowlingTeam={secondInningsBowlingTeam}
            />
          </>
        )}
  
        {/* 3) If match is over, show the final result */}
        {matchResult && (
          <View style={styles.scorecardSection}>
            <Text style={styles.matchResult}>{matchResult}</Text>
          </View>
        )}
      </ScrollView>
    );
  };
  
  // --------------------------------------------------------------------------
  // Styles
  // --------------------------------------------------------------------------
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 12
    },
    scorecardSection: {
      backgroundColor: '#fff',
      borderRadius: 8,
      marginBottom: 16,
      padding: 10,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1
    },
    sectionHeader: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      color: '#1B5E20'
    },
    scoreTableHeader: {
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
      backgroundColor: '#F5F5F5'
    },
    scoreRow: {
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0'
    },
    headerCell: {
      flex: 1,
      textAlign: 'center',
      fontWeight: '600',
      color: '#424242'
    },
    scoreCell: {
      flex: 1,
      textAlign: 'center'
    },
    nameCell: {
      flex: 3,
      textAlign: 'left',
      paddingLeft: 5
    },
    playerName: {
      fontWeight: '500'
    },
    dismissalInfo: {
      fontSize: 12,
      color: '#666',
      marginTop: 2
    },
    extrasRow: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0'
    },
    extrasText: {
      fontSize: 13,
      color: '#555'
    },
    totalRow: {
      paddingVertical: 10,
      alignItems: 'flex-end'
    },
    totalText: {
      fontSize: 15,
      fontWeight: 'bold',
      color: '#1B5E20'
    },
    fallOfWickets: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: '#E0E0E0'
    },
    fowTitle: {
      fontWeight: 'bold',
      fontSize: 13,
      marginBottom: 4
    },
    fowText: {
      fontSize: 12,
      color: '#555',
      lineHeight: 18
    },
    matchResult: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#1B5E20',
      textAlign: 'center'
    }
  });
  
  export default ScorecardTab;