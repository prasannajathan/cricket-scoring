import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
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
import WicketPanel from '@/components/scoring/WicketPanel';
import ScoringButtons from '@/components/scoring/ScoringButtons';
import ActionButtons from '@/components/scoring/ActionButtons';
import { MatchStatistics } from '@/components/statistics/MatchStatistics';

// Import modals
import PartnershipModal from '@/components/scoring/modals/PartnershipModal';
import ExtrasModal from '@/components/scoring/modals/ExtrasModal';
import AdvancedScoringModal from '@/components/scoring/modals/AdvancedScoringModal';
import NextBowlerModal from '@/components/scoring/modals/NextBowlerModal';
import RetirementModal from '@/components/scoring/modals/RetirementModal';
import NewBatsmanModal from '@/components/scoring/modals/NewBatsmanModal';

// Import actions
import {
    scoreBall,
    undoLastBall,
    swapBatsmen,
    setBowler,
    addExtraRuns,
    retireBatsman,
    addNewBatsman,
    handleEndOfInnings
} from '@/store/cricket/scoreboardSlice';

export default function ScoringScreen() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { matchId } = useLocalSearchParams();
    const state = useSelector((state: RootState) => state);

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
    const [wicketType, setWicketType] = useState('bowled');
    const [outBatsmanId, setOutBatsmanId] = useState<string | undefined>();

    // Modal states
    const [showPartnershipModal, setShowPartnershipModal] = useState(false);
    const [showExtrasModal, setShowExtrasModal] = useState(false);
    const [showAdvancedModal, setShowAdvancedModal] = useState(false);
    const [showBowlerModal, setShowBowlerModal] = useState(false);
    const [showRetirementModal, setShowRetirementModal] = useState(false);
    const [showNewBatsmanModal, setShowNewBatsmanModal] = useState(false);
    const [retiredBatsmanId, setRetiredBatsmanId] = useState<string | null>(null);

    // Computed state
    const canScore = !!(currentInnings?.currentStrikerId && currentInnings?.currentBowlerId);

    // Reset extras and wicket state
    const resetScoringState = () => {
        setWide(false);
        setNoBall(false);
        setBye(false);
        setLegBye(false);
        setWicket(false);
        setWicketType('bowled');
        setOutBatsmanId(undefined);
    };

    // Scoring handler
    const handleScore = (runs: number) => {
        if (!canScore) return;

        dispatch(scoreBall({
            delivery: {
                runs,
                extraType: wide ? 'wide' :
                    noBall ? 'no-ball' :
                        bye ? 'bye' :
                            legBye ? 'leg-bye' : undefined,
                batsmanId: currentInnings.currentStrikerId!,
                bowlerId: currentInnings.currentBowlerId!,
                timestamp: Date.now(),
                wicket: wicket ? {
                    type: wicketType,
                    dismissedPlayerId: outBatsmanId || currentInnings.currentStrikerId!
                } : undefined
            }
        }));

        resetScoringState();
    };

    // Handle retirement
    const handleRetirement = (batsmanId: string, type: 'hurt' | 'out' | 'tactical') => {
        dispatch(retireBatsman({ batsmanId, retirementType: type }));
        setShowNewBatsmanModal(true);
    };

    // Handle new batsman
    const handleNewBatsman = (batsmanId: string, position: 'striker' | 'nonStriker') => {
        dispatch(addNewBatsman({ batsmanId, position }));
        setShowNewBatsmanModal(false);
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
            dispatch(handleEndOfInnings());
            if (state.matchDetails.matchOver) {
                router.push('/match-summary');
            }
        }
    }, [currentInnings?.isCompleted]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <ScrollView style={styles.container}>
                <ScoreHeader
                    battingTeam={battingTeam}
                    currentInnings={currentInnings}
                    currentInning={currentInning}
                    targetScore={state.matchDetails.targetScore}
                />

                <BatsmenDisplay
                    battingTeam={battingTeam}
                    currentInnings={currentInnings}
                />

                <BowlerDisplay
                    bowlingTeam={bowlingTeam}
                    currentInnings={currentInnings}
                />

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

                {wicket && (
                    <WicketPanel
                        wicketType={wicketType}
                        setWicketType={setWicketType}
                        outBatsmanId={outBatsmanId}
                        setOutBatsmanId={setOutBatsmanId}
                        battingTeam={battingTeam}
                    />
                )}

                <ScoringButtons
                    onScore={handleScore}
                    canScore={canScore}
                    onAdvancedScore={() => setShowAdvancedModal(true)}
                />

                <ActionButtons
                    canScore={canScore}
                    onUndo={() => dispatch(undoLastBall())}
                    onSwap={() => dispatch(swapBatsmen())}
                    onPartnership={() => setShowPartnershipModal(true)}
                    onExtras={() => setShowExtrasModal(true)}
                    onRetire={() => setShowRetirementModal(true)}
                />

                <MatchStatistics />

            </ScrollView>

            {/* ... modals ... */}
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
                currentBowlerId={currentInnings.currentBowlerId}
                lastOverBowlerId={currentInnings.lastOverBowlerId}
                onSelectBowler={(bowlerId) => dispatch(setBowler({
                    team: bowlingTeam.id === state.teamA.id ? 'teamA' : 'teamB',
                    bowlerId
                }))}
            />

            <RetirementModal
                visible={showRetirementModal}
                onClose={() => setShowRetirementModal(false)}
                battingTeam={battingTeam}
                currentStrikerId={currentInnings?.currentStrikerId}
                currentNonStrikerId={currentInnings?.currentNonStrikerId}
                onRetire={handleRetirement}
            />

            <NewBatsmanModal
                visible={showNewBatsmanModal}
                onClose={() => setShowNewBatsmanModal(false)}
                battingTeam={battingTeam}
                currentInnings={currentInnings}
                onSelectBatsman={handleNewBatsman}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 10,
    }
});