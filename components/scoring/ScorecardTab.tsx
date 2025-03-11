import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ScoreHeader from './ScoreHeader';
import { Team, InningsData, Cricketer, DeliveryEvent, ScoreboardState } from '@/types';

interface ScorecardTabProps {
    battingTeam?: Team;
    bowlingTeam?: Team;
    currentInnings?: InningsData;
    currentInning: number;
    targetScore?: number;
    matchResult?: string;
    state: ScoreboardState;
}

// Type definitions for component props
interface BatsmanRowProps {
    player: Cricketer;
    dismissalInfo: string;
    isStriker?: boolean;
    isNonStriker?: boolean;
}

interface BowlerRowProps {
    player: Cricketer;
    isBowling?: boolean;
}

interface InningsExtrasProps {
    innings: InningsData;
}

interface InningsTotalProps {
    innings: InningsData;
}

interface FallOfWicketsProps {
    innings: InningsData;
    state: ScoreboardState;
}

interface BattingScorecardProps {
    innings: InningsData;
    battingTeam: Team;
    bowlingTeam: Team;
    isCurrentInnings?: boolean;
}

interface BowlingScorecardProps {
    innings: InningsData;
    bowlingTeam: Team;
}

interface InningsSummaryProps {
    innings: InningsData;
    state: ScoreboardState;
}

// Component for rendering a batsman row
const BatsmanRow: React.FC<BatsmanRowProps> = ({ player, dismissalInfo, isStriker = false, isNonStriker = false }) => (
    <View style={styles.scoreRow}>
        <View style={[styles.scoreCell, styles.nameCell]}>
            <Text style={styles.playerName}>
                {player.name}
                {isStriker ? ' *' : ''}
                {isNonStriker ? ' †' : ''}
            </Text>
            <Text style={styles.dismissalInfo}>{dismissalInfo}</Text>
        </View>
        <Text style={styles.scoreCell}>{player.runs || 0}</Text>
        <Text style={styles.scoreCell}>{player.balls || 0}</Text>
        <Text style={styles.scoreCell}>{player.fours || 0}</Text>
        <Text style={styles.scoreCell}>{player.sixes || 0}</Text>
        <Text style={styles.scoreCell}>
            {player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(1) : '0.0'}
        </Text>
    </View>
);

// Component for rendering a bowler row
const BowlerRow: React.FC<BowlerRowProps> = ({ player, isBowling = false }) => {
    const oversText = `${player.overs}.${player.ballsThisOver}`;
    const economy = player.overs > 0 ?
        (player.runsConceded / player.overs).toFixed(2) : '0.00';

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
            <Text style={styles.scoreCell}>{economy}</Text>
        </View>
    );
};

// Component for extras and total
const InningsExtras: React.FC<InningsExtrasProps> = ({ innings }) => (
    <View style={styles.extrasRow}>
        <Text style={styles.extrasText}>
            Extras: {innings.extras || 0} (
                b {innings.deliveries.filter(d => d.extraType === 'bye').reduce((sum, d) => sum + (d.runs || 0), 0) || 0},
                lb {innings.deliveries.filter(d => d.extraType === 'leg-bye').reduce((sum, d) => sum + (d.runs || 0), 0) || 0},
                w {innings.deliveries.filter(d => d.extraType === 'wide').length || 0},
                nb {innings.deliveries.filter(d => d.extraType === 'no-ball').length || 0}
            )
        </Text>
    </View>
);

// Component for total score
const InningsTotal: React.FC<InningsTotalProps> = ({ innings }) => (
    <View style={styles.totalRow}>
        <Text style={styles.totalText}>
            Total: {innings.totalRuns || 0}/{innings.wickets || 0}
            ({innings.completedOvers || 0}.{innings.ballInCurrentOver || 0} Overs)
        </Text>
    </View>
);

// Component for fall of wickets
const FallOfWickets: React.FC<FallOfWicketsProps> = ({ innings, state }) => {
    if (innings.wickets === 0) return null;
    
    const battingTeam = innings.battingTeamId === state.teamA.id ? state.teamA : state.teamB;
    
    return (
        <View style={styles.fallOfWickets}>
            <Text style={styles.fowTitle}>Fall of Wickets:</Text>
            <Text style={styles.fowText}>
                {innings.deliveries
                    .filter(d => d.wicket && d.wicketType !== 'retired')
                    .map((d, idx) => {
                        // Find the batsman who got out
                        const outBatsman = battingTeam.players.find(p => p.id === d.outBatsmanId);
                        
                        // Calculate score at dismissal
                        const previousDeliveries = innings.deliveries.slice(0, 
                            innings.deliveries.indexOf(d) + 1);
                        
                        // Count legal deliveries to determine overs
                        const legalDeliveries = previousDeliveries.filter(
                            del => !del.extraType || (del.extraType !== 'wide' && del.extraType !== 'no-ball')
                        ).length;
                        
                        const overs = Math.floor(legalDeliveries / 6);
                        const balls = legalDeliveries % 6;
                        
                        // Sum up runs to get score at dismissal
                        const runsAtDismissal = previousDeliveries.reduce(
                            (sum, del) => sum + (del.totalRuns || del.runs || 0), 0);
                        
                        return `${idx + 1}-${runsAtDismissal} (${outBatsman?.name || 'Unknown'}, ${overs}.${balls})`;
                    })
                    .join(', ')}
            </Text>
        </View>
    );
};

// Component for batting scorecard 
const BattingScorecard: React.FC<BattingScorecardProps> = ({ innings, battingTeam, bowlingTeam, isCurrentInnings = false }) => {
    // Helper function to get bowler name
    const getBowlerName = (bowlerId?: string): string => {
        if (!bowlerId) return 'Unknown';
        const bowler = bowlingTeam.players.find(p => p.id === bowlerId);
        return bowler ? bowler.name : 'Unknown';
    };

    // Helper function to get fielder name
    const getFielderName = (fielderId?: string): string => {
        if (!fielderId) return 'Unknown';
        const fielder = bowlingTeam.players.find(p => p.id === fielderId);
        return fielder ? fielder.name : 'Unknown';
    };
    
    // Function to determine dismissal info
    const getDismissalInfo = (player: Cricketer): string => {
        if (!player.isOut) {
            if (player.id === innings.currentStrikerId || player.id === innings.currentNonStrikerId) {
                return 'not out';
            }
            if (player.balls === 0) {
                return 'did not bat';
            }
            return '';
        }
        
        // Find the delivery where this player got out
        const dismissalDelivery = innings.deliveries.find(d =>
            d.wicket && d.outBatsmanId === player.id
        );
        
        if (!dismissalDelivery) return 'out';
        
        // Format dismissal based on wicket type
        switch (dismissalDelivery.wicketType) {
            case 'bowled':
                return `b ${getBowlerName(dismissalDelivery.bowlerId)}`;
            case 'caught':
                return `c ${getFielderName(dismissalDelivery.fielderId)} b ${getBowlerName(dismissalDelivery.bowlerId)}`;
            case 'lbw':
                return `lbw b ${getBowlerName(dismissalDelivery.bowlerId)}`;
            case 'runout':
                return `run out (${getFielderName(dismissalDelivery.fielderId)})`;
            case 'stumped':
                return `st ${getFielderName(dismissalDelivery.fielderId)} b ${getBowlerName(dismissalDelivery.bowlerId)}`;
            default:
                return dismissalDelivery.wicketType || 'out';
        }
    };
    
    // Logic to determine which players to show
    const shouldShowPlayer = (player: Cricketer): boolean => {
        const hasPlayed = player.balls > 0 || player.isOut;
        const isAtCrease = player.id === innings.currentStrikerId || player.id === innings.currentNonStrikerId;
        
        return isCurrentInnings ? 
            (hasPlayed || isAtCrease || innings.isAllOut || innings.isCompleted) : 
            (hasPlayed || player.isOut);
    };
    
    return (
        <View style={styles.scorecardSection}>
            <Text style={styles.sectionHeader}>
                {isCurrentInnings ? 
                    `${battingTeam.teamName} Batting` : 
                    `${battingTeam.teamName} Batting`}
            </Text>
            <View style={styles.scoreTableHeader}>
                <Text style={[styles.headerCell, styles.nameCell]}>Batsman</Text>
                <Text style={styles.headerCell}>R</Text>
                <Text style={styles.headerCell}>B</Text>
                <Text style={styles.headerCell}>4s</Text>
                <Text style={styles.headerCell}>6s</Text>
                <Text style={styles.headerCell}>SR</Text>
            </View>
            
            {battingTeam.players
                .filter(player => shouldShowPlayer(player))
                .map(player => (
                    <BatsmanRow 
                        key={player.id}
                        player={player}
                        dismissalInfo={getDismissalInfo(player)}
                        isStriker={player.id === innings.currentStrikerId}
                        isNonStriker={player.id === innings.currentNonStrikerId}
                    />
                ))
            }
            
            <InningsExtras innings={innings} />
            <InningsTotal innings={innings} />
        </View>
    );
};

// Component for bowling scorecard
const BowlingScorecard: React.FC<BowlingScorecardProps> = ({ innings, bowlingTeam }) => (
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
            .filter(p => p.overs > 0 || p.ballsThisOver > 0)
            .map(player => (
                <BowlerRow 
                    key={player.id}
                    player={player}
                    isBowling={player.id === innings.currentBowlerId}
                />
            ))
        }
    </View>
);

// Component for innings summary
const InningsSummary: React.FC<InningsSummaryProps> = ({ innings, state }) => {
    if (!innings.isCompleted) return null;
    
    const battingTeam = innings.battingTeamId === state.teamA.id ? state.teamA : state.teamB;
    
    return (
        <View style={styles.scorecardSection}>
            <Text style={styles.sectionHeader}>
                {innings === state.innings1 ? '1st' : '2nd'} Innings Summary
            </Text>
            <Text style={styles.inningsSummary}>
                {battingTeam.teamName}: {innings.totalRuns}/{innings.wickets}
                ({innings.completedOvers}.{innings.ballInCurrentOver} overs)
            </Text>
            
            <FallOfWickets innings={innings} state={state} />
        </View>
    );
};

const ScorecardTab: React.FC<ScorecardTabProps> = ({
    battingTeam,
    bowlingTeam,
    currentInnings,
    currentInning,
    targetScore,
    matchResult,
    state,
}) => {
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

            {/* Current Innings Details */}
            {battingTeam && bowlingTeam && currentInnings && (
                <>
                    <BattingScorecard 
                        innings={currentInnings}
                        battingTeam={battingTeam}
                        bowlingTeam={bowlingTeam}
                        isCurrentInnings={true}
                    />
                    
                    <BowlingScorecard 
                        innings={currentInnings}
                        bowlingTeam={bowlingTeam}
                    />
                </>
            )}

            {/* First Innings Details (if not current and completed) */}
            {state.innings1.isCompleted && currentInning !== 1 && (
                <>
                    <BattingScorecard 
                        innings={state.innings1}
                        battingTeam={state.innings1.battingTeamId === state.teamA.id ? state.teamA : state.teamB}
                        bowlingTeam={state.innings1.battingTeamId === state.teamA.id ? state.teamB : state.teamA}
                        isCurrentInnings={false}
                    />
                    
                    <BowlingScorecard 
                        innings={state.innings1}
                        bowlingTeam={state.innings1.bowlingTeamId === state.teamA.id ? state.teamA : state.teamB}
                    />
                </>
            )}

            {/* Innings Summaries */}
            <InningsSummary innings={state.innings1} state={state} />
            
            {state.innings2.isCompleted && matchResult && (
                <InningsSummary innings={state.innings2} state={state} />
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

// Styles remain the same
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