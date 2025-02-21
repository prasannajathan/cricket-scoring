// app/scoring.tsx 
import React, { useState, useEffect, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Modal,
    Pressable,
    Button,
    SafeAreaView,
    Alert
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { RootState } from '@/store';
import {
    scoreBall,
    undoLastBall,
    swapBatsman,
    retireBatsman,
    addExtraRuns,
    endInnings,
    setBowler,
    setMatchResult,
    setMatchOver,
    clearMatchResult  // Add this import
} from '@/store/scoreboardSlice';
import { Cricketer } from '@/types';
import { saveMatch } from '@/utils/saveMatchStorage'

import BatsmanRow from '@/components/BatsmanRow';
import BowlerRow from '@/components/BowlerRow';

import { computeCRR, computeRRR } from '@/utils';
type WicketType = 'bowled' | 'caught' | 'runout' | 'lbw' | 'stumped' | 'hitWicket' | 'retired' | 'other';

export default function ScoringScreen() {
    const router = useRouter();
    const { matchId } = useLocalSearchParams();
    const dispatch = useDispatch();
    const scoreboard = useSelector((state: RootState) => state.scoreboard);
    const {
        teamA,
        teamB,
        currentInning,
        totalOvers,
        targetScore,
        matchResult,
        matchOver,
    } = scoreboard;

    const MemoizedBatsmanRow = memo(BatsmanRow);
    const MemoizedBowlerRow = memo(BowlerRow);

    // Update the team and innings selection
    const currentInnings = scoreboard[`innings${currentInning}`];
    const battingTeam = teamA.id === currentInnings.battingTeamId ? teamA : teamB;
    const bowlingTeam = teamA.id === currentInnings.bowlingTeamId ? teamA : teamB;

    // Extras/wicket toggles
    const [wide, setWide] = useState(false);
    const [noBall, setNoBall] = useState(false);
    const [bye, setBye] = useState(false);
    const [legBye, setLegBye] = useState(false);
    const [wicket, setWicket] = useState(false);

    // Wicket detail
    const [wicketType, setWicketType] = useState<WicketType>('bowled');
    const [outBatsmanId, setOutBatsmanId] = useState<string | undefined>(undefined);

    // Partnerships + Extras modals
    const [showPartnershipModal, setShowPartnershipModal] = useState(false);
    const [showExtrasModal, setShowExtrasModal] = useState(false);
    // TODO: Add penalty runs to state
    const [penaltyRuns, setPenaltyRuns] = useState(0);
    // Advanced scoring modal
    const [showAdvancedModal, setShowAdvancedModal] = useState(false);

    // Next Batsman modal
    const [showNextBatsmanModal, setShowNextBatsmanModal] = useState(false);
    const [nextBatsmanId, setNextBatsmanId] = useState<string>('');

    // read partnership 
    const currentPartnership = battingTeam.currentPartnership || 0;
    const canScore = !matchOver;

    // useEffect to auto-end innings
    useEffect(() => {
        if (matchOver) return;
        
        const isInningsComplete = 
            battingTeam.wickets >= 10 || 
            currentInnings.completedOvers >= totalOvers ||
            (currentInning === 2 && targetScore && currentInnings.totalRuns >= targetScore);

        if (isInningsComplete) {
            if (currentInning === 1) {
                // First innings completed
                dispatch(clearMatchResult());
                dispatch(endInnings());
                router.push({
                    pathname: '/openingPlayers',
                    params: { innings: '2' }
                });
            } else if (currentInning === 2) {
                // Second innings completed
                const runsShort = targetScore ? targetScore - currentInnings.totalRuns : 0;
                if (currentInnings.totalRuns >= (targetScore || 0)) {
                    // Chasing team wins
                    dispatch(setMatchResult(
                        `${battingTeam.teamName} wins by ${10 - currentInnings.wickets} wickets`
                    ));
                } else {
                    // Defending team wins
                    dispatch(setMatchResult(
                        `${bowlingTeam.teamName} wins by ${runsShort} runs`
                    ));
                }
                dispatch(setMatchOver(true));
                // router.push('/scorecard');
            }
        }
    }, [
        currentInnings.completedOvers,
        currentInnings.totalRuns,
        battingTeam.wickets,
        totalOvers,
        targetScore,
        matchOver,
        currentInning,
        dispatch,
        router,
        battingTeam.teamName,
        bowlingTeam.teamName
    ]);

    useEffect(() => {
        if (matchId) {
            saveMatch({
                ...scoreboard, id: matchId as string,
                name: '',
                completed: false
            });
        }
    }, [scoreboard, matchId]);

    // If user picks a new batsman, we can set that as the "currentStrikerId" if the striker was out
    const handleConfirmNextBatsman = () => {
        if (nextBatsmanId) {
            // Replace either striker or non-striker if they got out
            // For simplicity, assume the striker got out
            battingTeam.currentStrikerId = nextBatsmanId;
        }
        setShowNextBatsmanModal(false);
    };

    // Score a ball
    const handleScore = (runValue: number) => {
        if (!bowlingTeam.currentBowlerId) {
            Alert.alert('Error', 'No bowler selected', [
                { 
                    text: 'Select Bowler', 
                    onPress: () => router.push({
                        pathname: '/openingPlayers',
                        params: { innings: currentInning.toString() }
                    })
                }
            ]);
            return;
        }
        if (!canScore) return;

        // Check if this score would win the match in second innings
        if (currentInning === 2 && targetScore) {
            const projectedScore = currentInnings.totalRuns + runValue;
            if (projectedScore >= targetScore) {
                // This will win the match
                dispatch(scoreBall({
                    runs: runValue,
                    extraType: undefined,
                    wicket: false
                }));
                dispatch(setMatchResult(
                    `${battingTeam.teamName} wins by ${10 - currentInnings.wickets} wickets`
                ));
                dispatch(setMatchOver(true));
                router.push('/scorecard');
                return;
            }
        }

        // Normal scoring continues
        let extraType: 'wide' | 'no-ball' | 'bye' | 'leg-bye' | undefined;
        if (wide) extraType = 'wide';
        else if (noBall) extraType = 'no-ball';
        else if (bye) extraType = 'bye';
        else if (legBye) extraType = 'leg-bye';

        dispatch(scoreBall({
            runs: runValue,
            extraType,
            wicket,
            wicketType: wicket ? wicketType : undefined,
            outBatsmanId: wicket ? outBatsmanId : undefined,
        }));

        // reset toggles
        setWide(false);
        setNoBall(false);
        setBye(false);
        setLegBye(false);
        setWicket(false);
        setWicketType('bowled');
        setOutBatsmanId(undefined);

        // If a wicket happened, open "next batsman" modal if not all out
        if (wicket && battingTeam.wickets < 10) {
            setShowNextBatsmanModal(true);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <ScrollView style={styles.container}>
                {/* Match result? */}
                {matchResult && (
                    <Text style={{ fontSize: 16, color: 'red', marginBottom: 6 }}>{matchResult}</Text>
                )}
                {/* Score display */}
                <View style={styles.scoreHeader}>
                    <Text style={styles.scoreText}>
                        {`${battingTeam.teamName} ${currentInnings.totalRuns}/${currentInnings.wickets}`}
                    </Text>
                    <Text style={styles.oversText}>
                        {`(${currentInnings.completedOvers}.${currentInnings.ballInCurrentOver} overs)`}
                        {currentInning === 2 && targetScore && (
                            <Text> Target: {targetScore}</Text>
                        )}
                    </Text>
                    <Text style={styles.crrLabel}>
                        {`CRR: ${computeCRR(currentInnings.totalRuns, currentInnings.completedOvers, currentInnings.ballInCurrentOver)}`}
                        {currentInning === 2 && targetScore && (
                            <Text>{` | Required RR: ${computeRRR(
                                targetScore - currentInnings.totalRuns,
                                totalOvers - currentInnings.completedOvers - (currentInnings.ballInCurrentOver / 6)
                            )}`}</Text>
                        )}
                    </Text>
                </View>

                {/* Batsmen */}
                <Text style={styles.label}>Batsmen:</Text>
                <View>
                    {battingTeam.players
                        .filter(p => p.id === currentInnings.currentStrikerId || p.id === currentInnings.currentNonStrikerId)
                        .map((p) => (
                            <View key={p.id} style={styles.playerRow}>
                                <MemoizedBatsmanRow 
                                    player={p} 
                                    isStriker={p.id === currentInnings.currentStrikerId}
                                />
                            </View>
                        ))}
                </View>

                {/* Bowler */}
                <Text style={styles.label}>Current Bowler:</Text>
                <View>
                    {currentInnings.currentBowlerId && bowlingTeam.players ? (
                        <View style={styles.playerRow}>
                            <MemoizedBowlerRow
                                bowler={bowlingTeam.players.find(p => p.id === currentInnings.currentBowlerId)!}
                            />
                        </View>
                    ) : (
                        <Text style={styles.noDataText}>No bowler selected</Text>
                    )}
                </View>

                {/* Toggle extras */}
                <Text style={styles.label}>Extras</Text>
                <View style={styles.extrasRow}>
                    <Switch
                        trackColor={{ false: "#767577", true: "#4CAF50" }}
                        thumbColor={wide ? "#81b0ff" : "#f4f3f4"}
                        value={wide}
                        onValueChange={(v) => {
                            setWide(v);
                            if (v) {
                                setNoBall(false);
                                setBye(false);
                                setLegBye(false);
                            }
                        }}
                    />
                    <Text>Wide</Text>
                    <Switch
                        value={noBall}
                        onValueChange={(v) => {
                            setNoBall(v);
                            if (v) {
                                setWide(false);
                                setBye(false);
                                setLegBye(false);
                            }
                        }}
                    />
                    <Text>No Ball</Text>
                    <Switch
                        value={bye}
                        onValueChange={(v) => {
                            setBye(v);
                            if (v) {
                                setWide(false);
                                setNoBall(false);
                                setLegBye(false);
                            }
                        }}
                    />
                    <Text>Byes</Text>
                    <Switch
                        value={legBye}
                        onValueChange={(v) => {
                            setLegBye(v);
                            if (v) {
                                setWide(false);
                                setNoBall(false);
                                setBye(false);
                            }
                        }}
                    />
                    <Text>Leg Byes</Text>
                </View>
                {/* <View style={styles.extraTypeContainer}>
                    {['wide', 'noBall', 'bye', 'legBye'].map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.extraTypeButton,
                                (wide && type === 'wide') ||
                                    (noBall && type === 'noBall') ||
                                    (bye && type === 'bye') ||
                                    (legBye && type === 'legBye')
                                    ? styles.selectedExtra
                                    : null
                            ]}
                            onPress={() => handleExtraSelect(type)}
                        >
                            <Text style={styles.extraTypeText}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View> */}

                {/* Wicket toggle */}
                <View style={styles.extrasRow}>
                    <Switch value={wicket} onValueChange={setWicket} />
                    <Text>Wicket?</Text>
                </View>

                {/* If wicket is toggled, let user pick wicket type & out batsman */}
                {wicket && (
                    <View style={styles.wicketBox}>
                        <Text style={styles.label}>Select Wicket Type</Text>
                        <Picker
                            selectedValue={wicketType}
                            style={{ height: 40, width: 180 }}
                            onValueChange={(itemValue) => setWicketType(itemValue as WicketType)}
                        >
                            <Picker.Item label="Bowled" value="bowled" />
                            <Picker.Item label="Caught" value="caught" />
                            <Picker.Item label="Run out" value="runout" />
                            <Picker.Item label="LBW" value="lbw" />
                            <Picker.Item label="Stumped" value="stumped" />
                            <Picker.Item label="Hit Wicket" value="hitWicket" />
                            <Picker.Item label="Retired" value="retired" />
                            <Picker.Item label="Other" value="other" />
                        </Picker>

                        <Text style={styles.label}>Which Batsman is Out?</Text>
                        <Picker
                            selectedValue={outBatsmanId}
                            style={{ height: 40, width: 180 }}
                            onValueChange={(val) => setOutBatsmanId(val)}
                        >
                            <Picker.Item label="(Assume Striker)" value={undefined} />
                            {battingTeam.players
                                .filter((p) => !p.isOut)
                                .map((pl) => (
                                    <Picker.Item label={pl.name} value={pl.id} key={pl.id} />
                                ))}
                        </Picker>
                    </View>
                )}

                {/* Score Buttons */}
                <Text style={styles.label}>Scoring:</Text>
                <View style={styles.runRow}>
                    {[0, 1, 2, 3, 4, 5, 6].map((run) => (
                        <TouchableOpacity key={run} onPress={() => handleScore(run)} disabled={!canScore}>
                            <View style={styles.runButton}>
                                <Text>{run}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                    {/* advanced scoring */}
                    <TouchableOpacity onPress={() => setShowAdvancedModal(true)} disabled={!canScore}>
                        <View style={styles.runButton}>
                            <Text>...</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Partnerships & Extras Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => setShowPartnershipModal(true)}
                        disabled={!canScore}
                    >
                        <Text>Partnerships</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => setShowExtrasModal(true)}
                        disabled={!canScore}
                    >
                        <Text>Extras</Text>
                    </TouchableOpacity>
                </View>

                {/* Additional actions */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { marginRight: 10 }]}
                        onPress={() => dispatch(undoLastBall())}
                        disabled={!canScore}
                    >
                        <Text>Undo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => dispatch(swapBatsman())} disabled={!canScore}>
                        <Text>Swap Batsman</Text>
                    </TouchableOpacity>
                </View>

                {/* Current Partnership */}
                <Text style={{ marginTop: 10 }}>
                    Current Partnership: {battingTeam.currentPartnership}
                </Text>

                {/* Next Batsman Modal (if a wicket fell) */}
                <NextBatsmanModal
                    visible={showNextBatsmanModal}
                    onClose={() => setShowNextBatsmanModal(false)}
                    players={battingTeam.players}
                    onSelect={(id) => setNextBatsmanId(id)}
                    onConfirm={handleConfirmNextBatsman}
                />

                {/* Partnerships Modal */}
                <PartnershipModal
                    visible={showPartnershipModal}
                    onClose={() => setShowPartnershipModal(false)}
                    battingTeam={battingTeam}
                />

                {/* Extras Modal */}
                <ExtrasModal
                    visible={showExtrasModal}
                    onClose={() => setShowExtrasModal(false)}
                    onAddPenalty={(num) => {
                        dispatch(addExtraRuns({ team: teamA.batting ? 'teamA' : 'teamB', runs: num }));
                    }}
                />

                {/* Advanced Scoring Modal */}
                <AdvancedScoringModal
                    visible={showAdvancedModal}
                    onClose={() => setShowAdvancedModal(false)}
                    onConfirm={(num) => handleScore(num)}
                />

            </ScrollView>
        </SafeAreaView>
    );
}

// Next Batsman
interface Player extends Cricketer {
    id: string;
    name: string;
    isOut: boolean;
}
function NextBatsmanModal({
    visible,
    onClose,
    players,
    onSelect,
    onConfirm,
}: {
    visible: boolean;
    onClose: () => void;
    players: Player[];
    onSelect: (id: string) => void;
    onConfirm: () => void;
}) {
    const [selectedId, setSelectedId] = useState<string>('');

    useEffect(() => {
        setSelectedId(''); // reset each time we show the modal
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                    <Text style={styles.modalTitle}>New Batsman</Text>
                    <Text>Select the incoming batsman:</Text>
                    <Picker
                        selectedValue={selectedId}
                        onValueChange={(val) => setSelectedId(val)}
                    >
                        <Picker.Item label="Select a player" value="" />
                        {players
                            .filter((p) => p.isOut === false)
                            .map((pl) => (
                                <Picker.Item label={pl.name} value={pl.id} key={pl.id} />
                            ))}
                    </Picker>
                    <View style={{ flexDirection: 'row', marginTop: 10 }}>
                        <Pressable
                            style={styles.closeBtn}
                            onPress={() => {
                                onSelect(selectedId);
                                onConfirm();
                            }}
                        >
                            <Text style={{ color: '#fff' }}>Confirm</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.closeBtn, { backgroundColor: '#666', marginLeft: 10 }]}
                            onPress={onClose}
                        >
                            <Text style={{ color: '#fff' }}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

/** Partnerships Modal */
function PartnershipModal({
    visible,
    onClose,
    battingTeam,
}: {
    visible: boolean;
    onClose: () => void;
    battingTeam: any;
}) {
    const { partnerships = [], currentPartnership = 0 } = battingTeam;

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                    <Text style={styles.modalTitle}>Partnerships</Text>
                    <Text>Current Partnership: {currentPartnership}</Text>
                    <Text>Past Partnerships:</Text>
                    {partnerships.length === 0 ? (
                        <Text style={{ marginVertical: 4 }}>No partnerships yet.</Text>
                    ) : (
                        partnerships.map((pship: number, idx: number) => (
                            <Text key={idx}>
                                Wicket {idx + 1}: {pship} runs
                            </Text>
                        ))
                    )}
                    <Pressable style={styles.closeBtn} onPress={onClose}>
                        <Text style={{ color: '#fff' }}>Close</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

/** Extras Modal */
function ExtrasModal({
    visible,
    onClose,
    onAddPenalty,
}: {
    visible: boolean;
    onClose: () => void;
    onAddPenalty: (runs: number) => void;
}) {
    const [penalty, setPenalty] = useState(0);

    const handleConfirm = () => {
        if (penalty > 0) {
            onAddPenalty(penalty);
        }
        setPenalty(0);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                    <Text style={styles.modalTitle}>Extras / Penalties</Text>
                    <Text style={{ marginVertical: 4 }}>Add Penalty Runs:</Text>
                    <Picker selectedValue={penalty} onValueChange={(val) => setPenalty(val)}>
                        <Picker.Item label="0" value={0} />
                        <Picker.Item label="1" value={1} />
                        <Picker.Item label="2" value={2} />
                        <Picker.Item label="3" value={3} />
                        <Picker.Item label="4" value={4} />
                        <Picker.Item label="5" value={5} />
                        <Picker.Item label="6" value={6} />
                        <Picker.Item label="10" value={10} />
                    </Picker>

                    <View style={{ flexDirection: 'row', marginTop: 10 }}>
                        <Pressable style={[styles.closeBtn, { marginRight: 10 }]} onPress={handleConfirm}>
                            <Text style={{ color: '#fff' }}>Add Runs</Text>
                        </Pressable>
                        <Pressable style={[styles.closeBtn, { backgroundColor: '#666' }]} onPress={onClose}>
                            <Text style={{ color: '#fff' }}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

/** Advanced Scoring Modal */
function AdvancedScoringModal({
    visible,
    onClose,
    onConfirm,
}: {
    visible: boolean;
    onClose: () => void;
    onConfirm: (num: number) => void;
}) {
    const [runs, setRuns] = useState(7);

    const handleOk = () => {
        onConfirm(runs);
        setRuns(7);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                    <Text style={styles.modalTitle}>Advanced Scoring</Text>
                    <Text>Select unusual runs:</Text>
                    <Picker selectedValue={runs} onValueChange={(val) => setRuns(val)}>
                        <Picker.Item label="7" value={7} />
                        <Picker.Item label="8" value={8} />
                        <Picker.Item label="9" value={9} />
                        <Picker.Item label="10" value={10} />
                        <Picker.Item label="12" value={12} />
                        <Picker.Item label="17" value={17} />
                    </Picker>
                    <View style={{ flexDirection: 'row', marginTop: 10 }}>
                        <Pressable style={styles.closeBtn} onPress={handleOk}>
                            <Text style={{ color: '#fff' }}>Confirm</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.closeBtn, { backgroundColor: '#666', marginLeft: 10 }]}
                            onPress={onClose}
                        >
                            <Text style={{ color: '#fff' }}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 10,
    },
    heading: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1B5E20',
        marginVertical: 5,
    },
    subHeading: {
        fontSize: 14,
        marginVertical: 2,
    },
    scoreHeader: {
        backgroundColor: '#2E7D32',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    scoreText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    oversText: {
        fontSize: 16,
        color: '#fff',
    },
    crrLabel: {
        fontSize: 14,
        color: '#fff',
        marginTop: 4,
    },
    label: {
        fontSize: 16,
        marginTop: 10,
        marginBottom: 5,
        fontWeight: '600',
    },
    extrasRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginVertical: 5,
    },
    wicketBox: {
        backgroundColor: '#fff',
        padding: 8,
        marginVertical: 8,
        borderRadius: 6,
    },
    runRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginVertical: 10,
    },
    runButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 5,
    },
    runButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    actionRow: {
        flexDirection: 'row',
        marginVertical: 10,
    },
    actionBtn: {
        borderWidth: 1,
        padding: 6,
        borderRadius: 4,
        marginRight: 10,
    },
    retireBtn: {
        marginLeft: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'red',
        borderRadius: 6,
    },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
    },
    modalBox: {
        backgroundColor: '#fff',
        margin: 20,
        padding: 16,
        borderRadius: 8,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    closeBtn: {
        backgroundColor: '#2E7D32',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    noDataText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        padding: 8
    },
    playerRow: {
        marginVertical: 4,
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    }
});