### 1. Create Separate Components

#### Header.tsx
```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const Header = ({ battingTeam, bowlingTeam, onBackPress }) => {
    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={onBackPress}>
                <Text style={{ color: '#fff' }}>{'< Back'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{battingTeam} v/s {bowlingTeam}</Text>
            <TouchableOpacity onPress={() => { /* go to stats maybe */ }}>
                <Text style={{ color: '#fff' }}>Stats</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        backgroundColor: '#2E7D32',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 14,
    },
    headerTitle: { fontSize: 18, color: '#FFF', fontWeight: '600' },
});

export default Header;
```

#### ScoreSummary.tsx
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ScoreSummary = ({ battingTeam, score, wickets, oversBowled, runRate }) => {
    return (
        <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>
                {battingTeam}, 1st inning
                {'\n'}
                {score} - {wickets} ({oversBowled})  (RR {runRate.toFixed(2)})
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
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
});

export default ScoreSummary;
```

#### BatsmenInfo.tsx
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BatsmenInfo = ({ striker, nonStriker, bowler }) => {
    return (
        <View style={styles.batterRow}>
            <Text style={styles.batterLabel}>
                {striker.name || 'Striker'} ({striker.runs}/{striker.balls})
            </Text>
            <Text style={styles.batterLabel}>
                {nonStriker.name || 'Non-striker'} ({nonStriker.runs}/{nonStriker.balls})
            </Text>
            <Text style={styles.batterLabel}>
                Bowler: {bowler.name} ({bowler.overs.toFixed(1)} - {bowler.runs} / {bowler.wickets})
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
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
});

export default BatsmenInfo;
```

#### CheckBoxRow.tsx
```tsx
import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

const CheckBoxRow = ({ isWide, setIsWide, noBall, setNoBall, byes, setByes, legByes, setLegByes }) => {
    return (
        <View style={styles.checkBoxRow}>
            <View style={styles.checkBoxItem}>
                <Switch value={isWide} onValueChange={setIsWide} />
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
    );
};

const styles = StyleSheet.create({
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
});

export default CheckBoxRow;
```

#### ActionButtons.tsx
```tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const ActionButtons = ({ onWicket, onRetire, onSwap, onUndo }) => {
    return (
        <View style={styles.row}>
            <TouchableOpacity style={styles.actionButton} onPress={onWicket}>
                <Text style={styles.actionButtonText}>Wicket</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onRetire}>
                <Text style={styles.actionButtonText}>Retire</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onSwap}>
                <Text style={styles.actionButtonText}>Swap Batsman</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onUndo}>
                <Text style={styles.actionButtonText}>Undo</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
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
});

export default ActionButtons;
```

#### RunButtons.tsx
```tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const RunButtons = ({ onRunPress }) => {
    return (
        <View style={styles.runRow}>
            {[0, 1, 2, 3, 4, 5, 6].map((runValue) => (
                <TouchableOpacity
                    key={runValue}
                    style={styles.runButton}
                    onPress={() => onRunPress(runValue)}
                >
                    <Text style={styles.runButtonText}>{runValue}</Text>
                </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.runButton}>
                <Text style={styles.runButtonText}>{'...'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
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

export default RunButtons;
```

#### BowlerModal.tsx
```tsx
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';

const BowlerModal = ({ visible, bowlers, onBowlerSelect, onClose }) => {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Select Next Bowler</Text>
                    {bowlers.map((bowler) => (
                        <TouchableOpacity
                            key={bowler}
                            onPress={() => {
                                onBowlerSelect(bowler);
                                onClose();
                            }}
                            style={styles.bowlerOption}
                        >
                            <Text style={styles.bowlerText}>{bowler}</Text>
                        </TouchableOpacity>
                    ))}
                    {bowlers.length === 0 && (
                        <Text>No alternative bowlers available!</Text>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 8,
        padding: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    bowlerOption: {
        padding: 10,
    },
    bowlerText: {
        fontSize: 16,
    },
});

export default BowlerModal;
```

### 2. Update ScoringScreen.tsx

Now, we can update the `ScoringScreen` to use these new components:

```tsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
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

import Header from './Header';
import ScoreSummary from './ScoreSummary';
import BatsmenInfo from './BatsmenInfo';
import CheckBoxRow from './CheckBoxRow';
import ActionButtons from './ActionButtons';
import RunButtons from './RunButtons';
import BowlerModal from './BowlerModal';

export default function ScoringScreen() {
    const dispatch = useDispatch();
    const navigation = useNavigation();

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

    const [isWide, setIsWide] = useState(false);
    const [noBall, setNoBall] = useState(false);
    const [byes, setByes] = useState(false);
    const [legByes, setLegByes] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        if (bowlerChangeNeeded) {
            setModalVisible(true);
        }
    }, [bowlerChangeNeeded]);

    const handleRunPress = (runs: number) => {
        if (isWide || noBall) {
            dispatch(addExtra(runs));
        } else {
            if (runs === 0) {
                dispatch(dotBall());
            } else {
                dispatch(addRuns(runs));
            }
        }
        setIsWide(false);
        setNoBall(false);
        setByes(false);
        setLegByes(false);
    };

    const handleWicket = () => {
        dispatch(recordWicket({ type: 'bowled' }));
    };

    const handleRetire = () => {
        dispatch(retireBatsman());
    };

    const handleSwap = () => {
        dispatch(swapBatsman());
    };

    const handleUndo = () => {
        alert('Undo not implemented yet!');
    };

    const handleBowlerSelect = (bowlerName: string) => {
        dispatch(selectNewBowler(bowlerName));
        setModalVisible(false);
    };

    const bowlersToShow = availableBowlers.filter(b => b !== previousBowler);

    return (
        <ScrollView style={styles.container}>
            <Header battingTeam={battingTeam} bowlingTeam={bowlingTeam} onBackPress={() => navigation.goBack()} />
            <ScoreSummary battingTeam={battingTeam} score={score} wickets={wickets} oversBowled={oversBowled} runRate={runRate} />
            <BatsmenInfo striker={batters[strikerIndex]} nonStriker={batters[nonStrikerIndex]} bowler={bowler} />
            <CheckBoxRow 
                isWide={isWide} setIsWide={setIsWide} 
                noBall={noBall} setNoBall={setNoBall} 
                byes={byes} setByes={setByes} 
                legByes={legByes} setLegByes={setLegByes} 
            />
            <ActionButtons 
                onWicket={handleWicket} 
                onRetire={handleRetire} 
                onSwap={handleSwap} 
                onUndo={handleUndo} 
            />
            <RunButtons onRunPress={handleRunPress} />
            <BowlerModal 
                visible={modalVisible} 
                bowlers={bowlersToShow} 
                onBowlerSelect={handleBowlerSelect} 
                onClose={() => setModalVisible(false)} 
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F3F5' },
});
```

### Summary of Improvements
- **Modularization**: The code is broken down into smaller components, making it easier to manage and understand.
- **Reusability**: Each component can be reused in different parts of the application if needed.
- **Readability**: The main `ScoringScreen` component is now cleaner and focuses on the overall structure rather than the implementation details of each part.
- **Maintainability**: Changes to specific parts of the UI can be made in their respective components without affecting the entire screen.

This modular approach will help you scale your application more effectively in the future.