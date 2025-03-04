import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, TouchableOpacity, Text, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { RootState } from '@/store';
import {
    selectCurrentInnings,
    selectBattingTeam,
    selectBowlingTeam,
} from '@/store/cricket/selectors';

// Import components
import ScoreHeader from '@/components/scoring/ScoreHeader';
import BatsmenDisplay from '@/components/scoring/BatsmenDisplay';
import BowlerDisplay from '@/components/scoring/BowlerDisplay';
import ExtrasToggle from '@/components/scoring/ExtrasToggle';
import ScoringButtons from '@/components/scoring/ScoringButtons';
import ActionButtons from '@/components/scoring/ActionButtons';
import WicketToggle from '@/components/scoring/WicketToggle';
import OverRowDisplay from '@/components/scoring/OverRowDisplay';

// Import modals
import PartnershipModal from '@/components/scoring/modals/PartnershipModal';
import ExtrasModal from '@/components/scoring/modals/ExtrasModal';
import AdvancedScoringModal from '@/components/scoring/modals/AdvancedScoringModal';
import NextBowlerModal from '@/components/scoring/modals/NextBowlerModal';
import WicketModal from '@/components/scoring/modals/WicketModal';
import EndInningsModal from '@/components/scoring/modals/EndInningsModal';

// Import actions
import {
    scoreBall,
    undoLastBall,
    swapBatsmen,
    setBowler,
    endInnings,
    addExtraRuns,
    setCurrentStriker,
    setCurrentNonStriker
} from '@/store/cricket/scoreboardSlice';

// Import useLocalStorage from Expo at the top of your file
import * as SecureStore from 'expo-secure-store';

// Add import
import { showAlertOnce } from '@/utils/onceAlert';

// At the top of your file, OUTSIDE of your component
// This will persist across component remounts
const SHOWN_MATCH_ALERTS = new Set<string>();

export default function ScoringScreen() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { matchId } = useLocalSearchParams();
    const state = useSelector((state: RootState) => state.scoreboard);

    // Selectors
    const currentInnings = useSelector(selectCurrentInnings);
    const battingTeam = useSelector(selectBattingTeam);
    const bowlingTeam = useSelector(selectBowlingTeam);
    const currentInning = useSelector((state: RootState) => state.scoreboard.currentInning);
    const targetScore = useSelector((state: RootState) => state.scoreboard.targetScore);

    // Local state for scoring
    const [wide, setWide] = useState(false);
    const [noBall, setNoBall] = useState(false);
    const [bye, setBye] = useState(false);
    const [legBye, setLegBye] = useState(false);
    const [wicket, setWicket] = useState(false);
    const [tempRuns, setTempRuns] = useState(0);

    // Modal states
    const [showPartnershipModal, setShowPartnershipModal] = useState(false);
    const [showExtrasModal, setShowExtrasModal] = useState(false);
    const [showAdvancedModal, setShowAdvancedModal] = useState(false);
    const [showBowlerModal, setShowBowlerModal] = useState(false);
    const [showWicketModal, setShowWicketModal] = useState(false);
    const [showEndInningsModal, setShowEndInningsModal] = useState(false);

    // Computed state
    const canScore = !!(currentInnings?.currentStrikerId && currentInnings?.currentBowlerId);

    // Reset extras state
    const resetExtrasState = () => {
        setWide(false);
        setNoBall(false);
        setBye(false);
        setLegBye(false);
    };

    // Add a reset function at the top of your component
    const resetScoringState = () => {
        resetExtrasState();
        setWicket(false);
        setTempRuns(0);
        setShowPartnershipModal(false);
        setShowExtrasModal(false); 
        setShowAdvancedModal(false);
        setShowBowlerModal(false);
        setShowWicketModal(false);
        setShowEndInningsModal(false);
    };

    // Scoring handler
    const handleScore = (runs: number) => {
        // Prevent scoring if match is over
        if (state.matchOver) {
            Alert.alert("Match Completed", "The match is already over.");
            return;
        }

        if (!canScore) {
            setShowBowlerModal(true);
            return;
        }
        
        if (wicket) {
            // Save runs for use in wicket modal
            setTempRuns(runs);
            
            // Show wicket modal (with runs already attached)
            setShowWicketModal(true);
        } else if (wide || noBall || bye || legBye) {
            // Handle extras
            dispatch(scoreBall({
                runs,
                extraType: wide ? 'wide' : noBall ? 'no-ball' : bye ? 'bye' : 'leg-bye',
            }));
            resetExtrasState();
        } else {
            // Regular run scoring
            dispatch(scoreBall({ runs }));
        }
        
        // Calculate and check if this scoring action will win the match
        if (state.currentInning === 2 && state.targetScore) {
            const currentTotal = currentInnings?.totalRuns || 0;
            if (currentTotal + runs >= state.targetScore && !wicket) {
                console.log("This will win the match!");
            }
        }
        
        // Reset wicket toggle after handling
        setWicket(false);
    };

    // Update the handleWicketConfirm function to include fielderName and better handle the next batsman
const handleWicketConfirm = (wicketData: {
    wicketType: string;
    outBatsmanId: string;
    fielderId?: string;
    fielderName?: string;
    nextBatsmanId: string;
}) => {
    // Prevent if match is over
    if (state.matchOver) {
        setShowWicketModal(false);
        Alert.alert("Match Completed", "The match is already over.");
        return;
    }

    // Close the wicket modal
    setShowWicketModal(false);
    
    // Record the wicket in the scoreboard with runs included
    dispatch(scoreBall({
        runs: tempRuns, // These are the runs we saved earlier
        wicket: true,
        wicketType: wicketData.wicketType,
        outBatsmanId: wicketData.outBatsmanId,
        fielderId: wicketData.fielderId,
        // fielderName: wicketData.fielderName,
    }));
    
    // Update the new batsman directly
    const teamKey = battingTeam.id === state.teamA.id ? 'teamA' : 'teamB';
    const isStriker = wicketData.outBatsmanId === currentInnings?.currentStrikerId;
    
    if (isStriker) {
        dispatch(setCurrentStriker({ team: teamKey, playerId: wicketData.nextBatsmanId }));
    } else {
        dispatch(setCurrentNonStriker({ team: teamKey, playerId: wicketData.nextBatsmanId }));
    }
};

    // Add a function to change the bowler anytime
    const handleChangeBowler = () => {
        setShowBowlerModal(true);
    };

    // Update the bowler modal effect
    useEffect(() => {
        // Only show bowler modal for new over if:
        // 1. The over is complete (ballInCurrentOver === 0 and completedOvers > 0)
        // 2. AND the innings is not complete (not readyForInnings2)
        // 3. AND the match is not over
        if (currentInnings?.ballInCurrentOver === 0 && 
            currentInnings?.completedOvers > 0 &&
            !currentInnings?.readyForInnings2 && 
            !currentInnings?.isCompleted &&
            !state.matchOver) {  // Add this condition
            setShowBowlerModal(true);
        }
    }, [currentInnings?.ballInCurrentOver, currentInnings?.completedOvers, 
        currentInnings?.readyForInnings2, currentInnings?.isCompleted, state.matchOver]);

    // Check for innings completion
    const [isComponentMounted, setIsComponentMounted] = useState(false);
    
    // Mark the component as mounted after the initial render
    useEffect(() => {
        setIsComponentMounted(true);
        return () => setIsComponentMounted(false);
    }, []);

    // Add this useEffect to reset state when the component mounts or the innings changes
    useEffect(() => {
        resetScoringState();
    }, [state.currentInning]);

    // Add this debugging function to your component
const debugInningsStatus = () => {
    console.log('Current status:', {
        inning: state.currentInning,
        battingTeam: battingTeam?.teamName,
        bowlingTeam: bowlingTeam?.teamName,
        isCompleted: currentInnings?.isCompleted,
        readyForInnings2: currentInnings?.readyForInnings2,
        wickets: currentInnings?.wickets,
        completedOvers: currentInnings?.completedOvers,
        totalOvers: state.totalOvers,
        showEndInningsModal
    });
};

// Modify this useEffect to handle both conditions properly
useEffect(() => {
    // Only run this effect if the component is fully mounted
    if (!isComponentMounted) return;
    
    const checkInningsStatus = () => {
        if (!currentInnings) return;
        
        // Debug the current status
        debugInningsStatus();
        
        // First check if match is over - this takes precedence
        if (state.matchOver) {
            // Hide the end innings modal if showing
            if (showEndInningsModal) {
                setShowEndInningsModal(false);
            }
            return;
        }
        
        // Handle second innings completion - navigate to scorecard
        if (state.currentInning === 2 && currentInnings.isCompleted) {
            // This will be handled by the matchOver effect now
            return;
        }
        
        // Handle first innings readiness for transitioning to second innings
        // Add a navigation status flag to prevent double navigation
        if (state.currentInning === 1 && 
            currentInnings.readyForInnings2 && 
            !showEndInningsModal && 
            !isNavigating.current) {
            
            // Close any other open modals
            setShowBowlerModal(false);
            setShowWicketModal(false);
            setShowPartnershipModal(false);
            setShowExtrasModal(false);
            setShowAdvancedModal(false);
            
            // Show the end innings modal
            setShowEndInningsModal(true);
            return;
        }
        
        // Check if first innings should be marked as ready for innings 2
        if (state.currentInning === 1 && 
            currentInnings.battingTeamId && 
            currentInnings.currentStrikerId) {
            
            const allOut = currentInnings.wickets >= battingTeam.players.filter(p => !p.isRetired).length - 1;
            const oversComplete = currentInnings.completedOvers >= state.totalOvers;
            
            if ((allOut || oversComplete) && !currentInnings.readyForInnings2) {
                // Use checkInningsCompletion instead of endInnings
                dispatch({ type: 'scoreboard/checkInningsCompletion' });
            }
        }
    };
    
    // Use a shorter timeout
    const timer = setTimeout(checkInningsStatus, 150);
    return () => clearTimeout(timer);
    
}, [
    isComponentMounted,
    currentInnings?.isCompleted,
    currentInnings?.readyForInnings2,
    currentInnings?.wickets,
    currentInnings?.completedOvers,
    state.currentInning,
    currentInnings?.battingTeamId,
    currentInnings?.currentStrikerId,
    showEndInningsModal,
    state.matchOver
]);

// Add a navigation flag using useRef at the top of your component
const isNavigating = useRef(false);

// Update handleEndInningsConfirm to use the flag
const handleEndInningsConfirm = () => {
    console.log('End innings confirmed - navigating to openingPlayers');
    
    // Close the modal
    setShowEndInningsModal(false);
    
    // Set the navigation flag to prevent duplicate navigation
    isNavigating.current = true;
    
    // Navigate after a short delay
    setTimeout(() => {
        router.push('/openingPlayers?innings=2');
    }, 150);
};


// Replace your current alert useEffect with this much simpler version
useEffect(() => {
    // Only show if match is over and has a result
    if (!state.matchOver || !state.matchResult) {
        return;
    }
    
    // Create a key for this specific match alert
    const alertKey = `match-${state.id}-completed`;
    
    // Check if we've already shown this alert during this app session
    if (SHOWN_MATCH_ALERTS.has(alertKey)) {
        console.log(`Alert for match ${alertKey} already shown in this app session, skipping`);
        return;
    }
    
    // Mark as shown IMMEDIATELY before any async operations
    SHOWN_MATCH_ALERTS.add(alertKey);
    
    console.log(`First time showing alert for match ${alertKey}, proceeding`);
    
    // Show the alert after a short delay to let UI settle
    setTimeout(() => {
        Alert.alert(
            "Match Completed",
            state.matchResult,
            [
                {
                    text: "View Scorecard",
                    onPress: () => {
                        setTimeout(() => {
                            router.push('/scorecard');
                        }, 100);
                    }
                }
            ],
            { cancelable: false }
        );
    }, 500);
}, [state.matchOver, state.matchResult, state.id]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <ScoreHeader
                    battingTeam={battingTeam}
                    currentInnings={currentInnings}
                    currentInning={currentInning}
                    targetScore={targetScore}
                    matchResult={state.matchResult}
                />

                <View style={styles.playerInfoContainer}>
                    <BatsmenDisplay
                        battingTeam={battingTeam}
                        currentInnings={currentInnings}
                    />

                    <BowlerDisplay
                        bowlingTeam={bowlingTeam}
                        currentInnings={currentInnings}
                    />
                </View>
                <OverRowDisplay />
                <View style={styles.scoringContainer}>
                    <View style={styles.togglesContainer}>
                        <ExtrasToggle
                            wide={wide}
                            noBall={noBall}
                            bye={bye}
                            legBye={legBye}
                            setWide={setWide}
                            setNoBall={setNoBall}
                            setBye={setBye}
                            setLegBye={setLegBye}
                        />
                        <WicketToggle
                            wicket={wicket}
                            setWicket={setWicket}
                            disabled={!canScore}
                        />
                    </View>

                    <ScoringButtons
                        onScore={handleScore}
                        canScore={canScore}
                        onAdvancedScore={() => setShowAdvancedModal(true)}
                    />

                    {/* Rest of your components */}
                </View>

                <ActionButtons
                    canScore={canScore}
                    onUndo={() => dispatch(undoLastBall())}
                    onSwap={() => dispatch(swapBatsmen())}
                    onPartnership={() => setShowPartnershipModal(true)}
                    onExtras={() => setShowExtrasModal(true)}
                />

                <TouchableOpacity 
                    style={styles.changeBowlerButton}
                    onPress={handleChangeBowler}
                >
                    <Text style={styles.changeBowlerText}>Change Bowler</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Modals */}
            <PartnershipModal
                visible={showPartnershipModal}
                onClose={() => setShowPartnershipModal(false)}
                battingTeam={battingTeam}
                currentInnings={currentInnings}
            />

            <ExtrasModal
                visible={showExtrasModal}
                onClose={() => setShowExtrasModal(false)}
                onAddExtras={(runs) => dispatch(addExtraRuns(runs))}
            />

            <AdvancedScoringModal
                visible={showAdvancedModal}
                onClose={() => setShowAdvancedModal(false)}
                onScore={handleScore}
            />

            <NextBowlerModal
                visible={showBowlerModal}
                onClose={() => setShowBowlerModal(false)}
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
            />
            
            <WicketModal
                visible={showWicketModal}
                onClose={() => setShowWicketModal(false)}
                onConfirm={handleWicketConfirm}
                battingTeam={battingTeam}
                bowlingTeam={bowlingTeam}
                currentStrikerId={currentInnings?.currentStrikerId || ''}
                currentNonStrikerId={currentInnings?.currentNonStrikerId || ''}
                battingTeamKey={battingTeam.id === state.teamA.id ? 'teamA' : 'teamB'}
            />

            <EndInningsModal
                visible={showEndInningsModal}
                onClose={() => setShowEndInningsModal(false)}
                onConfirm={handleEndInningsConfirm}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1, 
        backgroundColor: '#f9f9f9'
    },
    container: {
        flex: 1,
        padding: 12,
    },
    playerInfoContainer: {
        marginVertical: 8,
    },
    scoringContainer: {
        marginVertical: 8,
    },
    togglesContainer: {
        marginVertical: 8,
    },
    changeBowlerButton: {
        marginTop: 10,
        padding: 12,
        backgroundColor: '#1B5E20',
        borderRadius: 8,
        alignItems: 'center',
    },
    changeBowlerText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    }
});