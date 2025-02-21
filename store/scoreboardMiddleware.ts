// store/scoreboardMiddleware.ts
import { scoreBall, endInnings, resetGame } from '@/store/scoreboardSlice';
import { saveMatch } from '@/utils/saveMatchStorage';
import { RootState } from '@/store';

export const scoreboardMiddleware = (store: any) => (next: any) => (action: any) => {
  const result = next(action);

  // Check for actions you want to trigger a save
  if ([scoreBall.type, endInnings.type, resetGame.type].includes(action.type)) {
    const state: RootState = store.getState();
    if (state.scoreboard.id) {
      saveMatch({
        ...state.scoreboard,
        id: state.scoreboard.id,
        name: '',
        completed: state.scoreboard.matchOver
      });
    }
  }

  return result;
};