// app/ScoringScreen.tsx 
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
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';

import { RootState } from '@/store';
import {
    scoreBall,
    undoLastBall,
    swapBatsman,
    retireBatsman,
    addExtraRuns,
    endInnings,
    setBowler,
} from '@/store/scoreboardSlice';
import { Cricketer } from '@/types';

import BatsmanRow from '@/components/BatsmanRow';
import BowlerRow from '@/components/BowlerRow';

import { computeCRR } from '@/utils';
type WicketType = 'bowled' | 'caught' | 'runout' | 'lbw' | 'stumped' | 'hitWicket' | 'retired' | 'other';

export default function ScoringScreen() {
    const router = useRouter();
    const dispatch = useDispatch();
    const {
        teamA,
        teamB,
        currentInning,
        totalOvers,
        targetScore,
        matchResult,
        matchOver,
    } = useSelector((state: RootState) => state.scoreboard);

    const MemoizedBatsmanRow = memo(BatsmanRow);
    const MemoizedBowlerRow = memo(BowlerRow);

    // Determine which team is batting & bowling
    const battingTeam = teamA.batting ? teamA : teamB;
    const bowlingTeam = teamA.batting ? teamB : teamA;

    // Extras/wicket toggles
    const [wide, setWide] = useState(false);
    const [noBall, setNoBall] = useState(false);
    const [bye, setBye] = useState(false);
    const [legBye, setLegBye] = useState(false);
    const [wicket, setWicket] = useState(false);

    // Wicket detail
    const [wicketType, setWicketType] = useState<WicketType>('bowled');
    const [outBatsmanId, setOutBatsmanId] = useState<string | undefined>(undefined);

    // Partnerships modal
    const [showPartnershipModal, setShowPartnershipModal] = useState(false);
    // PARTNERSHIP
    const currentPartnership = battingTeam.currentPartnership || 0; // ----

    // Extras modal (penalties)
    const [showExtrasModal, setShowExtrasModal] = useState(false);
    // TODO: Add penalty runs to state
    const [penaltyRuns, setPenaltyRuns] = useState(0);

    // Advanced scoring modal
    const [showAdvancedModal, setShowAdvancedModal] = useState(false);

    // Next Batsman modal
    const [showNextBatsmanModal, setShowNextBatsmanModal] = useState(false);
    const [nextBatsmanId, setNextBatsmanId] = useState<string>('');

    // If user tries to score but match is over
    const canScore = !matchOver;
    // Check if first/second innings is done
    useEffect(() => {
        if (matchOver) return;

        // In a T20 scenario: if we exceed totalOvers or 10 wickets => endInnings
        if (
            (battingTeam.completedOvers >= totalOvers) ||
            (battingTeam.wickets >= 10 && !matchOver)
        ) {
            dispatch(endInnings());
            router.push('/openingPlayers?innings=2');
        }
    }, [
        battingTeam.completedOvers,
        battingTeam.wickets,
        totalOvers,
        matchOver,
        dispatch,
    ]);

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
            alert('Please select a bowler first!');
            return;
        }
        if (!canScore) return;

        let extraType: 'wide' | 'no-ball' | 'bye' | 'leg-bye' | undefined;
        if (wide) extraType = 'wide';
        else if (noBall) extraType = 'no-ball';
        else if (bye) extraType = 'bye';
        else if (legBye) extraType = 'leg-bye';

        dispatch(
            scoreBall({
                runs: runValue,
                extraType,
                wicket,
                wicketType: wicket ? wicketType : undefined,
                outBatsmanId: wicket ? outBatsmanId : undefined,
            })
        );

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

    // Manually finish innings
    const handleFinishInningsManually = () => {
        if (!matchOver) {
            dispatch(endInnings());
        }
    };

    return (
        <ScrollView style={styles.container}>
            {/* Match result? */}
            {matchResult && (
                <Text style={{ fontSize: 16, color: 'red', marginBottom: 6 }}>{matchResult}</Text>
            )}
            {/* Score display */}
            <View style={styles.scoreHeader}>
                <Text style={styles.scoreText}>
                    {battingTeam.teamName} {battingTeam.totalRuns} - {battingTeam.wickets}
                </Text>
                <Text style={styles.oversText}>
                    ({battingTeam.completedOvers}.{battingTeam.ballInCurrentOver} overs) | Inning: {currentInning}
                </Text>
                <Text style={styles.crrLabel}>
                    CRR: {computeCRR(battingTeam.totalRuns, battingTeam.completedOvers, battingTeam.ballInCurrentOver)}
                </Text>
            </View>

            {/* Batsmen */}
            <Text style={styles.label}>Batsmen on Crease:</Text>
            {battingTeam.players
                .filter((p) => !p.isOut)
                .slice(0, 2)
                .map((p) => (
                    <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MemoizedBatsmanRow key={p.id} player={p} />
                        <TouchableOpacity
                            style={styles.retireBtn}
                            onPress={() => dispatch(retireBatsman({ team: teamA.batting ? 'teamA' : 'teamB', batsmanId: p.id }))}
                        >
                            <Text style={{ color: 'red' }}>Retire</Text>
                        </TouchableOpacity>
                    </View>
                ))}

            {/* Bowler */}
            <Text style={styles.label}>Current Bowler:</Text>
            {bowlingTeam.currentBowlerId ? (
                <MemoizedBowlerRow
                    bowler={bowlingTeam.players.find((pl) => pl.id === bowlingTeam.currentBowlerId)!}
                />
            ) : (
                <Text>No current bowler selected</Text>
            )}

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

            {/* Finish innings */}
            <Button title="Finish Innings" onPress={handleFinishInningsManually} />
        </ScrollView>
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
});