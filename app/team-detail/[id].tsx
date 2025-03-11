import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Team, SavedMatch, Cricketer } from '@/types';
import { getSavedMatches } from '@/utils/matchStorage';

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
    const [teamMatches, setTeamMatches] = useState<SavedMatch[]>([]);  // Add this state variable
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'batting' | 'bowling' | 'fielding' | 'insights'>('batting');

    useEffect(() => {
        loadTeamAndStats();
    }, [id]);

    const loadTeamAndStats = async () => {
        setLoading(true);
        try {
            // Load all matches
            const savedMatches = await getSavedMatches();
            if (!savedMatches) {
                setLoading(false);
                return;
            }

            // Find team in saved matches
            const foundTeam = savedMatches.reduce((found: Team | null, match: SavedMatch) => {
                if (match.teamA.id === id) return match.teamA;
                if (match.teamB.id === id) return match.teamB;
                return found;
            }, null);

            if (foundTeam) {
                setTeam(foundTeam);

                // Filter matches involving this team
                const matches = savedMatches.filter(match =>
                    match.teamA.id === id || match.teamB.id === id
                );
                
                // Store team matches for insights
                setTeamMatches(matches);

                // Calculate player statistics
                const stats = calculatePlayerStats(foundTeam, matches);
                setPlayerStats(stats);
            }
        } catch (error) {
            console.error('Error loading team details:', error);
        } finally {
            setLoading(false);
        }
    };

    // Update calculatePlayerStats to accept matches as a parameter
    const calculatePlayerStats = (team: Team, matches: SavedMatch[]): PlayerStats[] => {
        try {
            // Filter matches involving this team
            const teamMatches = matches.filter(match =>
                match.teamA.id === team.id || match.teamB.id === team.id
            );

            // Initialize stats objects for all players
            const playerStatsMap = new Map<string, PlayerStats>();

            // Initialize player stats objects for all team players
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

            // Process each match to update player stats
            teamMatches.forEach(match => {
                // Process each innings to update both batting and bowling stats
                [match.innings1, match.innings2].forEach(innings => {
                    // Get the team's view of the innings (batting or bowling)
                    const isBattingTeam = innings.battingTeamId === team.id;
                    const teamInMatch = isBattingTeam
                        ? (match.teamA.id === team.id ? match.teamA : match.teamB)
                        : (match.teamA.id === team.id ? match.teamA : match.teamB);

                    // Update batting stats if this team was batting
                    if (isBattingTeam) {
                        // Find players who batted
                        const battedPlayerIds = new Set<string>();
                        
                        // First, identify all batters in this innings
                        innings.deliveries.forEach(delivery => {
                            if (delivery.strikerId) {
                                battedPlayerIds.add(delivery.strikerId);
                            }
                            if (delivery.nonStrikerId) {
                                battedPlayerIds.add(delivery.nonStrikerId);
                            }
                        });
                        
                        // Process each batter's stats
                        battedPlayerIds.forEach(batsmanId => {
                            if (playerStatsMap.has(batsmanId)) {
                                const playerStats = playerStatsMap.get(batsmanId)!;
                                
                                // Find the batsman in this match
                                const batsmanInMatch = teamInMatch.players.find(p => p.id === batsmanId);
                                
                                if (batsmanInMatch) {
                                    // Increment innings count and matches
                                    playerStats.battingStats.innings++;
                                    playerStats.matches++;
                                    
                                    // Get runs, balls faced, and boundary counts from the player in this match
                                    const runsScored = batsmanInMatch.runs || 0;
                                    const ballsFaced = batsmanInMatch.balls || 0;
                                    const foursHit = batsmanInMatch.fours || 0;
                                    const sixesHit = batsmanInMatch.sixes || 0;
                                    
                                    // Update player stats
                                    playerStats.battingStats.runs += runsScored;
                                    playerStats.battingStats.balls += ballsFaced;
                                    playerStats.battingStats.fours += foursHit;
                                    playerStats.battingStats.sixes += sixesHit;
                                    
                                    // Update high score if applicable
                                    if (runsScored > playerStats.battingStats.highScore) {
                                        playerStats.battingStats.highScore = runsScored;
                                    }
                                    
                                    // Update hundreds and fifties
                                    if (runsScored >= 100) {
                                        playerStats.battingStats.hundreds++;
                                    } else if (runsScored >= 50) {
                                        playerStats.battingStats.fifties++;
                                    }
                                    
                                    playerStatsMap.set(batsmanId, playerStats);
                                }
                            }
                        });
                    }
                    // Update bowling stats if this team was bowling
                    else {
                        // Find players who bowled
                        const bowlerIds = new Set<string>();

                        // Track wickets per bowler for this innings
                        const bowlerWickets = new Map<string, number>();
                        const bowlerRuns = new Map<string, number>();

                        // Track legal deliveries per bowler
                        const bowlerLegalDeliveries = new Map<string, number>();

                        innings.deliveries.forEach(delivery => {
                            if (delivery.bowlerId && playerStatsMap.has(delivery.bowlerId)) {
                                const playerStats = playerStatsMap.get(delivery.bowlerId)!;

                                // Count innings once per bowler
                                if (!bowlerIds.has(delivery.bowlerId)) {
                                    bowlerIds.add(delivery.bowlerId);
                                    playerStats.bowlingStats.innings++;
                                    playerStats.matches++;
                                }

                                // Add runs conceded
                                playerStats.bowlingStats.runsConceded += (delivery.totalRuns || delivery.runs || 0);

                                // Track legal deliveries for this bowler
                                if (!delivery.extraType || (delivery.extraType !== 'wide' && delivery.extraType !== 'no-ball')) {
                                    const currentDeliveries = bowlerLegalDeliveries.get(delivery.bowlerId) || 0;
                                    bowlerLegalDeliveries.set(delivery.bowlerId, currentDeliveries + 1);
                                }

                                // Add wicket if applicable
                                if (delivery.wicket && ['bowled', 'caught', 'lbw', 'stumped'].includes(delivery.wicketType || '')) {
                                    playerStats.bowlingStats.wickets++;

                                    // Track wickets this innings
                                    const currentWickets = bowlerWickets.get(delivery.bowlerId) || 0;
                                    bowlerWickets.set(delivery.bowlerId, currentWickets + 1);

                                    // Track runs conceded this innings
                                    const currentRuns = bowlerRuns.get(delivery.bowlerId) || 0;
                                    bowlerRuns.set(delivery.bowlerId, currentRuns + (delivery.runs || 0));
                                }

                                playerStatsMap.set(delivery.bowlerId, playerStats);
                            }

                            // Handle fielding stats
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

                        // Calculate overs correctly after processing all deliveries
                        bowlerIds.forEach(bowlerId => {
                            if (playerStatsMap.has(bowlerId)) {
                                const playerStats = playerStatsMap.get(bowlerId)!;
                                const legalDeliveries = bowlerLegalDeliveries.get(bowlerId) || 0;

                                // Calculate overs in cricket notation (overs.balls)
                                const completeOvers = Math.floor(legalDeliveries / 6);
                                const remainingBalls = legalDeliveries % 6;

                                // Set overs in the format that cricket uses: overs.balls
                                playerStats.bowlingStats.overs = completeOvers + (remainingBalls / 10); // Use /10 to get proper decimal display (0.1, 0.2, etc)

                                playerStatsMap.set(bowlerId, playerStats);
                            }
                        });

                        // Update best bowling figures
                        bowlerIds.forEach(bowlerId => {
                            const wickets = bowlerWickets.get(bowlerId) || 0;
                            const runs = bowlerRuns.get(bowlerId) || 0;

                            if (playerStatsMap.has(bowlerId)) {
                                const playerStats = playerStatsMap.get(bowlerId)!;

                                // Parse current best bowling
                                const [bestWickets, bestRuns] = playerStats.bowlingStats.bestBowling.split('/').map(n => parseInt(n) || 0);

                                // Check if this innings is better (more wickets, or same wickets with fewer runs)
                                if (
                                    wickets > bestWickets ||
                                    (wickets === bestWickets && runs < bestRuns)
                                ) {
                                    playerStats.bowlingStats.bestBowling = `${wickets}/${runs}`;
                                }

                                // Count five wicket hauls
                                if (wickets >= 5) {
                                    playerStats.bowlingStats.fiveWickets++;
                                }

                                playerStatsMap.set(bowlerId, playerStats);
                            }
                        });
                    }
                });
            });

            // Calculate averages and rates
            playerStatsMap.forEach((stats, id) => {
                // Batting strike rate = (runs / balls) * 100
                if (stats.battingStats.balls > 0) {
                    stats.battingStats.strikeRate = +(stats.battingStats.runs / stats.battingStats.balls * 100).toFixed(2);
                }

                // Batting average = runs / dismissals
                if (stats.battingStats.innings > 0) {
                    // This is an approximation as we don't track not-outs properly
                    stats.battingStats.average = +(stats.battingStats.runs / stats.battingStats.innings).toFixed(2);
                }

                // Bowling economy = runs conceded / overs
                if (stats.bowlingStats.overs > 0) {
                    stats.bowlingStats.economy = +(stats.bowlingStats.runsConceded / stats.bowlingStats.overs).toFixed(2);
                }

                // Bowling average = runs conceded / wickets
                if (stats.bowlingStats.wickets > 0) {
                    stats.bowlingStats.average = +(stats.bowlingStats.runsConceded / stats.bowlingStats.wickets).toFixed(2);
                }

                playerStatsMap.set(id, stats);
            });

            // Convert map to array and return
            return Array.from(playerStatsMap.values());
        } catch (error) {
            console.error('Error calculating player stats:', error);
            return [];
        }
    };

    // Render player stats based on active tab
    const renderPlayerStats = () => {
        if (loading) {
            return <ActivityIndicator size="large" color="#1B5E20" />;
        }

        if (activeTab === 'batting') {
            // Filter out players with no innings played for better display
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
                            <Text style={styles.emptyText}>No batting statistics available</Text>
                        </View>
                    }
                />
            );
        }

        if (activeTab === 'bowling') {
            // Filter out players who haven't bowled for better display
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
                        // Format overs correctly for display (overs.balls)
                        const oversFormat = () => {
                            const completeOvers = Math.floor(item.bowlingStats.overs);
                            const balls = Math.round((item.bowlingStats.overs - completeOvers) * 10); // Convert decimal to balls
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
                            <Text style={styles.emptyText}>No bowling statistics available</Text>
                        </View>
                    }
                />
            );
        }

        if (activeTab === 'fielding') {
            // Filter players who have at least caught or run out
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
        <View style={styles.container}>
            {/* Team header */}
            {team && (
                <View style={styles.teamHeader}>
                    <Text style={styles.teamName}>{team.teamName}</Text>
                    <Text style={styles.playerCount}>{team.players.length} Players</Text>
                </View>
            )}

            {/* Tab selector */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'batting' && styles.activeTab]}
                    onPress={() => setActiveTab('batting')}
                >
                    <Text style={[styles.tabText, activeTab === 'batting' && styles.activeTabText]}>
                        Batting
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'bowling' && styles.activeTab]}
                    onPress={() => setActiveTab('bowling')}
                >
                    <Text style={[styles.tabText, activeTab === 'bowling' && styles.activeTabText]}>
                        Bowling
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'fielding' && styles.activeTab]}
                    onPress={() => setActiveTab('fielding')}
                >
                    <Text style={[styles.tabText, activeTab === 'fielding' && styles.activeTabText]}>
                        Fielding
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'insights' && styles.activeTab]}
                    onPress={() => setActiveTab('insights')}
                >
                    <Text style={[styles.tabText, activeTab === 'insights' && styles.activeTabText]}>
                        Insights
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Stats tables */}
            <View style={styles.statsContainer}>
                {renderPlayerStats()}
            </View>
        </View>
    );
}

// Add these functions before the TeamInsights component

// Calculate team's performance at different batting positions
const calculatePositionalStrength = (matches: SavedMatch[], teamId: string) => {
    // Initialize position stats
    const positionStats: { [key: number]: { runs: number, balls: number } } = {};

    // Initialize positions 1-7
    for (let i = 1; i <= 7; i++) {
        positionStats[i] = { runs: 0, balls: 0 };
    }

    matches.forEach(match => {
        // Process both innings
        [match.innings1, match.innings2].forEach(innings => {
            // Only analyze when this team was batting
            if (innings.battingTeamId === teamId) {
                // Get batting positions based on the order players batted
                const battingOrder = new Map<string, number>();
                let position = 1;

                // Go through the deliveries and assign positions
                innings.deliveries.forEach(delivery => {
                    if (delivery.strikerId && !battingOrder.has(delivery.strikerId)) {
                        battingOrder.set(delivery.strikerId, position);
                        position++;
                    }

                    // Track runs and balls faced
                    if (delivery.strikerId) {
                        const pos = battingOrder.get(delivery.strikerId) || 0;
                        if (pos <= 7) { // Only track positions 1-7
                            positionStats[pos].runs += delivery.runs || 0;
                            positionStats[pos].balls += 1;
                        }
                    }
                });
            }
        });
    });

    // Calculate strike rates for each position
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

    // Sort positions by strike rate
    positionPerformance.sort((a, b) => b.strikeRate - a.strikeRate);

    // Define strong and weak positions (need minimum 20 balls to be considered)
    const strongPositions = positionPerformance
        .filter(pos => pos.balls >= 20 && pos.strikeRate > 120)
        .map(pos => pos.position);

    const weakPositions = positionPerformance
        .filter(pos => pos.balls >= 20 && pos.strikeRate < 100)
        .map(pos => pos.position);

    return { strongPositions, weakPositions, positionPerformance };
};

// Calculate powerplay performance (overs 1-6)
const calculatePowerPlayPerformance = (matches: SavedMatch[], teamId: string) => {
    let totalPowerplayRuns = 0;
    let totalPowerplayBalls = 0;
    let totalPowerplayWickets = 0;

    matches.forEach(match => {
        [match.innings1, match.innings2].forEach(innings => {
            // Only analyze when this team was batting
            if (innings.battingTeamId === teamId) {
                // Filter deliveries in first 6 overs
                const powerplayDeliveries = innings.deliveries.filter(delivery => {
                    const overNumber = Math.floor(innings.deliveries.indexOf(delivery) / 6) + 1;
                    return overNumber <= 6;
                });

                // Calculate stats
                powerplayDeliveries.forEach(delivery => {
                    totalPowerplayRuns += delivery.runs || 0;
                    totalPowerplayBalls++;
                    if (delivery.wicket) totalPowerplayWickets++;
                });
            }
        });
    });

    // Calculate powerplay strike rate
    const powerplayStrikeRate = totalPowerplayBalls > 0 ?
        (totalPowerplayRuns / totalPowerplayBalls) * 100 : 0;

    // Calculate wicket rate
    const wicketRate = totalPowerplayBalls > 0 ?
        (totalPowerplayWickets / totalPowerplayBalls) * 100 : 0;

    // Consider batting strong if strike rate is over 120 and wicket rate is under 4%
    const isBattingStrong = powerplayStrikeRate > 120 && wicketRate < 4;

    return {
        isBattingStrong,
        powerplayStrikeRate,
        wicketRate,
        totalPowerplayRuns,
        totalPowerplayWickets
    };
};

// Calculate death overs performance (last 4 overs)
const calculateDeathOversPerformance = (matches: SavedMatch[], teamId: string) => {
    let totalDeathRunsConceded = 0;
    let totalDeathBalls = 0;
    let totalDeathWickets = 0;

    matches.forEach(match => {
        [match.innings1, match.innings2].forEach(innings => {
            // Only analyze when this team was bowling
            if (innings.bowlingTeamId === teamId) {
                const totalOvers = innings.completedOvers + (innings.ballInCurrentOver > 0 ? 1 : 0);

                // If the innings wasn't long enough, skip
                if (totalOvers < 4) return;

                // Define death overs (last 4 overs)
                const deathOversStart = (totalOvers - 4) * 6;

                // Filter deliveries in death overs
                const deathDeliveries = innings.deliveries.slice(deathOversStart);

                // Calculate stats
                deathDeliveries.forEach(delivery => {
                    totalDeathRunsConceded += delivery.runs || 0;
                    totalDeathBalls++;
                    if (delivery.wicket && delivery.bowlerId) totalDeathWickets++;
                });
            }
        });
    });

    // Calculate death overs economy
    const deathEconomy = totalDeathBalls > 0 ?
        (totalDeathRunsConceded / totalDeathBalls) * 6 : 0;

    // Calculate wicket rate
    const wicketRate = totalDeathBalls > 0 ?
        (totalDeathWickets / totalDeathBalls) * 100 : 0;

    // Consider bowling strong if economy is under 8.5 and wicket rate is over 5%
    const isBowlingStrong = deathEconomy < 8.5 && wicketRate > 5;

    return {
        isBowlingStrong,
        deathEconomy,
        wicketRate,
        totalDeathRunsConceded,
        totalDeathWickets
    };
};

// Add this function to TeamDetailScreen

const calculateBestEleven = (playerStats: PlayerStats[]): PlayerStats[] => {
    // Clone the array to avoid modifying the original
    const stats = [...playerStats];

    // Sort batters by batting average
    const bestBatters = stats
        .filter(player => player.battingStats.innings >= 2)
        .sort((a, b) => b.battingStats.average - a.battingStats.average)
        .slice(0, 6); // Take top 6 batters

    // Sort bowlers by bowling average (lower is better)
    const bestBowlers = stats
        .filter(player => player.bowlingStats.overs >= 2)
        .sort((a, b) => {
            // Handle Infinity for players with no wickets
            if (a.bowlingStats.average === 0) return 1;
            if (b.bowlingStats.average === 0) return -1;
            return a.bowlingStats.average - b.bowlingStats.average;
        })
        .slice(0, 5); // Take top 5 bowlers

    // Combine best batters and bowlers, remove duplicates
    const bestPlayerIds = new Set();
    const bestEleven: PlayerStats[] = [];

    // Add batters first
    bestBatters.forEach(player => {
        if (!bestPlayerIds.has(player.id)) {
            bestPlayerIds.add(player.id);
            bestEleven.push(player);
        }
    });

    // Then add bowlers
    bestBowlers.forEach(player => {
        if (!bestPlayerIds.has(player.id)) {
            bestPlayerIds.add(player.id);
            bestEleven.push(player);
        }
    });

    // If we still have less than 11 players, add the rest based on overall contribution
    if (bestEleven.length < 11) {
        stats
            .filter(player => !bestPlayerIds.has(player.id))
            .sort((a, b) => {
                // Calculate an overall value metric
                const aValue = a.battingStats.average + a.fieldingStats.catches + a.bowlingStats.wickets * 2;
                const bValue = b.battingStats.average + b.fieldingStats.catches + b.bowlingStats.wickets * 2;
                return bValue - aValue;
            })
            .slice(0, 11 - bestEleven.length)
            .forEach(player => bestEleven.push(player));
    }

    return bestEleven;
};

// Modify the TeamInsights component to include Best XI

const TeamInsights = ({ team, playerStats, matches }) => {
    // Calculate various insights
    const topRunScorer = playerStats.reduce((prev, current) =>
        prev.battingStats.runs > current.battingStats.runs ? prev : current, playerStats[0]);

    const topWicketTaker = playerStats.reduce((prev, current) =>
        prev.bowlingStats.wickets > current.bowlingStats.wickets ? prev : current, playerStats[0]);

    const bestBattingAvg = playerStats.reduce((prev, current) =>
        prev.battingStats.average > current.battingStats.average ? prev : current, playerStats[0]);

    const bestEconomy = playerStats.reduce((prev, current) =>
        (current.bowlingStats.overs > 0 && prev.bowlingStats.economy > current.bowlingStats.economy) ? current : prev, playerStats[0]);

    // Calculate team strengths and weaknesses
    const battingPositionStrength = calculatePositionalStrength(matches, team.id);
    const powerPlayPerformance = calculatePowerPlayPerformance(matches, team.id);
    const deathOversPerformance = calculateDeathOversPerformance(matches, team.id);

    // Calculate best XI
    const bestEleven = calculateBestEleven(playerStats);

    // Separate best eleven into batters, all-rounders, and bowlers
    const batters = bestEleven.filter(p =>
        p.battingStats.average > 20 && p.bowlingStats.wickets < 3);

    const allRounders = bestEleven.filter(p =>
        p.battingStats.runs >= 30 && p.bowlingStats.wickets >= 3);

    const bowlers = bestEleven.filter(p =>
        p.battingStats.average < 20 && p.bowlingStats.wickets >= 3);

    const [showingTab, setShowingTab] = useState('insights'); // 'insights' or 'bestXI'

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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    teamHeader: {
        padding: 16,
        backgroundColor: '#1B5E20',
        alignItems: 'center',
    },
    teamName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    playerCount: {
        fontSize: 16,
        color: '#FFF',
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    tab: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#1B5E20',
    },
    tabText: {
        fontSize: 16,
        color: '#666',
    },
    activeTabText: {
        fontWeight: 'bold',
        color: '#1B5E20',
    },
    statsContainer: {
        flex: 1,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#F5F5F5',
    },
    headerCell: {
        flex: 1,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    nameCell: {
        flex: 3,
        textAlign: 'left',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    cell: {
        flex: 1,
        textAlign: 'center',
    },
    insightsContainer: {
        padding: 16,
    },
    insightCard: {
        marginBottom: 16,
        padding: 16,
        backgroundColor: '#FFF',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    insightTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    leaderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    leaderLabel: {
        fontWeight: 'bold',
    },
    leaderValue: {
        color: '#1B5E20',
    },
    insightText: {
        marginBottom: 4,
    },

    insightTabs: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    insightTab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        marginHorizontal: 4,
    },
    activeInsightTab: {
        backgroundColor: '#E8F5E9',
    },
    insightTabText: {
        color: '#666',
        fontWeight: '500',
    },
    activeInsightTabText: {
        color: '#1B5E20',
        fontWeight: 'bold',
    },
    insightSubheading: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 4,
        color: '#555',
    },
    playerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    playerItemNumber: {
        width: 24,
        fontSize: 14,
        fontWeight: 'bold',
    },
    playerItemName: {
        flex: 1,
        fontSize: 15,
    },
    playerItemRole: {
        fontSize: 13,
        color: '#1B5E20',
        fontWeight: '500',
    },
    insufficientDataText: {
        fontStyle: 'italic',
        fontSize: 13,
        color: '#F57C00',
        marginVertical: 8,
    },
    emptyStats: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        fontStyle: 'italic',
    },
});