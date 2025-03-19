import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Text, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { RootState } from '@/store';

import {
    selectCurrentInnings,
    selectBattingTeam,
    selectBowlingTeam,
} from '@/store/cricket/selectors';
import {
    scoreBall,
    undoLastBall,
    swapBatsmen,
    setBowler
} from '@/store/cricket/scoreboardSlice';

// Hooks
import { useLoadMatch } from '@/hooks/useLoadMatch';
import { useScoringState } from '@/hooks/useScoringState';
import { useInningsStatus } from '@/hooks/useInningsStatus';

// UI + Components
import ScoreHeader from '@/components/scoring/ScoreHeader';
import BatsmenDisplay from '@/components/scoring/BatsmenDisplay';
import BowlerDisplay from '@/components/scoring/BowlerDisplay';
import ExtrasToggle from '@/components/scoring/ExtrasToggle';
import ScoringButtons from '@/components/scoring/ScoringButtons';
import ActionButtons from '@/components/scoring/ActionButtons';
import WicketToggle from '@/components/scoring/WicketToggle';
import OverRowDisplay from '@/components/scoring/OverRowDisplay';
import ScorecardTab from '@/components/scoring/ScorecardTab';
import { ScoreModals } from '@/components/scoring/ScoreModals';
import { colors, spacing, typography } from '@/constants/theme';

const SHOWN_MATCH_ALERTS = new Set<string>();

export default function ScoringScreen() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { matchId, activeTab: tabParam } = useLocalSearchParams();

    // 1) Load match data
    useLoadMatch(matchId as string);

    // 2) Grab scoreboard state and selectors
    const state = useSelector((s: RootState) => s.scoreboard);
    const currentInnings = useSelector(selectCurrentInnings);
    const battingTeam = useSelector(selectBattingTeam);
    const bowlingTeam = useSelector(selectBowlingTeam);

    // 3) Manage local scoring state with custom hook
    const { scoringState, setScoringState, resetExtras, resetAll } = useScoringState();
    const { wide, noBall, bye, legBye, wicket, tempRuns } = scoringState;

    // 4) Local modals state
    const [showPartnershipModal, setShowPartnershipModal] = useState(false);
    const [showExtrasModal, setShowExtrasModal] = useState(false);
    const [showAdvancedModal, setShowAdvancedModal] = useState(false);
    const [showBowlerModal, setShowBowlerModal] = useState(false);
    const [showWicketModal, setShowWicketModal] = useState(false);
    const [showEndInningsModal, setShowEndInningsModal] = useState(false);

    // 5) Manage tabs
    const activeTabRef = useRef<'live' | 'scorecard'>(
        tabParam === 'scorecard' ? 'scorecard' : 'live'
    );
    const [activeTab, setActiveTab] = useState<'live' | 'scorecard'>(activeTabRef.current);

    const setActiveTabPersistent = (tab: 'live' | 'scorecard') => {
        activeTabRef.current = tab;
        setActiveTab(tab);
    };

    // 6) Use the innings status logic in a custom hook
    useInningsStatus({
        state,
        currentInnings,
        battingTeam,
        showEndInningsModal,
        setShowEndInningsModal,
        debugInningsStatus: () => {
            console.log('DEBUG: ', {
                matchOver: state.matchOver,
                currentInning: state.currentInning,
                isCompleted: currentInnings?.isCompleted,
                readyForInnings2: currentInnings?.readyForInnings2,
                wickets: currentInnings?.wickets,
                completedOvers: currentInnings?.completedOvers
            });
        }
    });
    
    // 6.5) Show NextBowlerModal automatically when a new over starts
    useEffect(() => {
        // If we just finished an over:
        //   ballInCurrentOver = 0
        //   completedOvers > 0
        // and the innings/match isn't over
        if (
            currentInnings?.ballInCurrentOver === 0 &&
            (currentInnings?.completedOvers || 0) > 0 &&
            !currentInnings?.readyForInnings2 &&
            !currentInnings?.isCompleted &&
            !state.matchOver
        ) {
            setShowBowlerModal(true);
        }
    }, [
        currentInnings?.ballInCurrentOver,
        currentInnings?.completedOvers,
        currentInnings?.readyForInnings2,
        currentInnings?.isCompleted,
        state.matchOver
    ]);

    // 7) Scoring handler
    const canScore = !!(currentInnings?.currentStrikerId && currentInnings.currentBowlerId);
    const handleScore = (runs: number) => {
        if (state.matchOver) {
            Alert.alert('Match Completed', 'The match is already over.');
            return;
        }
        if (!canScore) {
            setShowBowlerModal(true);
            return;
        }

        // If a wicket toggle is ON, show the wicket modal with these runs
        if (wicket) {
            setScoringState(prev => ({ ...prev, tempRuns: runs }));
            setShowWicketModal(true);
        } else if (wide || noBall || bye || legBye) {
            dispatch(
                scoreBall({
                    runs,
                    extraType: wide
                        ? 'wide'
                        : noBall
                            ? 'no-ball'
                            : bye
                                ? 'bye'
                                : 'leg-bye'
                })
            );
            resetExtras(); // only reset extras
        } else {
            // Normal run scoring
            dispatch(scoreBall({ runs }));
        }
        // Clear the wicket toggle
        setScoringState(prev => ({ ...prev, wicket: false }));
    };

    // 8) Wicket confirm
    const handleWicketConfirm = (wkData: {
        wicketType: string;
        outBatsmanId: string;
        fielderId?: string;
        fielderName?: string;
        nextBatsmanId: string;
    }) => {
        if (state.matchOver) {
            setShowWicketModal(false);
            Alert.alert('Match Completed', 'The match is already over.');
            return;
        }
        setShowWicketModal(false);

        dispatch(
            scoreBall({
                runs: tempRuns,
                wicket: true,
                wicketType: wkData.wicketType,
                outBatsmanId: wkData.outBatsmanId,
                nextBatsmanId: wkData.nextBatsmanId,
                fielderId: wkData.fielderId,
                fielderName: wkData.fielderName
            })
        );
    };

    // 9) End innings confirm
    const handleEndInningsConfirm = () => {
        setShowEndInningsModal(false);
        setTimeout(() => {
            router.push('/openingPlayers?innings=2');
        }, 150);
    };

    // 10) Provide user a match-completed alert
    useEffect(() => {
        if (!state.matchOver || !state.matchResult) return;
        const alertKey = `match-${state.id}-completed`;
        if (SHOWN_MATCH_ALERTS.has(alertKey)) return;
        SHOWN_MATCH_ALERTS.add(alertKey);

        Alert.alert('Match Completed', state.matchResult, [
            {
                text: 'View Scorecard',
                onPress: () => setActiveTabPersistent('scorecard')
            }
        ]);
    }, [state.matchOver, state.matchResult]);


    return (
        <ScrollView style={styles.safeArea}>
            <ScoreHeader
                battingTeam={battingTeam}
                currentInnings={currentInnings}
                currentInning={state.currentInning}
                targetScore={state.targetScore}
                matchResult={state.matchResult}
            />

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === 'live' && styles.activeTabButton
                    ]}
                    onPress={() => setActiveTabPersistent('live')}
                    activeOpacity={0.7}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === 'live' && styles.activeTabText
                    ]}>
                        Live
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === 'scorecard' && styles.activeTabButton
                    ]}
                    onPress={() => setActiveTabPersistent('scorecard')}
                    activeOpacity={0.7}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === 'scorecard' && styles.activeTabText
                    ]}>
                        Scorecard
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Live tab - Ball by ball */}
            {activeTab === 'live' && (
                <View style={styles.container}>
                    <BatsmenDisplay battingTeam={battingTeam} currentInnings={currentInnings} />
                    <BowlerDisplay bowlingTeam={bowlingTeam} currentInnings={currentInnings} />

                    <OverRowDisplay />

                    <ExtrasToggle
                        wide={wide}
                        noBall={noBall}
                        bye={bye}
                        legBye={legBye}
                        setWide={(v) => setScoringState(prev => ({ ...prev, wide: v }))}
                        setNoBall={(v) => setScoringState(prev => ({ ...prev, noBall: v }))}
                        setBye={(v) => setScoringState(prev => ({ ...prev, bye: v }))}
                        setLegBye={(v) => setScoringState(prev => ({ ...prev, legBye: v }))}
                    />

                    <WicketToggle
                        wicket={wicket}
                        setWicket={(v) => setScoringState(prev => ({ ...prev, wicket: v }))}
                        disabled={!canScore}
                    />

                    <ScoringButtons onScore={handleScore} canScore={canScore} />

                    <ActionButtons
                        onUndo={() => dispatch(undoLastBall())}
                        onSwap={() => dispatch(swapBatsmen())}
                        onPartnership={() => setShowPartnershipModal(true)}
                        onExtras={() => setShowExtrasModal(true)}
                        onAdvancedScore={() => setShowAdvancedModal(true)}
                    />
                </View>
            )}

            {/* Scorecard tab - Detailed stats */}
            {activeTab === 'scorecard' && (
                <ScorecardTab
                    battingTeam={battingTeam}
                    bowlingTeam={bowlingTeam}
                    currentInnings={currentInnings}
                    currentInning={state.currentInning}
                    targetScore={state.targetScore}
                    matchResult={state.matchResult}
                    state={state}
                />
            )}

            {/* Our new consolidated modals */}
            <ScoreModals
                showPartnershipModal={showPartnershipModal}
                setShowPartnershipModal={setShowPartnershipModal}
                showExtrasModal={showExtrasModal}
                setShowExtrasModal={setShowExtrasModal}
                showAdvancedModal={showAdvancedModal}
                setShowAdvancedModal={setShowAdvancedModal}
                showBowlerModal={showBowlerModal}
                setShowBowlerModal={setShowBowlerModal}
                bowlingTeam={bowlingTeam}
                currentBowlerId={currentInnings?.currentBowlerId}
                lastOverBowlerId={currentInnings?.lastOverBowlerId}
                onSelectBowler={(bowlerId) => {
                    dispatch(setBowler({
                        team: bowlingTeam.id === state.teamA.id ? 'teamA' : 'teamB',
                        bowlerId
                    }));
                    setShowBowlerModal(false);
                }}
                showWicketModal={showWicketModal}
                setShowWicketModal={setShowWicketModal}
                handleWicketConfirm={handleWicketConfirm}
                battingTeam={battingTeam}
                currentStrikerId={currentInnings?.currentStrikerId || ''}
                currentNonStrikerId={currentInnings?.currentNonStrikerId || ''}
                battingTeamKey={battingTeam.id === state.teamA.id ? 'teamA' : 'teamB'}
                showEndInningsModal={showEndInningsModal}
                setShowEndInningsModal={setShowEndInningsModal}
                handleEndInningsConfirm={handleEndInningsConfirm}
                currentInnings={currentInnings}
            />

            <TouchableOpacity
                style={styles.debugButton}
                onPress={() => {
                    // Debug info
                    console.log('DEBUG CURRENT STATE:', {
                        completedOvers: currentInnings?.completedOvers,
                        ballInCurrentOver: currentInnings?.ballInCurrentOver,
                        inningsStriker: currentInnings?.currentStrikerId,
                        inningsNonStriker: currentInnings?.currentNonStrikerId
                    });
                }}
            >
                <Text style={styles.debugButtonText}>Debug</Text>
            </TouchableOpacity>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.white
    },
    container: {
        padding: spacing.md,
    },
    // New styles for tabs
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        elevation: 4, // Increased for Android
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 }, // More pronounced shadow
        shadowOpacity: 0.2, // More visible shadow
        shadowRadius: 3,
        borderBottomWidth: 1,
        borderBottomColor: colors.brandLight// '#e0e0e0',
    },
    tabButton: {
        flex: 1,
        paddingVertical: spacing.lg, // Larger tap targets
        alignItems: 'center',
        borderBottomWidth: 3, // More noticeable indicator
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        borderBottomColor: colors.brandBlue,
    },
    tabText: {
        fontSize: typography.sizeMD,
        fontWeight: '500',
        color: colors.brandDark,
    },
    activeTabText: {
        color: colors.brandBlue,
        fontWeight: '600',
    },
    debugButton: {
        backgroundColor: colors.brandBlue,
        padding: spacing.md,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    debugButtonText: {
        color: colors.white,
        fontSize: typography.sizeMD,
        fontWeight: '600',
    },
});