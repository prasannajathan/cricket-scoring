import React, { useState } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { editPlayerName } from '@/store/cricket/scoreboardSlice';

interface Props {
  team: 'teamA' | 'teamB';
  playerId: string;
  initialName: string;
}

const PlayerNameInput: React.FC<Props> = ({ team, playerId, initialName }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState(initialName);

  const handleBlur = () => {
    dispatch(editPlayerName({ team, playerId, newName: name }));
  };

  return (
    <TextInput
      style={styles.input}
      value={name}
      onChangeText={setName}
      onBlur={handleBlur}
    />
  );
};

export default PlayerNameInput;

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 5,
    borderRadius: 4,
    marginBottom: 5,
  },
});