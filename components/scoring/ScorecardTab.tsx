import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
    Team,
    InningsData,
    Cricketer,
    ScoreboardState
} from '@/types';
import { getBattingOrder } from '@/utils/scorecardTab';
import { colors, spacing, radius, typography } from '@/constants/theme';

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
          <Text style={[
            styles.playerName,
            (isStriker || isNonStriker) && styles.activeBatsmanName
          ]}>
            {player.name}
            {isStriker && <Text style={styles.activeBatsmanSymbol}> *</Text>}
            {isNonStriker && <Text style={styles.activeBatsmanSymbol}> †</Text>}
          </Text>
          {dismissalInfo ? (
            <Text style={styles.dismissalInfo}>{dismissalInfo}</Text>
          ) : null}
        </View>
        <Text style={[styles.scoreCell, player.runs > 49 ? styles.milestone : null]}>
          {player.runs || 0}
        </Text>
        <Text style={styles.scoreCell}>{player.balls || 0}</Text>
        <Text style={styles.scoreCell}>{player.fours || 0}</Text>
        <Text style={styles.scoreCell}>{player.sixes || 0}</Text>
        <Text style={[
          styles.scoreCell, 
          parseFloat(sr) > 150 ? styles.highStrikeRate : null
        ]}>
          {sr}
        </Text>
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
    
    // Calculate if bowler has good economy
    const hasGoodEconomy = parseFloat(econ) < 6.0 && oversFraction >= 1;
    
    return (
      <View style={styles.scoreRow}>
        <Text style={[
          styles.scoreCell, 
          styles.nameCell,
          isBowling && styles.activeBowlerName
        ]}>
          {player.name}
          {isBowling && <Text style={styles.activeBowlerSymbol}> *</Text>}
        </Text>
        <Text style={styles.scoreCell}>{oversText}</Text>
        <Text style={[styles.scoreCell, player.maidens > 0 ? styles.goodBowlingFigure : null]}>
          {player.maidens || 0}
        </Text>
        <Text style={styles.scoreCell}>{player.runsConceded}</Text>
        <Text style={[styles.scoreCell, player.wickets >= 3 ? styles.goodBowlingFigure : null]}>
          {player.wickets}
        </Text>
        <Text style={[styles.scoreCell, hasGoodEconomy ? styles.goodBowlingFigure : null]}>
          {econ}
        </Text>
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
          <Text style={styles.extrasLabel}>Extras: </Text>
          <Text style={styles.extrasValue}>{innings.extras || 0}</Text>
          <Text style={styles.extrasSeparator}> (</Text>
          <Text style={styles.extrasDetail}>b {byeRuns}, lb {legByeRuns}, w {wideDeliveries.length}, nb {noBallDeliveries.length}</Text>
          <Text style={styles.extrasSeparator}>)</Text>
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
        <Text style={styles.totalLabel}>Total: </Text>
        <Text style={styles.totalFigure}>
          {innings.totalRuns}/{innings.wickets}
        </Text>
        <Text style={styles.totalSeparator}> (</Text>
        <Text style={styles.totalOvers}>
          {innings.completedOvers}.{innings.ballInCurrentOver} Overs
        </Text>
        <Text style={styles.totalSeparator}>)</Text>
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
        <Text style={styles.fowTitle}>
          <FontAwesome name="arrow-down" size={12} color={colors.brandRed} style={styles.fowIcon} />
          <Text> Fall of Wickets:</Text>
        </Text>
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
    const battingOrder = useMemo(() => getBattingOrder(innings), [innings]);
  
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
  
    const getDismissalInfo = useMemo(() => (player: Cricketer): string => {
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
    }, [innings.deliveries, bowlingTeam.players]);
  
    return (
      <View style={styles.scorecardSection}>
        <Text style={styles.sectionHeader}>
          <FontAwesome name="user" size={14} color={colors.brandBlue} style={styles.headerIcon} />
          <Text style={styles.headerText}> {battingTeam.teamName}</Text>
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
  
        <InningsExtras innings={innings} />
        <InningsTotal innings={innings} />
        <PartnershipHistory innings={innings} battingTeam={battingTeam} />
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
          <FontAwesome name="dot-circle-o" size={14} color={colors.brandBlue} style={styles.headerIcon} />
          <Text style={styles.headerText}> {bowlingTeam.teamName} Bowling</Text>
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

  interface PartnershipHistoryProps {
    innings: InningsData;
    battingTeam: Team;
  }
  
  const PartnershipHistory: React.FC<PartnershipHistoryProps> = ({ innings, battingTeam }) => {
    if (!innings.partnerships || innings.partnerships.length === 0) return null;
    
    return (
      <View style={styles.partnershipSection}>
        <Text style={styles.partnershipTitle}>
          <FontAwesome name="link" size={12} color={colors.brandBlue} style={styles.partnershipIcon} />
          <Text> Partnerships</Text>
        </Text>
        
        {innings.partnerships.map((p, index) => {
          const player1 = battingTeam.players.find(player => player.id === p.player1Id);
          const player2 = battingTeam.players.find(player => player.id === p.player2Id);
          
          return (
            <View key={index} style={styles.partnershipRow}>
              <Text style={styles.partnershipPlayers}>
                {player1?.name || 'Unknown'} & {player2?.name || 'Unknown'}
              </Text>
              <Text style={styles.partnershipDetail}>
                <Text style={styles.partnershipRuns}>{p.runs}</Text> runs 
                <Text style={styles.partnershipBalls}> ({p.balls} balls)</Text>
              </Text>
            </View>
          );
        })}
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
          <View style={styles.loadingContainer}>
            <FontAwesome name="refresh" size={24} color={colors.brandBlue} style={styles.loadingIcon} />
            <Text style={styles.loadingText}>Loading match information...</Text>
          </View>
        )}
  
        {/* First innings */}
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
  
        {/* Second innings */}
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
  
        {/* If match is over, show the final result */}
        {matchResult && (
          <View style={styles.resultContainer}>
            <FontAwesome name="trophy" size={18} color={colors.brandGreen} style={styles.resultIcon} />
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
      padding: spacing.md,
      // backgroundColor: colors.brandLight,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xxl,
      backgroundColor: colors.white,
      borderRadius: radius.md,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    loadingIcon: {
      marginBottom: spacing.md,
    },
    loadingText: {
      fontSize: 16,
      color: colors.brandBlue,
    },
    scorecardSection: {
      backgroundColor: colors.white,
      borderRadius: radius.md,
      marginBottom: spacing.md,
      padding: spacing.md,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      fontSize: 16,
      fontWeight: '700',
      marginBottom: spacing.md,
      color: colors.brandBlue,
      paddingBottom: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.brandLight,
    },
    headerIcon: {
      marginRight: spacing.xs,
    },
    headerText: {
      color: colors.brandBlue,
    },
    scoreTableHeader: {
      flexDirection: 'row',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.sm,
      backgroundColor: colors.brandLight + '70', // 70% opacity
    },
    scoreRow: {
      flexDirection: 'row',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.brandLight,
    },
    headerCell: {
      flex: 1,
      textAlign: 'center',
      fontWeight: '600',
      color: colors.brandDark,
      fontSize: 13,
    },
    scoreCell: {
      flex: 1,
      textAlign: 'center',
      color: colors.brandDark,
    },
    nameCell: {
      flex: 3,
      textAlign: 'left',
      paddingLeft: spacing.xs,
    },
    playerName: {
      fontWeight: '500',
      color: colors.brandDark,
    },
    dismissalInfo: {
      fontSize: 12,
      color: colors.brandDark + '80', // 80% opacity
      marginTop: 2,
    },
    activeBatsmanName: {
      fontWeight: '700',
      color: colors.brandBlue,
    },
    activeBatsmanSymbol: {
      color: colors.brandBlue,
      fontWeight: '700',
    },
    activeBowlerName: {
      fontWeight: '700',
      color: colors.brandGreen,
    },
    activeBowlerSymbol: {
      color: colors.brandGreen, 
      fontWeight: '700',
    },
    milestone: {
      fontWeight: '700',
      color: colors.brandGreen,
    },
    highStrikeRate: {
      color: colors.brandRed,
      fontWeight: '600',
    },
    goodBowlingFigure: {
      color: colors.brandGreen,
      fontWeight: '600',
    },
    extrasRow: {
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.brandLight,
    },
    extrasText: {
      fontSize: 13,
      color: colors.brandDark,
    },
    extrasLabel: {
      fontWeight: '600',
    },
    extrasValue: {
      fontWeight: '600',
    },
    extrasSeparator: {
      color: colors.brandDark + '60', // 60% opacity
    },
    extrasDetail: {
      color: colors.brandDark + '80', // 80% opacity
    },
    totalRow: {
      paddingVertical: spacing.md,
      alignItems: 'flex-end',
    },
    totalText: {
      fontSize: 15,
      color: colors.brandDark,
    },
    totalLabel: {
      fontWeight: '600',
    },
    totalFigure: {
      fontWeight: '700',
      color: colors.brandBlue,
    },
    totalSeparator: {
      color: colors.brandDark + '60', // 60% opacity
    },
    totalOvers: {
      color: colors.brandDark + '80', // 80% opacity
    },
    fallOfWickets: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.brandLight,
    },
    fowIcon: {
      marginRight: spacing.xs,
    },
    fowTitle: {
      fontWeight: '600',
      fontSize: 13,
      marginBottom: spacing.xs,
      color: colors.brandDark,
      flexDirection: 'row',
      alignItems: 'center',
    },
    fowText: {
      fontSize: 12,
      color: colors.brandDark + '80', // 80% opacity
      lineHeight: 18,
    },
    resultContainer: {
      backgroundColor: colors.white,
      borderRadius: radius.md,
      marginBottom: spacing.md,
      padding: spacing.lg,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    resultIcon: {
      marginRight: spacing.sm,
    },
    matchResult: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.brandGreen,
      textAlign: 'center',
    },
    partnershipSection: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.brandLight,
    },
    partnershipTitle: {
      fontWeight: '600',
      fontSize: 13,
      marginBottom: spacing.xs,
      color: colors.brandDark,
      flexDirection: 'row',
      alignItems: 'center',
    },
    partnershipIcon: {
      marginRight: spacing.xs,
    },
    partnershipRow: {
      marginBottom: spacing.xs,
      paddingVertical: spacing.xs,
    },
    partnershipPlayers: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.brandBlue,
    },
    partnershipDetail: {
      fontSize: 12,
      color: colors.brandDark + '80', // 80% opacity
    },
    partnershipRuns: {
      fontWeight: '600',
      color: colors.brandDark,
    },
    partnershipBalls: {
      color: colors.brandDark + '60', // 60% opacity
    },
  });
  
  export default ScorecardTab;