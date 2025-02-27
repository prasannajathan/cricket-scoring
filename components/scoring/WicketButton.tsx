import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface WicketButtonProps {
    wicket: boolean;
    setWicket: (value: boolean) => void;
    disabled?: boolean;
}

export default function WicketButton({ wicket, setWicket, disabled = false }: WicketButtonProps) {
    return (
        <TouchableOpacity
            style={[
                styles.wicketButton,
                wicket ? styles.wicketActiveButton : null,
                disabled ? styles.disabledButton : null
            ]}
            onPress={() => setWicket(!wicket)}
            disabled={disabled}
        >
            <Text style={[
                styles.wicketButtonText,
                wicket ? styles.wicketActiveText : null,
                disabled ? styles.disabledText : null
            ]}>
                W
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    wicketButton: {
        flex: 1,
        backgroundColor: 'white',
        borderColor: '#D32F2F',
        borderWidth: 2,
        padding: 16,
        margin: 4,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    wicketActiveButton: {
        backgroundColor: '#D32F2F',
    },
    wicketButtonText: {
        color: '#D32F2F',
        fontSize: 20,
        fontWeight: 'bold',
    },
    wicketActiveText: {
        color: 'white',
    },
    disabledButton: {
        backgroundColor: '#E0E0E0',
        borderColor: '#9E9E9E',
    },
    disabledText: {
        color: '#9E9E9E',
    }
});