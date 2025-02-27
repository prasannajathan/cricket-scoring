import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Team } from '@/types';

interface WicketPanelProps {
    wicketType: string;
    setWicketType: (type: string) => void;
    outBatsmanId: string | undefined;
    setOutBatsmanId: (id: string) => void;
    battingTeam: Team;
    bowlingTeam: Team;
    onSelectNextBatsman?: (batsmanId: string) => void;
}

export default function WicketPanel({
    wicketType,
    setWicketType,
    outBatsmanId,
    setOutBatsmanId,
    battingTeam,
    bowlingTeam,
    onSelectNextBatsman
}: WicketPanelProps) {
    const [fielderName, setFielderName] = useState('');
    const [fielderId, setFielderId] = useState<string | undefined>(undefined);
    const [showNextBatsmanSelect, setShowNextBatsmanSelect] = useState(false);
    const [nextBatsmanId, setNextBatsmanId] = useState<string | undefined>(undefined);

    const wicketTypes = [
        'bowled',
        'caught',
        'lbw',
        'run out',
        'stumped',
        'hit wicket',
        'retired hurt'
    ];

    // Reset fielder info when wicket type changes
    useEffect(() => {
        setFielderName('');
        setFielderId(undefined);
    }, [wicketType]);

    // Show next batsman selection after selecting out batsman
    useEffect(() => {
        if (outBatsmanId) {
            setShowNextBatsmanSelect(true);
        }
    }, [outBatsmanId]);

    // Handle next batsman selection
    const handleSelectNextBatsman = () => {
        if (nextBatsmanId && onSelectNextBatsman) {
            onSelectNextBatsman(nextBatsmanId);
            setShowNextBatsmanSelect(false);
        }
    };

    const needsFielder = wicketType === 'caught' || wicketType === 'run out' || wicketType === 'stumped';

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Wicket</Text>
            
            <View style={styles.row}>
                <Text style={styles.label}>Type:</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={wicketType}
                        onValueChange={setWicketType}
                        style={styles.picker}
                    >
                        {wicketTypes.map(type => (
                            <Picker.Item key={type} label={type} value={type} />
                        ))}
                    </Picker>
                </View>
            </View>
            
            <View style={styles.row}>
                <Text style={styles.label}>Out Batsman:</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={outBatsmanId}
                        onValueChange={setOutBatsmanId}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select batsman" value="" />
                        {battingTeam.players
                            .filter(p => !p.isOut && !p.isRetired)
                            .map(player => (
                                <Picker.Item 
                                    key={player.id} 
                                    label={player.name} 
                                    value={player.id} 
                                />
                            ))}
                    </Picker>
                </View>
            </View>

            {needsFielder && (
                <View style={styles.row}>
                    <Text style={styles.label}>
                        {wicketType === 'caught' ? 'Caught by:' : 
                         wicketType === 'stumped' ? 'Stumped by:' : 'Run out by:'}
                    </Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={fielderId}
                            onValueChange={setFielderId}
                            style={styles.picker}
                        >
                            <Picker.Item label="Select fielder" value="" />
                            {bowlingTeam.players.map(player => (
                                <Picker.Item 
                                    key={player.id} 
                                    label={player.name} 
                                    value={player.id} 
                                />
                            ))}
                        </Picker>
                    </View>
                </View>
            )}
            
            {showNextBatsmanSelect && (
                <View style={styles.nextBatsmanContainer}>
                    <Text style={styles.subTitle}>Next Batsman</Text>
                    
                    <View style={styles.row}>
                        <Text style={styles.label}>Select:</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={nextBatsmanId}
                                onValueChange={setNextBatsmanId}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select next batsman" value="" />
                                {battingTeam.players
                                    .filter(p => !p.isOut && !p.isRetired && p.id !== outBatsmanId)
                                    .map(player => (
                                        <Picker.Item 
                                            key={player.id} 
                                            label={player.name} 
                                            value={player.id} 
                                        />
                                    ))}
                            </Picker>
                        </View>
                    </View>
                    
                    <TouchableOpacity 
                        style={[
                            styles.confirmButton,
                            !nextBatsmanId ? styles.disabledButton : null
                        ]}
                        onPress={handleSelectNextBatsman}
                        disabled={!nextBatsmanId}
                    >
                        <Text style={styles.confirmButtonText}>Confirm New Batsman</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#D32F2F',
        marginBottom: 12,
    },
    subTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 8,
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    label: {
        width: 100,
        fontSize: 14,
        fontWeight: '500',
    },
    pickerContainer: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    picker: {
        height: 40,
    },
    nextBatsmanContainer: {
        marginTop: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    confirmButton: {
        backgroundColor: '#1B5E20',
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
        marginTop: 8,
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#CCCCCC',
    }
});