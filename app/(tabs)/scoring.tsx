import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
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

// Import modals
import PartnershipModal from '@/components/scoring/modals/PartnershipModal';
import ExtrasModal from '@/components/scoring/modals/ExtrasModal';
import AdvancedScoringModal from '@/components/scoring/modals/AdvancedScoringModal';
import NextBowlerModal from '@/components/scoring/modals/NextBowlerModal';
import NextBatsmanModal from '@/components/scoring/modals/NextBatsmanModal';
import WicketModal from '@/components/scoring/modals/WicketModal';

// Import actions
import {
    scoreBall,
    undoLastBall,
    swapBatsmen,
    setBowler,
    addExtraRuns,
    setCurrentStriker,
    setCurrentNonStriker
} from '@/store/cricket/scoreboardSlice';

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

    // Computed state
    const canScore = !!(currentInnings?.currentStrikerId && currentInnings?.currentBowlerId);

    // Reset extras state
    const resetExtrasState = () => {
        setWide(false);
        setNoBall(false);
        setBye(false);
        setLegBye(false);
    };

    // Scoring handler
    const handleScore = (runs: number) => {
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
        
        // Reset wicket toggle after handling
        setWicket(false);
    };

    // Open wicket modal when wicket button is pressed
    const handleWicketButtonPress = () => {
        if (!canScore) {
            setShowBowlerModal(true);
            return;
        }
        
        // Store the current runs temporarily (in case we want to add runs with the wicket)
        setTempRuns(0); 
        setShowWicketModal(true);
    };

    // Update the handleWicketConfirm function:

const handleWicketConfirm = (wicketData: {
    wicketType: string;
    outBatsmanId: string;
    fielderId?: string;
    fielderName?: string;
    nextBatsmanId: string;
}) => {
    // Close the wicket modal
    setShowWicketModal(false);
    
    // Record the wicket in the scoreboard with runs included
    dispatch(scoreBall({
        runs: tempRuns, // These are the runs we saved earlier
        wicket: true,
        wicketType: wicketData.wicketType,
        outBatsmanId: wicketData.outBatsmanId,
        fielderId: wicketData.fielderId,
        fielderName: wicketData.fielderName,
    }));
    
    // Update the new batsman directly
    const teamKey = battingTeam.id === state.teamA.id ? 'teamA' : 'teamB';
    const isStriker = wicketData.outBatsmanId === currentInnings.currentStrikerId;
    
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

    // Check for over completion and show bowler modal
    useEffect(() => {
        if (currentInnings?.ballInCurrentOver === 0 && currentInnings?.completedOvers > 0) {
            setShowBowlerModal(true);
        }
    }, [currentInnings?.ballInCurrentOver, currentInnings?.completedOvers]);

    // Check for innings completion
    useEffect(() => {
        if (currentInnings?.isCompleted) {
            router.push('/scorecard');
        }
    }, [currentInnings?.isCompleted]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <ScoreHeader
                    battingTeam={battingTeam}
                    currentInnings={currentInnings}
                    currentInning={currentInning}
                    targetScore={targetScore}
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