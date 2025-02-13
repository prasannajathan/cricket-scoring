// ScoringScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Modal } from 'react-native';
// For CheckBox, you can use a custom library or <Switch> from RN. 
// We'll assume a cross-platform CheckBox is available, or you create your own.

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import {
    addRuns,
    dotBall,
    recordWicket,
    retireBatsman,
    swapBatsman,
    addExtra,
    selectNewBowler
} from '@/store/matchSlice';
import { useNavigation } from '@react-navigation/native';

export default function ScoringScreen() {
    const dispatch = useDispatch();
    const navigation = useNavigation();

    // Pull scoreboard state from Redux
    const {
        battingTeam,
        bowlingTeam,
        score,
        wickets,
        oversBowled,
        runRate,
        batters,
        strikerIndex,
        nonStrikerIndex,
        bowler,
        bowlerChangeNeeded,
        previousBowler,
        availableBowlers,
    } = useSelector((state: RootState) => state.match);

    // For checkboxes: wide, noBall, byes, legByes
    const [isWide, setIsWide] = React.useState(false);
    const [noBall, setNoBall] = React.useState(false);
    const [byes, setByes] = React.useState(false);
    const [legByes, setLegByes] = React.useState(false);
    // Show/hide modal if bowlerChangeNeeded
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        if (bowlerChangeNeeded) {
            setModalVisible(true);
        }
    }, [bowlerChangeNeeded]);

    const handleRunPress = (runs: number) => {
        // Check if it’s an extra
        if (isWide || noBall) {
            // e.g., wide/no-ball => add run(s) to extras, DO NOT increment ball
            dispatch(addExtra(runs));
        } else {
            // normal ball => runs credited to striker
            if (runs === 0) {
                dispatch(dotBall());
            } else {
                dispatch(addRuns(runs));
            }
        }

        // If byes or legByes is selected, real logic might differ 
        // (runs go to the total but not to the batsman).
        // For demonstration, let's say addExtra(runs) but do increment ball:
        // You can implement that logic if needed.

        // Reset checkboxes if you prefer
        setIsWide(false);
        setNoBall(false);
        setByes(false);
        setLegByes(false);
    };

    const handleWicket = () => {
        dispatch(recordWicket({ type: 'bowled' }));
        // Alternatively, 'caught', 'runOut', etc. for your logic
    };

    const handleRetire = () => {
        dispatch(retireBatsman());
    };

    const handleSwap = () => {
        dispatch(swapBatsman());
    };

    const handleUndo = () => {
        // You’d have to implement an “undo” action that reverses the last ball
        // e.g., storing a history stack. For now, we’ll just do a placeholder.
        alert('Undo not implemented yet!');
    };

    const handleBowlerSelect = (bowlerName: string) => {
        // Dispatch action to set new bowler
        dispatch(selectNewBowler(bowlerName));
        setModalVisible(false);
    };

    // Filter out the previous bowler
    const bowlersToShow = availableBowlers.filter(b => b !== previousBowler);

    return (
        <ScrollView style={styles.container}>
            {/* Header area */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{ color: '#fff' }}>{'< Back'}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{battingTeam} v/s {bowlingTeam}</Text>
                {/* Right side icon, e.g. stats */}
                <TouchableOpacity onPress={() => { /* go to stats maybe */ }}>
                    <Text style={{ color: '#fff' }}>Stats</Text>
                </TouchableOpacity>
            </View>

            {/* Score summary */}
            <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>
                    {battingTeam}, 1st inning
                    {'\n'}
                    {score} - {wickets} ({oversBowled})  (RR {runRate.toFixed(2)})
                </Text>
            </View>

            {/* Batsmen info */}
            <View style={styles.batterRow}>
                <Text style={styles.batterLabel}>
                    {batters[strikerIndex]?.name || 'Striker'}
                    {' '}({batters[strikerIndex]?.runs}/{batters[strikerIndex]?.balls})
                </Text>
                <Text style={styles.batterLabel}>
                    {batters[nonStrikerIndex]?.name || 'Non-striker'}
                    {' '}({batters[nonStrikerIndex]?.runs}/{batters[nonStrikerIndex]?.balls})
                </Text>
                <Text style={styles.batterLabel}>
                    Bowler: {bowler.name} ({bowler.overs.toFixed(1)} - {bowler.runs} / {bowler.wickets})
                </Text>
            </View>

            {/* This over: checkboxes */}
            <View style={styles.checkBoxRow}>
                <View style={styles.checkBoxItem}>
                    <Switch
                        value={isWide}
                        onValueChange={setIsWide}
                    />
                    <Text>Wide</Text>
                </View>
                <View style={styles.checkBoxItem}>
                    <Switch value={noBall} onValueChange={setNoBall} />
                    <Text>No Ball</Text>
                </View>
                <View style={styles.checkBoxItem}>
                    <Switch value={byes} onValueChange={setByes} />
                    <Text>Byes</Text>
                </View>
                <View style={styles.checkBoxItem}>
                    <Switch value={legByes} onValueChange={setLegByes} />
                    <Text>Leg Byes</Text>
                </View>
            </View>

            {/* Retire / Wicket / Swap Batsman */}
            <View style={styles.row}>
                <TouchableOpacity style={styles.actionButton} onPress={handleWicket}>
                    <Text style={styles.actionButtonText}>Wicket</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleRetire}>
                    <Text style={styles.actionButtonText}>Retire</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleSwap}>
                    <Text style={styles.actionButtonText}>Swap Batsman</Text>
                </TouchableOpacity>
            </View>

            {/* Undo, Partnerships, Extras (custom screens, optional) */}
            <View style={styles.row}>
                <TouchableOpacity style={styles.actionButton} onPress={handleUndo}>
                    <Text style={styles.actionButtonText}>Undo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Partnerships</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Extras</Text>
                </TouchableOpacity>
            </View>

            {/* Runs: 0 1 2 3 4 5 6 ... */}
            <View style={styles.runRow}>
                {[0, 1, 2, 3, 4, 5, 6].map((runValue) => (
                    <TouchableOpacity
                        key={runValue}
                        style={styles.runButton}
                        onPress={() => handleRunPress(runValue)}
                    >
                        <Text style={styles.runButtonText}>{runValue}</Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.runButton}>
                    <Text style={styles.runButtonText}>{'...'}</Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center' }}>
                    <View style={{ backgroundColor: '#fff', margin: 20, borderRadius: 8, padding: 16 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
                            Select Next Bowler
                        </Text>

                        {bowlersToShow.map((bowler) => (
                            <TouchableOpacity
                                key={bowler}
                                onPress={() => handleBowlerSelect(bowler)}
                                style={{ padding: 10 }}
                            >
                                <Text style={{ fontSize: 16 }}>{bowler}</Text>
                            </TouchableOpacity>
                        ))}

                        {bowlersToShow.length === 0 && (
                            <Text>No alternative bowlers available!</Text>
                        )}
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

// Basic styling
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F3F5' },
    header: {
        flexDirection: 'row',
        backgroundColor: '#2E7D32',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 14,
    },
    headerTitle: { fontSize: 18, color: '#FFF', fontWeight: '600' },
    scoreContainer: {
        backgroundColor: '#FFFFFF',
        margin: 12,
        padding: 12,
        borderRadius: 8,
    },
    scoreText: {
        fontSize: 18,
        color: '#333',
    },
    batterRow: {
        backgroundColor: '#FFF',
        marginHorizontal: 12,
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    batterLabel: {
        color: '#2E7D32',
        fontSize: 16,
        marginBottom: 4,
    },
    checkBoxRow: {
        flexDirection: 'row',
        marginHorizontal: 12,
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 8,
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    checkBoxItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        marginHorizontal: 12,
        marginBottom: 8,
        justifyContent: 'space-around',
    },
    actionButton: {
        backgroundColor: '#2E7D32',
        paddingHorizontal: 10,
        paddingVertical: 12,
        borderRadius: 6,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    runRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: 12,
        marginBottom: 24,
        justifyContent: 'space-around',
    },
    runButton: {
        width: 50,
        height: 50,
        borderColor: '#2E7D32',
        borderWidth: 2,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 6,
    },
    runButtonText: {
        fontSize: 18,
        color: '#2E7D32',
        fontWeight: 'bold',
    },
});