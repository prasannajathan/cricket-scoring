import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Team } from '@/types';

interface WicketPanelProps {
    wicketType: string;
    setWicketType: (type: string) => void;
    outBatsmanId: string | undefined;
    setOutBatsmanId: (id: string) => void;
    battingTeam: Team;
}

export default function WicketPanel({
    wicketType,
    setWicketType,
    outBatsmanId,
    setOutBatsmanId,
    battingTeam
}: WicketPanelProps) {
    const wicketTypes = [
        'bowled',
        'caught',
        'lbw',
        'run out',
        'stumped',
        'hit wicket',
        'retired hurt'
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Wicket</Text>
            <View style={styles.row}>
                <Text style={styles.label}>Type:</Text>
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
            <View style={styles.row}>
                <Text style={styles.label}>Out Batsman:</Text>
                <Picker
                    selectedValue={outBatsmanId}
                    onValueChange={setOutBatsmanId}
                    style={styles.picker}
                >
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
        fontSize: 16,
        fontWeight: 'bold',
        color: '#D32F2F',
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        width: 100,
        fontSize: 14,
        fontWeight: '500',
    },
    picker: {
        flex: 1,
        height: 40,
    }
});