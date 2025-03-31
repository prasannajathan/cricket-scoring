import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView 
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Team, SavedMatch, Cricketer } from '@/types';
import { getSavedMatches } from '@/utils/matchStorage';
import { colors, spacing, radius } from '@/constants/theme';

// Define player stats interface
interface PlayerStats {
    id: string;
    name: string;
    matches: number;
    battingStats: {
        innings: number;
        runs: number;
        balls: number;
        highScore: number;
        average: number;
        strikeRate: number;
        fifties: number;
        hundreds: number;
        fours: number;
        sixes: number;
    };
    bowlingStats: {
        innings: number;
        overs: number;
        wickets: number;
        runsConceded: number;
        economy: number;
        average: number; // runs conceded / wickets
        bestBowling: string; // format: "3/25"
        fiveWickets: number;
    };
    fieldingStats: {
        catches: number;
        runouts: number;
    };
}

export default function TeamDetailScreen() {
    const { id } = useLocalSearchParams();
    const [team, setTeam] = useState<Team | null>(null);
    const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
    const [teamMatches, setTeamMatches] = useState<SavedMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'batting' | 'bowling' | 'fielding' | 'insights'>('batting');

    useEffect(() => {
        loadTeamAndStats();
    }, [id]);

    const loadTeamAndStats = async () => {
        setLoading(true);
        try {
            const savedMatches = await getSavedMatches();
            if (!savedMatches) {
                setLoading(false);
                return;
            }

            const foundTeam = savedMatches.reduce((found: Team | null, match: SavedMatch) => {
                if (match.teamA.id === id) return match.teamA;
                if (match.teamB.id === id) return match.teamB;
                return found;
            }, null);

            if (foundTeam) {
                setTeam(foundTeam);

                const matches = savedMatches.filter(match =>
                    match.teamA.id === id || match.teamB.id === id
                );

                setTeamMatches(matches);

                const stats = calculatePlayerStats(foundTeam, matches);
                setPlayerStats(stats);
            }
        } catch (error) {
            console.error('Error loading team details:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculatePlayerStats = (team: Team, matches: SavedMatch[]): PlayerStats[] => {
        try {
            const teamMatches = matches.filter(match =>
                match.teamA.id === team.id || match.teamB.id === team.id
            );

            const playerStatsMap = new Map<string, PlayerStats>();

            team.players.forEach(player => {
                playerStatsMap.set(player.id, {
                    id: player.id,
                    name: player.name,
                    matches: 0,
                    battingStats: {
                        innings: 0,
                        runs: 0,
                        balls: 0,
                        highScore: 0,
                        average: 0,
                        strikeRate: 0,
                        fifties: 0,
                        hundreds: 0,
                        fours: 0,
                        sixes: 0,
                    },
                    bowlingStats: {
                        innings: 0,
                        overs: 0,
                        wickets: 0,
                        runsConceded: 0,
                        economy: 0,
                        average: 0,
                        bestBowling: "0/0",
                        fiveWickets: 0,
                    },
                    fieldingStats: {
                        catches: 0,
                        runouts: 0,
                    }
                });
            });

            teamMatches.forEach(match => {
                [match.innings1, match.innings2].forEach(innings => {
                    const isBattingTeam = innings.battingTeamId === team.id;
                    const teamInMatch = isBattingTeam
                        ? (match.teamA.id === team.id ? match.teamA : match.teamB)
                        : (match.teamA.id === team.id ? match.teamA : match.teamB);

                    if (isBattingTeam) {
                        const battedPlayerIds = new Set<string>();

                        innings.deliveries.forEach(delivery => {
                            if (delivery.strikerId) {
                                battedPlayerIds.add(delivery.strikerId);
                            }
                            if (delivery.nonStrikerId) {
                                battedPlayerIds.add(delivery.nonStrikerId);
                            }
                        });

                        battedPlayerIds.forEach(batsmanId => {
                            if (playerStatsMap.has(batsmanId)) {
                                const playerStats = playerStatsMap.get(batsmanId)!;

                                const batsmanInMatch = teamInMatch.players.find(p => p.id === batsmanId);

                                if (batsmanInMatch) {
                                    playerStats.battingStats.innings++;
                                    playerStats.matches++;

                                    const runsScored = batsmanInMatch.runs || 0;
                                    const ballsFaced = batsmanInMatch.balls || 0;
                                    const foursHit = batsmanInMatch.fours || 0;
                                    const sixesHit = batsmanInMatch.sixes || 0;

                                    playerStats.battingStats.runs += runsScored;
                                    playerStats.battingStats.balls += ballsFaced;
                                    playerStats.battingStats.fours += foursHit;
                                    playerStats.battingStats.sixes += sixesHit;

                                    if (runsScored > playerStats.battingStats.highScore) {
                                        playerStats.battingStats.highScore = runsScored;
                                    }

                                    if (runsScored >= 100) {
                                        playerStats.battingStats.hundreds++;
                                    } else if (runsScored >= 50) {
                                        playerStats.battingStats.fifties++;
                                    }

                                    playerStatsMap.set(batsmanId, playerStats);
                                }
                            }
                        });
                    } else {
                        const bowlerIds = new Set<string>();
                        const bowlerWickets = new Map<string, number>();
                        const bowlerRuns = new Map<string, number>();
                        const bowlerLegalDeliveries = new Map<string, number>();

                        innings.deliveries.forEach(delivery => {
                            if (delivery.bowlerId && playerStatsMap.has(delivery.bowlerId)) {
                                const playerStats = playerStatsMap.get(delivery.bowlerId)!;

                                if (!bowlerIds.has(delivery.bowlerId)) {
                                    bowlerIds.add(delivery.bowlerId);
                                    playerStats.bowlingStats.innings++;
                                    playerStats.matches++;
                                }

                                playerStats.bowlingStats.runsConceded += (delivery.totalRuns || delivery.runs || 0);

                                if (!delivery.extraType || (delivery.extraType !== 'wide' && delivery.extraType !== 'no-ball')) {
                                    const currentDeliveries = bowlerLegalDeliveries.get(delivery.bowlerId) || 0;
                                    bowlerLegalDeliveries.set(delivery.bowlerId, currentDeliveries + 1);
                                }

                                if (delivery.wicket && ['bowled', 'caught', 'lbw', 'stumped'].includes(delivery.wicketType || '')) {
                                    playerStats.bowlingStats.wickets++;

                                    const currentWickets = bowlerWickets.get(delivery.bowlerId) || 0;
                                    bowlerWickets.set(delivery.bowlerId, currentWickets + 1);

                                    const currentRuns = bowlerRuns.get(delivery.bowlerId) || 0;
                                    bowlerRuns.set(delivery.bowlerId, currentRuns + (delivery.runs || 0));
                                }

                                playerStatsMap.set(delivery.bowlerId, playerStats);
                            }

                            if (delivery.wicket && delivery.fielderId && playerStatsMap.has(delivery.fielderId)) {
                                const playerStats = playerStatsMap.get(delivery.fielderId)!;

                                if (delivery.wicketType === 'caught') {
                                    playerStats.fieldingStats.catches++;
                                } else if (delivery.wicketType === 'runout') {
                                    playerStats.fieldingStats.runouts++;
                                }

                                playerStatsMap.set(delivery.fielderId, playerStats);
                                playerStats.matches++;
                            }
                        });

                        bowlerIds.forEach(bowlerId => {
                            if (playerStatsMap.has(bowlerId)) {
                                const playerStats = playerStatsMap.get(bowlerId)!;
                                const legalDeliveries = bowlerLegalDeliveries.get(bowlerId) || 0;

                                const completeOvers = Math.floor(legalDeliveries / 6);
                                const remainingBalls = legalDeliveries % 6;

                                playerStats.bowlingStats.overs = completeOvers + (remainingBalls / 10);

                                playerStatsMap.set(bowlerId, playerStats);
                            }
                        });

                        bowlerIds.forEach(bowlerId => {
                            const wickets = bowlerWickets.get(bowlerId) || 0;
                            const runs = bowlerRuns.get(bowlerId) || 0;

                            if (playerStatsMap.has(bowlerId)) {
                                const playerStats = playerStatsMap.get(bowlerId)!;

                                const [bestWickets, bestRuns] = playerStats.bowlingStats.bestBowling.split('/').map(n => parseInt(n) || 0);

                                if (
                                    wickets > bestWickets ||
                                    (wickets === bestWickets && runs < bestRuns)
                                ) {
                                    playerStats.bowlingStats.bestBowling = `${wickets}/${runs}`;
                                }

                                if (wickets >= 5) {
                                    playerStats.bowlingStats.fiveWickets++;
                                }

                                playerStatsMap.set(bowlerId, playerStats);
                            }
                        });
                    }
                });
            });

            playerStatsMap.forEach((stats, id) => {
                if (stats.battingStats.balls > 0) {
                    stats.battingStats.strikeRate = +(stats.battingStats.runs / stats.battingStats.balls * 100).toFixed(2);
                }

                if (stats.battingStats.innings > 0) {
                    stats.battingStats.average = +(stats.battingStats.runs / stats.battingStats.innings).toFixed(2);
                }

                if (stats.bowlingStats.overs > 0) {
                    stats.bowlingStats.economy = +(stats.bowlingStats.runsConceded / stats.bowlingStats.overs).toFixed(2);
                }

                if (stats.bowlingStats.wickets > 0) {
                    stats.bowlingStats.average = +(stats.bowlingStats.runsConceded / stats.bowlingStats.wickets).toFixed(2);
                }

                playerStatsMap.set(id, stats);
            });

            return Array.from(playerStatsMap.values());
        } catch (error) {
            console.error('Error calculating player stats:', error);
            return [];
        }
    };

    const renderPlayerStats = () => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.brandBlue} />
                    <Text style={styles.loadingText}>Loading statistics...</Text>
                </View>
            );
        }

        if (activeTab === 'batting') {
            const battingStats = playerStats
                .filter(player => player.battingStats.innings > 0 || player.battingStats.runs > 0)
                .sort((a, b) => b.battingStats.runs - a.battingStats.runs);

            return (
                <FlatList
                    data={battingStats}
                    keyExtractor={item => item.id}
                    ListHeaderComponent={() => (
                        <View style={styles.tableHeader}>
                            <Text style={[styles.headerCell, styles.nameCell]}>Player</Text>
                            <Text style={styles.headerCell}>M</Text>
                            <Text style={styles.headerCell}>I</Text>
                            <Text style={styles.headerCell}>Runs</Text>
                            <Text style={styles.headerCell}>HS</Text>
                            <Text style={styles.headerCell}>Avg</Text>
                            <Text style={styles.headerCell}>SR</Text>
                        </View>
                    )}
                    renderItem={({ item }) => (
                        <View style={styles.tableRow}>
                            <Text style={[styles.cell, styles.nameCell]}>{item.name}</Text>
                            <Text style={styles.cell}>{item.matches}</Text>
                            <Text style={styles.cell}>{item.battingStats.innings}</Text>
                            <Text style={styles.cell}>{item.battingStats.runs}</Text>
                            <Text style={styles.cell}>{item.battingStats.highScore}</Text>
                            <Text style={styles.cell}>{item.battingStats.average > 0 ? item.battingStats.average.toFixed(1) : '-'}</Text>
                            <Text style={styles.cell}>{item.battingStats.strikeRate > 0 ? item.battingStats.strikeRate.toFixed(1) : '-'}</Text>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyStats}>
                            <FontAwesome name="bar-chart" size={40} color={colors.ccc} style={styles.emptyIcon} />
                            <Text style={styles.emptyText}>No batting statistics available</Text>
                        </View>
                    }
                />
            );
        }

        if (activeTab === 'bowling') {
            const bowlingStats = playerStats
                .filter(player => player.bowlingStats.overs > 0 || player.bowlingStats.wickets > 0)
                .sort((a, b) => b.bowlingStats.wickets - a.bowlingStats.wickets);

            return (
                <FlatList
                    data={bowlingStats}
                    keyExtractor={item => item.id}
                    ListHeaderComponent={() => (
                        <View style={styles.tableHeader}>
                            <Text style={[styles.headerCell, styles.nameCell]}>Player</Text>
                            <Text style={styles.headerCell}>M</Text>
                            <Text style={styles.headerCell}>O</Text>
                            <Text style={styles.headerCell}>W</Text>
                            <Text style={styles.headerCell}>R</Text>
                            <Text style={styles.headerCell}>Econ</Text>
                            <Text style={styles.headerCell}>Best</Text>
                        </View>
                    )}
                    renderItem={({ item }) => {
                        const oversFormat = () => {
                            const completeOvers = Math.floor(item.bowlingStats.overs);
                            const balls = Math.round((item.bowlingStats.overs - completeOvers) * 10);
                            return `${completeOvers}.${balls}`;
                        };

                        return (
                            <View style={styles.tableRow}>
                                <Text style={[styles.cell, styles.nameCell]}>{item.name}</Text>
                                <Text style={styles.cell}>{item.matches}</Text>
                                <Text style={styles.cell}>{oversFormat()}</Text>
                                <Text style={styles.cell}>{item.bowlingStats.wickets}</Text>
                                <Text style={styles.cell}>{item.bowlingStats.runsConceded}</Text>
                                <Text style={styles.cell}>{item.bowlingStats.economy > 0 ? item.bowlingStats.economy.toFixed(1) : '-'}</Text>
                                <Text style={styles.cell}>{item.bowlingStats.bestBowling}</Text>
                            </View>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyStats}>
                            <FontAwesome name="bar-chart" size={40} color={colors.ccc} style={styles.emptyIcon} />
                            <Text style={styles.emptyText}>No bowling statistics available</Text>
                        </View>
                    }
                />
            );
        }

        if (activeTab === 'fielding') {
            const fieldingStats = playerStats
                .filter(player => player.fieldingStats.catches > 0 || player.fieldingStats.runouts > 0)
                .sort((a, b) => (b.fieldingStats.catches + b.fieldingStats.runouts) - 
                              (a.fieldingStats.catches + a.fieldingStats.runouts));

            return (
                <FlatList
                    data={fieldingStats}
                    keyExtractor={item => item.id}
                    ListHeaderComponent={() => (
                        <View style={styles.tableHeader}>
                            <Text style={[styles.headerCell, styles.nameCell]}>Player</Text>
                            <Text style={styles.headerCell}>M</Text>
                            <Text style={styles.headerCell}>Catches</Text>
                            <Text style={styles.headerCell}>Run Outs</Text>
                            <Text style={styles.headerCell}>Total</Text>
                        </View>
                    )}
                    renderItem={({ item }) => (
                        <View style={styles.tableRow}>
                            <Text style={[styles.cell, styles.nameCell]}>{item.name}</Text>
                            <Text style={styles.cell}>{item.matches}</Text>
                            <Text style={styles.cell}>{item.fieldingStats.catches}</Text>
                            <Text style={styles.cell}>{item.fieldingStats.runouts}</Text>
                            <Text style={styles.cell}>{item.fieldingStats.catches + item.fieldingStats.runouts}</Text>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyStats}>
                            <FontAwesome name="bar-chart" size={40} color={colors.ccc} style={styles.emptyIcon} />
                            <Text style={styles.emptyText}>No fielding statistics available</Text>
                        </View>
                    }
                />
            );
        }

        if (activeTab === 'insights') {
            return team ? <TeamInsights team={team} playerStats={playerStats} matches={teamMatches} /> : null;
        }

        return null;
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {team && (
                    <View style={styles.teamHeader}>
                        <View style={styles.teamHeaderContent}>
                            <Text style={styles.teamName}>{team.teamName}</Text>
                            <View style={styles.teamMetaInfo}>
                                <View style={styles.teamStatBadge}>
                                    <FontAwesome name="users" size={16} color={colors.white} style={styles.teamStatIcon} />
                                    <Text style={styles.teamStatText}>{team.players.length} Players</Text>
                                </View>
                                
                                <View style={styles.teamStatBadge}>
                                    <FontAwesome name="trophy" size={16} color={colors.white} style={styles.teamStatIcon} />
                                    <Text style={styles.teamStatText}>{teamMatches.length} Matches</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.tabContainer}>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabScrollContent}
                    >
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'batting' && styles.activeTab]}
                            onPress={() => setActiveTab('batting')}
                        >
                            <FontAwesome name="user" size={16} color={activeTab === 'batting' ? colors.brandBlue : colors.brandDark} style={styles.tabIcon} />
                            <Text style={[styles.tabText, activeTab === 'batting' && styles.activeTabText]}>
                                Batting
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'bowling' && styles.activeTab]}
                            onPress={() => setActiveTab('bowling')}
                        >
                            <FontAwesome name="dot-circle-o" size={16} color={activeTab === 'bowling' ? colors.brandBlue : colors.brandDark} style={styles.tabIcon} />
                            <Text style={[styles.tabText, activeTab === 'bowling' && styles.activeTabText]}>
                                Bowling
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'fielding' && styles.activeTab]}
                            onPress={() => setActiveTab('fielding')}
                        >
                            <FontAwesome name="hand-paper-o" size={16} color={activeTab === 'fielding' ? colors.brandBlue : colors.brandDark} style={styles.tabIcon} />
                            <Text style={[styles.tabText, activeTab === 'fielding' && styles.activeTabText]}>
                                Fielding
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'insights' && styles.activeTab]}
                            onPress={() => setActiveTab('insights')}
                        >
                            <FontAwesome name="lightbulb-o" size={16} color={activeTab === 'insights' ? colors.brandBlue : colors.brandDark} style={styles.tabIcon} />
                            <Text style={[styles.tabText, activeTab === 'insights' && styles.activeTabText]}>
                                Insights
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                <View style={styles.statsContainer}>
                    {renderPlayerStats()}
                </View>
            </View>
        </SafeAreaView>
    );
}

const TeamInsights = ({ team, playerStats, matches }) => {
    const topRunScorer = playerStats.reduce((prev, current) =>
        prev.battingStats.runs > current.battingStats.runs ? prev : current, playerStats[0]);

    const topWicketTaker = playerStats.reduce((prev, current) =>
        prev.bowlingStats.wickets > current.bowlingStats.wickets ? prev : current, playerStats[0]);

    const bestBattingAvg = playerStats.reduce((prev, current) =>
        prev.battingStats.average > current.battingStats.average ? prev : current, playerStats[0]);

    const bestEconomy = playerStats.reduce((prev, current) =>
        (current.bowlingStats.overs > 0 && prev.bowlingStats.economy > current.bowlingStats.economy) ? current : prev, playerStats[0]);

    const battingPositionStrength = calculatePositionalStrength(matches, team.id);
    const powerPlayPerformance = calculatePowerPlayPerformance(matches, team.id);
    const deathOversPerformance = calculateDeathOversPerformance(matches, team.id);

    const bestEleven = calculateBestEleven(playerStats);

    const batters = bestEleven.filter(p =>
        p.battingStats.average > 20 && p.bowlingStats.wickets < 3);

    const allRounders = bestEleven.filter(p =>
        p.battingStats.runs >= 30 && p.bowlingStats.wickets >= 3);

    const bowlers = bestEleven.filter(p =>
        p.battingStats.average < 20 && p.bowlingStats.wickets >= 3);

    const [showingTab, setShowingTab] = useState('insights');

    return (
        <ScrollView style={styles.insightsContainer}>
            <View style={styles.insightTabs}>
                <TouchableOpacity
                    style={[styles.insightTab, showingTab === 'insights' ? styles.activeInsightTab : null]}
                    onPress={() => setShowingTab('insights')}
                >
                    <Text style={[styles.insightTabText, showingTab === 'insights' ? styles.activeInsightTabText : null]}>
                        Team Insights
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.insightTab, showingTab === 'bestXI' ? styles.activeInsightTab : null]}
                    onPress={() => setShowingTab('bestXI')}
                >
                    <Text style={[styles.insightTabText, showingTab === 'bestXI' ? styles.activeInsightTabText : null]}>
                        Best XI
                    </Text>
                </TouchableOpacity>
            </View>

            {showingTab === 'insights' ? (
                <>
                    <View style={styles.insightCard}>
                        <Text style={styles.insightTitle}>Team Leaders</Text>
                        <View style={styles.leaderItem}>
                            <Text style={styles.leaderLabel}>Top Run Scorer:</Text>
                            <Text style={styles.leaderValue}>{topRunScorer.name} ({topRunScorer.battingStats.runs} runs)</Text>
                        </View>
                        <View style={styles.leaderItem}>
                            <Text style={styles.leaderLabel}>Top Wicket Taker:</Text>
                            <Text style={styles.leaderValue}>{topWicketTaker.name} ({topWicketTaker.bowlingStats.wickets} wickets)</Text>
                        </View>
                        <View style={styles.leaderItem}>
                            <Text style={styles.leaderLabel}>Best Batting Average:</Text>
                            <Text style={styles.leaderValue}>{bestBattingAvg.name} ({bestBattingAvg.battingStats.average})</Text>
                        </View>
                        <View style={styles.leaderItem}>
                            <Text style={styles.leaderLabel}>Best Economy:</Text>
                            <Text style={styles.leaderValue}>{bestEconomy.name} ({bestEconomy.bowlingStats.economy})</Text>
                        </View>
                    </View>

                    <View style={styles.insightCard}>
                        <Text style={styles.insightTitle}>Team Strengths</Text>
                        <Text style={styles.insightText}>
                            {battingPositionStrength.strongPositions.length > 0
                                ? `Strong batting positions: ${battingPositionStrength.strongPositions.join(', ')}`
                                : 'Not enough data to analyze batting positions'}
                        </Text>
                        <Text style={styles.insightText}>
                            {powerPlayPerformance.isBattingStrong
                                ? 'Team performs well during batting powerplay'
                                : 'Consider strategies to improve powerplay batting'}
                        </Text>
                        <Text style={styles.insightText}>
                            {deathOversPerformance.isBowlingStrong
                                ? 'Death overs bowling is a strength'
                                : 'Consider improving death overs bowling tactics'}
                        </Text>
                    </View>

                    <View style={styles.insightCard}>
                        <Text style={styles.insightTitle}>Team Weaknesses</Text>
                        <Text style={styles.insightText}>
                            {battingPositionStrength.weakPositions.length > 0
                                ? `Weak batting positions: ${battingPositionStrength.weakPositions.join(', ')}`
                                : 'Not enough data to analyze weak positions'}
                        </Text>
                        <Text style={styles.insightText}>
                            {!powerPlayPerformance.isBattingStrong
                                ? 'Team struggles during batting powerplay'
                                : 'No significant batting powerplay concerns'}
                        </Text>
                        <Text style={styles.insightText}>
                            {!deathOversPerformance.isBowlingStrong
                                ? 'Death overs bowling needs improvement'
                                : 'No significant death overs bowling concerns'}
                        </Text>
                    </View>

                    <View style={styles.insightCard}>
                        <Text style={styles.insightTitle}>Recommended Focus Areas</Text>
                        <Text style={styles.insightText}>
                            {battingPositionStrength.weakPositions.length > 0
                                ? `Strengthen batting positions: ${battingPositionStrength.weakPositions.join(', ')}`
                                : 'Continue developing balanced batting lineup'}
                        </Text>
                        <Text style={styles.insightText}>
                            {topWicketTaker.bowlingStats.wickets < 10
                                ? 'Develop more wicket-taking bowlers'
                                : 'Continue supporting strong bowling lineup'}
                        </Text>
                        <Text style={styles.insightText}>
                            {powerPlayPerformance.isBattingStrong && deathOversPerformance.isBowlingStrong
                                ? 'Team shows good balance - focus on consistency'
                                : 'Work on strengthening phase-specific performance'}
                        </Text>
                    </View>
                </>
            ) : (
                <View style={styles.insightCard}>
                    <Text style={styles.insightTitle}>Recommended Best XI</Text>
                    <Text style={styles.insightSubheading}>Top Order Batters</Text>
                    {batters.map((player, index) => (
                        <View key={player.id} style={styles.playerItem}>
                            <Text style={styles.playerItemNumber}>{index + 1}.</Text>
                            <Text style={styles.playerItemName}>{player.name}</Text>
                            <Text style={styles.playerItemRole}>
                                {player.battingStats.average > 30 ? 'Specialist Batter' : 'Batter'}
                            </Text>
                        </View>
                    ))}

                    <Text style={[styles.insightSubheading, { marginTop: 12 }]}>All-Rounders</Text>
                    {allRounders.map((player, index) => (
                        <View key={player.id} style={styles.playerItem}>
                            <Text style={styles.playerItemNumber}>{batters.length + index + 1}.</Text>
                            <Text style={styles.playerItemName}>{player.name}</Text>
                            <Text style={styles.playerItemRole}>
                                {player.battingStats.average > player.bowlingStats.average ? 'Batting All-rounder' : 'Bowling All-rounder'}
                            </Text>
                        </View>
                    ))}

                    <Text style={[styles.insightSubheading, { marginTop: 12 }]}>Bowlers</Text>
                    {bowlers.map((player, index) => (
                        <View key={player.id} style={styles.playerItem}>
                            <Text style={styles.playerItemNumber}>{batters.length + allRounders.length + index + 1}.</Text>
                            <Text style={styles.playerItemName}>{player.name}</Text>
                            <Text style={styles.playerItemRole}>
                                {player.bowlingStats.economy < 6 ? 'Economy Bowler' : 'Strike Bowler'}
                            </Text>
                        </View>
                    ))}

                    {bestEleven.length < 11 && (
                        <Text style={styles.insufficientDataText}>
                            Note: Insufficient data to recommend a complete XI. Play more matches to improve recommendations.
                        </Text>
                    )}

                    <Text style={styles.insightText}>
                        This best XI is based on player performance statistics across all matches.
                        The team balance aims for 5-6 batters, 1-2 all-rounders, and 4-5 bowlers.
                    </Text>
                </View>
            )}
        </ScrollView>
    );
};

const calculatePositionalStrength = (matches: SavedMatch[], teamId: string) => {
    const positionStats: { [key: number]: { runs: number, balls: number } } = {};

    for (let i = 1; i <= 7; i++) {
        positionStats[i] = { runs: 0, balls: 0 };
    }

    matches.forEach(match => {
        [match.innings1, match.innings2].forEach(innings => {
            if (innings.battingTeamId === teamId) {
                const battingOrder = new Map<string, number>();
                let position = 1;

                innings.deliveries.forEach(delivery => {
                    if (delivery.strikerId && !battingOrder.has(delivery.strikerId)) {
                        battingOrder.set(delivery.strikerId, position);
                        position++;
                    }

                    if (delivery.strikerId) {
                        const pos = battingOrder.get(delivery.strikerId) || 0;
                        if (pos <= 7) {
                            positionStats[pos].runs += delivery.runs || 0;
                            positionStats[pos].balls += 1;
                        }
                    }
                });
            }
        });
    });

    const positionPerformance = Object.keys(positionStats).map(pos => {
        const numPos = Number(pos);
        const stats = positionStats[numPos];
        return {
            position: numPos,
            strikeRate: stats.balls > 0 ? (stats.runs / stats.balls) * 100 : 0,
            runs: stats.runs,
            balls: stats.balls
        };
    });

    positionPerformance.sort((a, b) => b.strikeRate - a.strikeRate);

    const strongPositions = positionPerformance
        .filter(pos => pos.balls >= 20 && pos.strikeRate > 120)
        .map(pos => pos.position);

    const weakPositions = positionPerformance
        .filter(pos => pos.balls >= 20 && pos.strikeRate < 100)
        .map(pos => pos.position);

    return { strongPositions, weakPositions, positionPerformance };
};

const calculatePowerPlayPerformance = (matches: SavedMatch[], teamId: string) => {
    let totalPowerplayRuns = 0;
    let totalPowerplayBalls = 0;
    let totalPowerplayWickets = 0;

    matches.forEach(match => {
        [match.innings1, match.innings2].forEach(innings => {
            if (innings.battingTeamId === teamId) {
                const powerplayDeliveries = innings.deliveries.filter(delivery => {
                    const overNumber = Math.floor(innings.deliveries.indexOf(delivery) / 6) + 1;
                    return overNumber <= 6;
                });

                powerplayDeliveries.forEach(delivery => {
                    totalPowerplayRuns += delivery.runs || 0;
                    totalPowerplayBalls++;
                    if (delivery.wicket) totalPowerplayWickets++;
                });
            }
        });
    });

    const powerplayStrikeRate = totalPowerplayBalls > 0 ?
        (totalPowerplayRuns / totalPowerplayBalls) * 100 : 0;

    const wicketRate = totalPowerplayBalls > 0 ?
        (totalPowerplayWickets / totalPowerplayBalls) * 100 : 0;

    const isBattingStrong = powerplayStrikeRate > 120 && wicketRate < 4;

    return {
        isBattingStrong,
        powerplayStrikeRate,
        wicketRate,
        totalPowerplayRuns,
        totalPowerplayWickets
    };
};

const calculateDeathOversPerformance = (matches: SavedMatch[], teamId: string) => {
    let totalDeathRunsConceded = 0;
    let totalDeathBalls = 0;
    let totalDeathWickets = 0;

    matches.forEach(match => {
        [match.innings1, match.innings2].forEach(innings => {
            if (innings.bowlingTeamId === teamId) {
                const totalOvers = innings.completedOvers + (innings.ballInCurrentOver > 0 ? 1 : 0);

                if (totalOvers < 4) return;

                const deathOversStart = (totalOvers - 4) * 6;

                const deathDeliveries = innings.deliveries.slice(deathOversStart);

                deathDeliveries.forEach(delivery => {
                    totalDeathRunsConceded += delivery.runs || 0;
                    totalDeathBalls++;
                    if (delivery.wicket && delivery.bowlerId) totalDeathWickets++;
                });
            }
        });
    });

    const deathEconomy = totalDeathBalls > 0 ?
        (totalDeathRunsConceded / totalDeathBalls) * 6 : 0;

    const wicketRate = totalDeathBalls > 0 ?
        (totalDeathWickets / totalDeathBalls) * 100 : 0;

    const isBowlingStrong = deathEconomy < 8.5 && wicketRate > 5;

    return {
        isBowlingStrong,
        deathEconomy,
        wicketRate,
        totalDeathRunsConceded,
        totalDeathWickets
    };
};

const calculateBestEleven = (playerStats: PlayerStats[]): PlayerStats[] => {
    const stats = [...playerStats];

    const bestBatters = stats
        .filter(player => player.battingStats.innings >= 2)
        .sort((a, b) => b.battingStats.average - a.battingStats.average)
        .slice(0, 6);

    const bestBowlers = stats
        .filter(player => player.bowlingStats.overs >= 2)
        .sort((a, b) => {
            if (a.bowlingStats.average === 0) return 1;
            if (b.bowlingStats.average === 0) return -1;
            return a.bowlingStats.average - b.bowlingStats.average;
        })
        .slice(0, 5);

    const bestPlayerIds = new Set();
    const bestEleven: PlayerStats[] = [];

    bestBatters.forEach(player => {
        if (!bestPlayerIds.has(player.id)) {
            bestPlayerIds.add(player.id);
            bestEleven.push(player);
        }
    });

    bestBowlers.forEach(player => {
        if (!bestPlayerIds.has(player.id)) {
            bestPlayerIds.add(player.id);
            bestEleven.push(player);
        }
    });

    if (bestEleven.length < 11) {
        stats
            .filter(player => !bestPlayerIds.has(player.id))
            .sort((a, b) => {
                const aValue = a.battingStats.average + a.fieldingStats.catches + a.bowlingStats.wickets * 2;
                const bValue = b.battingStats.average + b.fieldingStats.catches + b.bowlingStats.wickets * 2;
                return bValue - aValue;
            })
            .slice(0, 11 - bestEleven.length)
            .forEach(player => bestEleven.push(player));
    }

    return bestEleven;
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.white,
    },
    container: {
        flex: 1,
        backgroundColor: colors.brandLight,
    },
    teamHeader: {
        backgroundColor: colors.brandBlue,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    teamHeaderContent: {
        alignItems: 'center',
    },
    teamName: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.white,
        marginBottom: spacing.xs,
    },
    teamMetaInfo: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.sm,
    },
    teamStatBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.xl,
        marginHorizontal: spacing.xs,
    },
    teamStatIcon: {
        marginRight: spacing.xs,
    },
    teamStatText: {
        color: colors.white,
        fontWeight: '500',
        fontSize: 14,
    },
    tabContainer: {
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.brandLight,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabScrollContent: {
        flexDirection: 'row',
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: colors.brandBlue,
    },
    tabIcon: {
        marginRight: spacing.xs,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.brandDark,
    },
    activeTabText: {
        color: colors.brandBlue,
        fontWeight: '600',
    },
    statsContainer: {
        flex: 1,
        backgroundColor: colors.white,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.brandLight,
        backgroundColor: colors.brandLight,
    },
    headerCell: {
        flex: 1,
        fontWeight: '600',
        textAlign: 'center',
        color: colors.brandBlue,
        fontSize: 15,
    },
    nameCell: {
        flex: 3,
        textAlign: 'left',
        paddingLeft: spacing.md,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.brandLight,
    },
    cell: {
        flex: 1,
        textAlign: 'center',
        color: colors.brandDark,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
    },
    loadingText: {
        color: colors.brandBlue,
        marginTop: spacing.md,
        fontSize: 16,
    },
    emptyStats: {
        padding: spacing.xxl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyIcon: {
        marginBottom: spacing.md,
    },
    emptyText: {
        fontSize: 16,
        color: colors.ccc,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    insightsContainer: {
        padding: spacing.md,
    },
    insightCard: {
        marginBottom: spacing.md,
        padding: spacing.md,
        backgroundColor: colors.white,
        borderRadius: radius.md,
        shadowColor: colors.black,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    insightTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: spacing.sm,
        color: colors.brandDark,
    },
    leaderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    leaderLabel: {
        fontWeight: '600',
        color: colors.brandDark,
    },
    leaderValue: {
        color: colors.brandBlue,
        fontWeight: '500',
    },
    insightText: {
        marginBottom: spacing.xs,
        color: colors.brandDark,
    },
    insightTabs: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    insightTab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.md,
        backgroundColor: colors.brandLight,
        borderRadius: radius.md,
        marginHorizontal: spacing.xs,
    },
    activeInsightTab: {
        backgroundColor: colors.brandBlue + '15',
    },
    insightTabText: {
        color: colors.brandDark,
        fontWeight: '500',
    },
    activeInsightTabText: {
        color: colors.brandBlue,
        fontWeight: '600',
    },
    insightSubheading: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
        color: colors.brandDark,
    },
    playerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.brandLight,
    },
    playerItemNumber: {
        width: 24,
        fontSize: 14,
        fontWeight: '600',
        color: colors.brandDark,
    },
    playerItemName: {
        flex: 1,
        fontSize: 15,
        color: colors.brandDark,
    },
    playerItemRole: {
        fontSize: 13,
        color: colors.brandBlue,
        fontWeight: '500',
    },
    insufficientDataText: {
        fontStyle: 'italic',
        fontSize: 13,
        color: colors.orange,
        marginVertical: spacing.sm,
    },
});