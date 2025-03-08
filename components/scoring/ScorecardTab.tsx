import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ScoreHeader from './ScoreHeader';
import { Team, InningsData, Cricketer, DeliveryEvent } from '@/types';

interface ScorecardTabProps {
    battingTeam?: Team;
    bowlingTeam?: Team;
    currentInnings?: InningsData;
    currentInning: number;
    targetScore?: number;
    matchResult?: string;
    state: any; // Replace with proper type from your Redux store
}

const ScorecardTab: React.FC<ScorecardTabProps> = ({
    battingTeam,
    bowlingTeam,
    currentInnings,
    currentInning,
    targetScore,
    matchResult,
    state,
}) => {
    // Helper functions
    const getBowlerName = (bowlerId?: string) => {
        if (!bowlerId) return 'Unknown';
        const bowler = bowlingTeam?.players.find(p => p.id === bowlerId);
        return bowler ? bowler.name : 'Unknown';
    };

    const getFielderName = (fielderId?: string) => {
        if (!fielderId) return 'Unknown';
        const fielder = bowlingTeam?.players.find(p => p.id === fielderId);
        return fielder ? fielder.name : 'Unknown';
    };

    return (
        <ScrollView style={styles.container}>
            {/* Match info section */}
            <View style={styles.scorecardSection}>
                {battingTeam && currentInnings ? (
                    <ScoreHeader
                        battingTeam={battingTeam}
                        currentInnings={currentInnings}
                        currentInning={currentInning}
                        targetScore={targetScore}
                        matchResult={matchResult}
                    />
                ) : (
                    <View style={styles.loadingScoreHeader}>
                        <Text>Loading match information...</Text>
                    </View>
                )}
            </View>

            {/* Current Innings Batting */}
            <View style={styles.scorecardSection}>
                <Text style={styles.sectionHeader}>
                    {battingTeam?.teamName} Batting
                </Text>
                <View style={styles.scoreTableHeader}>
                    <Text style={[styles.headerCell, styles.nameCell]}>Batsman</Text>
                    <Text style={styles.headerCell}>R</Text>
                    <Text style={styles.headerCell}>B</Text>
                    <Text style={styles.headerCell}>4s</Text>
                    <Text style={styles.headerCell}>6s</Text>
                    <Text style={styles.headerCell}>SR</Text>
                </View>

                {battingTeam?.players.map(player => {
                    const hasPlayed = player.balls > 0 || player.isOut;
                    // Show if:
                    // 1. Player has batted OR
                    // 2. Player is currently at crease OR
                    // 3. Team is all out OR
                    // 4. Innings is completed (to show remaining batsmen)
                    const shouldShow = hasPlayed ||
                        player.id === currentInnings?.currentStrikerId ||
                        player.id === currentInnings?.currentNonStrikerId ||
                        currentInnings?.isAllOut ||
                        currentInnings?.isCompleted;

                    // Find dismissal details
                    let dismissalInfo = '';

                    if (player.isOut) {
                        // Find the delivery where this player got out
                        const dismissalDelivery = currentInnings?.deliveries.find(d =>
                            d.wicket && d.outBatsmanId === player.id
                        );

                        if (dismissalDelivery) {
                            // Format dismissal based on wicket type
                            switch (dismissalDelivery.wicketType) {
                                case 'bowled':
                                    dismissalInfo = `b ${getBowlerName(dismissalDelivery.bowlerId)}`;
                                    break;
                                case 'caught':
                                    dismissalInfo = `c ${getFielderName(dismissalDelivery.fielderId)} b ${getBowlerName(dismissalDelivery.bowlerId)}`;
                                    break;
                                case 'lbw':
                                    dismissalInfo = `lbw b ${getBowlerName(dismissalDelivery.bowlerId)}`;
                                    break;
                                case 'runout':
                                    dismissalInfo = `run out (${getFielderName(dismissalDelivery.fielderId)})`;
                                    break;
                                case 'stumped':
                                    dismissalInfo = `st ${getFielderName(dismissalDelivery.fielderId)} b ${getBowlerName(dismissalDelivery.bowlerId)}`;
                                    break;
                                default:
                                    dismissalInfo = dismissalDelivery.wicketType || 'out';
                            }
                        }
                    } else if (player.id === currentInnings?.currentStrikerId ||
                        player.id === currentInnings?.currentNonStrikerId) {
                        // Currently batting
                        dismissalInfo = 'not out';
                    } else if (shouldShow && player.balls === 0) {
                        // Didn't get to bat yet but should be shown (innings over)
                        dismissalInfo = 'did not bat';
                    }

                    return shouldShow ? (
                        <View key={player.id} style={styles.scoreRow}>
                            <View style={[styles.scoreCell, styles.nameCell]}>
                                <Text style={styles.playerName}>
                                    {player.name}
                                    {player.id === currentInnings?.currentStrikerId ? ' *' : ''}
                                    {player.id === currentInnings?.currentNonStrikerId ? ' †' : ''}
                                </Text>
                                <Text style={styles.dismissalInfo}>{dismissalInfo}</Text>
                            </View>
                            <Text style={styles.scoreCell}>{player.runs || 0}</Text>
                            <Text style={styles.scoreCell}>{player.balls || 0}</Text>
                            <Text style={styles.scoreCell}>{player.fours || 0}</Text>
                            <Text style={styles.scoreCell}>{player.sixes || 0}</Text>
                            <Text style={styles.scoreCell}>
                                {player.balls > 0 ? (player.runs / player.balls * 100).toFixed(1) : '0.0'}
                            </Text>
                        </View>
                    ) : null;
                })}

                {/* Show extras and total */}
                <View style={styles.extrasRow}>
                    <Text style={styles.extrasText}>
                        Extras: {currentInnings?.extras || 0} (b {currentInnings?.deliveries.filter(d => d.extraType === 'bye').reduce((sum, d) => sum + d.runs, 0) || 0},
                        lb {currentInnings?.deliveries.filter(d => d.extraType === 'leg-bye').reduce((sum, d) => sum + d.runs, 0) || 0},
                        w {currentInnings?.deliveries.filter(d => d.extraType === 'wide').length || 0},
                        nb {currentInnings?.deliveries.filter(d => d.extraType === 'no-ball').length || 0})
                    </Text>
                </View>

                <View style={styles.totalRow}>
                    <Text style={styles.totalText}>
                        Total: {currentInnings?.totalRuns || 0}/{currentInnings?.wickets || 0}
                        ({currentInnings?.completedOvers || 0}.{currentInnings?.ballInCurrentOver || 0} Overs)
                    </Text>
                </View>
            </View>

            {/* Current Innings Bowling */}
            <View style={styles.scorecardSection}>
                <Text style={styles.sectionHeader}>
                    {bowlingTeam?.teamName} Bowling
                </Text>
                <View style={styles.scoreTableHeader}>
                    <Text style={[styles.headerCell, styles.nameCell]}>Bowler</Text>
                    <Text style={styles.headerCell}>O</Text>
                    <Text style={styles.headerCell}>M</Text>
                    <Text style={styles.headerCell}>R</Text>
                    <Text style={styles.headerCell}>W</Text>
                    <Text style={styles.headerCell}>Econ</Text>
                </View>
                {bowlingTeam?.players.filter(p => p.overs > 0 || p.ballsThisOver > 0).map(player => {
                    const oversText = `${player.overs}.${player.ballsThisOver}`;
                    const economy = player.overs > 0 ?
                        (player.runsConceded / player.overs).toFixed(2) : '0.00';

                    return (
                        <View key={player.id} style={styles.scoreRow}>
                            <Text style={[styles.scoreCell, styles.nameCell]}>
                                {player.name}
                                {player.id === currentInnings?.currentBowlerId ? ' *' : ''}
                            </Text>
                            <Text style={styles.scoreCell}>{oversText}</Text>
                            <Text style={styles.scoreCell}>{player.maidens || 0}</Text>
                            <Text style={styles.scoreCell}>{player.runsConceded}</Text>
                            <Text style={styles.scoreCell}>{player.wickets}</Text>
                            <Text style={styles.scoreCell}>{economy}</Text>
                        </View>
                    );
                })}
            </View>

            {/* First Innings Details (if not current and completed) */}
            {state.innings1.isCompleted && currentInning !== 1 && (
                <>
                    <View style={styles.scorecardSection}>
                        <Text style={styles.sectionHeader}>
                            1st Innings: {state.innings1.battingTeamId === state.teamA.id ? state.teamA.teamName : state.teamB.teamName} Batting
                        </Text>
                        <View style={styles.scoreTableHeader}>
                            <Text style={[styles.headerCell, styles.nameCell]}>Batsman</Text>
                            <Text style={styles.headerCell}>R</Text>
                            <Text style={styles.headerCell}>B</Text>
                            <Text style={styles.headerCell}>4s</Text>
                            <Text style={styles.headerCell}>6s</Text>
                            <Text style={styles.headerCell}>SR</Text>
                        </View>

                        {/* First innings batting scorecard */}
                        {(state.innings1.battingTeamId === state.teamA.id ? state.teamA : state.teamB).players
                            .filter((player:Cricketer) => player.balls > 0 || player.isOut)
                            .map((player:Cricketer) => {
                                // Find dismissal details
                                let dismissalInfo = '';

                                if (player.isOut) {
                                    // Find the delivery where this player got out
                                    const dismissalDelivery = state.innings1.deliveries.find((d: DeliveryEvent) =>
                                        d.wicket && d.outBatsmanId === player.id
                                    );

                                    if (dismissalDelivery) {
                                        // Format dismissal based on wicket type
                                        const bowlingTeam = state.innings1.battingTeamId === state.teamA.id ? state.teamB : state.teamA;
                                        const getBowlerName = (bowlerId?: string) => {
                                            if (!bowlerId) return 'Unknown';
                                            const bowler = bowlingTeam.players.find((p:Cricketer) => p.id === bowlerId);
                                            return bowler ? bowler.name : 'Unknown';
                                        };

                                        const getFielderName = (fielderId?: string) => {
                                            if (!fielderId) return 'Unknown';
                                            const fielder = bowlingTeam.players.find((p:Cricketer) => p.id === fielderId);
                                            return fielder ? fielder.name : 'Unknown';
                                        };

                                        switch (dismissalDelivery.wicketType) {
                                            case 'bowled':
                                                dismissalInfo = `b ${getBowlerName(dismissalDelivery.bowlerId)}`;
                                                break;
                                            case 'caught':
                                                dismissalInfo = `c ${getFielderName(dismissalDelivery.fielderId)} b ${getBowlerName(dismissalDelivery.bowlerId)}`;
                                                break;
                                            case 'lbw':
                                                dismissalInfo = `lbw b ${getBowlerName(dismissalDelivery.bowlerId)}`;
                                                break;
                                            case 'runout':
                                                dismissalInfo = `run out (${getFielderName(dismissalDelivery.fielderId)})`;
                                                break;
                                            case 'stumped':
                                                dismissalInfo = `st ${getFielderName(dismissalDelivery.fielderId)} b ${getBowlerName(dismissalDelivery.bowlerId)}`;
                                                break;
                                            default:
                                                dismissalInfo = dismissalDelivery.wicketType || 'out';
                                        }
                                    }
                                } else {
                                    dismissalInfo = 'not out';
                                }

                                return (
                                    <View key={player.id} style={styles.scoreRow}>
                                        <View style={[styles.scoreCell, styles.nameCell]}>
                                            <Text style={styles.playerName}>
                                                {player.name}
                                            </Text>
                                            <Text style={styles.dismissalInfo}>{dismissalInfo}</Text>
                                        </View>
                                        <Text style={styles.scoreCell}>{player.runs || 0}</Text>
                                        <Text style={styles.scoreCell}>{player.balls || 0}</Text>
                                        <Text style={styles.scoreCell}>{player.fours || 0}</Text>
                                        <Text style={styles.scoreCell}>{player.sixes || 0}</Text>
                                        <Text style={styles.scoreCell}>
                                            {player.balls > 0 ? (player.runs / player.balls * 100).toFixed(1) : '0.0'}
                                        </Text>
                                    </View>
                                );
                            })}

                        {/* Show extras and total */}
                        <View style={styles.extrasRow}>
                            <Text style={styles.extrasText}>
                                Extras: {state.innings1.extras || 0} (b {state.innings1.deliveries.filter(d => d.extraType === 'bye').reduce((sum, d) => sum + d.runs, 0) || 0},
                                lb {state.innings1.deliveries.filter(d => d.extraType === 'leg-bye').reduce((sum, d) => sum + d.runs, 0) || 0},
                                w {state.innings1.deliveries.filter(d => d.extraType === 'wide').length || 0},
                                nb {state.innings1.deliveries.filter(d => d.extraType === 'no-ball').length || 0})
                            </Text>
                        </View>

                        <View style={styles.totalRow}>
                            <Text style={styles.totalText}>
                                Total: {state.innings1.totalRuns || 0}/{state.innings1.wickets || 0}
                                ({state.innings1.completedOvers || 0}.{state.innings1.ballInCurrentOver || 0} Overs)
                            </Text>
                        </View>
                    </View>

                    {/* First innings bowling */}
                    <View style={styles.scorecardSection}>
                        <Text style={styles.sectionHeader}>
                            1st Innings: {state.innings1.bowlingTeamId === state.teamA.id ? state.teamA.teamName : state.teamB.teamName} Bowling
                        </Text>
                        <View style={styles.scoreTableHeader}>
                            <Text style={[styles.headerCell, styles.nameCell]}>Bowler</Text>
                            <Text style={styles.headerCell}>O</Text>
                            <Text style={styles.headerCell}>M</Text>
                            <Text style={styles.headerCell}>R</Text>
                            <Text style={styles.headerCell}>W</Text>
                            <Text style={styles.headerCell}>Econ</Text>
                        </View>
                        {(state.innings1.bowlingTeamId === state.teamA.id ? state.teamA : state.teamB).players
                            .filter(p => p.overs > 0 || p.ballsThisOver > 0)
                            .map(player => {
                                const oversText = `${player.overs}.${player.ballsThisOver}`;
                                const economy = player.overs > 0 ?
                                    (player.runsConceded / player.overs).toFixed(2) : '0.00';

                                return (
                                    <View key={player.id} style={styles.scoreRow}>
                                        <Text style={[styles.scoreCell, styles.nameCell]}>
                                            {player.name}
                                        </Text>
                                        <Text style={styles.scoreCell}>{oversText}</Text>
                                        <Text style={styles.scoreCell}>{player.maidens || 0}</Text>
                                        <Text style={styles.scoreCell}>{player.runsConceded}</Text>
                                        <Text style={styles.scoreCell}>{player.wickets}</Text>
                                        <Text style={styles.scoreCell}>{economy}</Text>
                                    </View>
                                );
                            })}
                    </View>
                </>
            )}

            {/* Completed Innings Summary */}
            {state.innings1.isCompleted && (
                <View style={styles.scorecardSection}>
                    <Text style={styles.sectionHeader}>1st Innings Summary</Text>
                    <Text style={styles.inningsSummary}>
                        {state.innings1.battingTeamId === state.teamA.id ? state.teamA.teamName : state.teamB.teamName}: {state.innings1.totalRuns}/{state.innings1.wickets}
                        ({state.innings1.completedOvers}.{state.innings1.ballInCurrentOver} overs)
                    </Text>
                    
                    {/* Show fall of wickets if any wickets fell */}
                    {state.innings1.wickets > 0 && (
                        <View style={styles.fallOfWickets}>
                            <Text style={styles.fowTitle}>Fall of Wickets:</Text>
                            <Text style={styles.fowText}>
                                {state.innings1.deliveries
                                    .filter(d => d.wicket && d.wicketType !== 'retired')
                                    .map((d, idx) => {
                                        // Find the batsman who got out
                                        const outBatsman = state.innings1.battingTeamId === state.teamA.id 
                                            ? state.teamA.players.find(p => p.id === d.outBatsmanId)
                                            : state.teamB.players.find(p => p.id === d.outBatsmanId);
                                        
                                        // Calculate score at dismissal
                                        // This is a simplification - you may need to calculate the exact score 
                                        // at dismissal from your deliveries array
                                        const previousDeliveries = state.innings1.deliveries.slice(0, 
                                            state.innings1.deliveries.indexOf(d) + 1);
                                        
                                        // Find the index of this delivery in the innings
                                        const deliveryIndex = previousDeliveries.length;
                                        
                                        // Count legal deliveries to determine overs
                                        const legalDeliveries = previousDeliveries.filter(
                                            del => !del.extraType || (del.extraType !== 'wide' && del.extraType !== 'no-ball')
                                        ).length;
                                        
                                        const overs = Math.floor(legalDeliveries / 6);
                                        const balls = legalDeliveries % 6;
                                        
                                        // Sum up runs to get score at dismissal
                                        const runsAtDismissal = previousDeliveries.reduce(
                                            (sum, del) => sum + (del.totalRuns || del.runs), 0);
                                        
                                        return `${idx + 1}-${runsAtDismissal} (${outBatsman?.name || 'Unknown'}, ${overs}.${balls})`;
                                    })
                                    .join(', ')}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Second Innings Summary - only show if completed and we're showing a match result */}
            {state.innings2.isCompleted && matchResult && (
                <View style={styles.scorecardSection}>
                    <Text style={styles.sectionHeader}>2nd Innings Summary</Text>
                    <Text style={styles.inningsSummary}>
                        {state.innings2.battingTeamId === state.teamA.id ? state.teamA.teamName : state.teamB.teamName}: {state.innings2.totalRuns}/{state.innings2.wickets}
                        ({state.innings2.completedOvers}.{state.innings2.ballInCurrentOver} overs)
                    </Text>
                    
                    {/* Show fall of wickets if any wickets fell */}
                    {state.innings2.wickets > 0 && (
                        <View style={styles.fallOfWickets}>
                            <Text style={styles.fowTitle}>Fall of Wickets:</Text>
                            <Text style={styles.fowText}>
                                {/* Same logic as above but for innings2 */}
                                {state.innings2.deliveries
                                    .filter(d => d.wicket && d.wicketType !== 'retired')
                                    .map((d, idx) => {
                                        const outBatsman = state.innings2.battingTeamId === state.teamA.id 
                                            ? state.teamA.players.find(p => p.id === d.outBatsmanId)
                                            : state.teamB.players.find(p => p.id === d.outBatsmanId);
                                        
                                        const previousDeliveries = state.innings2.deliveries.slice(0, 
                                            state.innings2.deliveries.indexOf(d) + 1);
                                        
                                        const deliveryIndex = previousDeliveries.length;
                                        
                                        const legalDeliveries = previousDeliveries.filter(
                                            del => !del.extraType || (del.extraType !== 'wide' && del.extraType !== 'no-ball')
                                        ).length;
                                        
                                        const overs = Math.floor(legalDeliveries / 6);
                                        const balls = legalDeliveries % 6;
                                        
                                        const runsAtDismissal = previousDeliveries.reduce(
                                            (sum, del) => sum + (del.totalRuns || del.runs), 0);
                                        
                                        return `${idx + 1}-${runsAtDismissal} (${outBatsman?.name || 'Unknown'}, ${overs}.${balls})`;
                                    })
                                    .join(', ')}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Match Result */}
            {matchResult && (
                <View style={styles.scorecardSection}>
                    <Text style={styles.matchResult}>{matchResult}</Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 12,
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
        shadowRadius: 1,
    },
    loadingScoreHeader: {
        padding: 10,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1B5E20',
    },
    scoreTableHeader: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#F5F5F5',
    },
    scoreRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerCell: {
        flex: 1,
        textAlign: 'center',
        fontWeight: '600',
        color: '#424242',
    },
    scoreCell: {
        flex: 1,
        textAlign: 'center',
    },
    nameCell: {
        flex: 3,
        textAlign: 'left',
        paddingLeft: 5,
    },
    inningsSummary: {
        fontSize: 14,
        color: '#424242',
    },
    playerName: {
        fontWeight: '500',
    },
    dismissalInfo: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    extrasRow: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    extrasText: {
        fontSize: 13,
        color: '#555',
    },
    totalRow: {
        paddingVertical: 10,
        alignItems: 'flex-end',
    },
    totalText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1B5E20',
    },
    fallOfWickets: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    fowTitle: {
        fontWeight: 'bold',
        fontSize: 13,
        marginBottom: 4,
    },
    fowText: {
        fontSize: 12,
        color: '#555',
        lineHeight: 18,
    },
    matchResult: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1B5E20',
        textAlign: 'center',
    },
});

export default ScorecardTab;