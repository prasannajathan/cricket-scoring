// src/hooks/useInningsStatus.ts
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { ScoreboardState, InningsData, Team } from '@/types';

interface UseInningsStatusParams {
  state: ScoreboardState;
  currentInnings: InningsData | null;
  battingTeam: Team;
  showEndInningsModal: boolean;
  setShowEndInningsModal: (value: boolean) => void;
  debugInningsStatus: () => void;
}

/**
 * This hook encapsulates the large "innings check" logic previously in ScoringScreen.
 */
export function useInningsStatus({
  state,
  currentInnings,
  battingTeam,
  showEndInningsModal,
  setShowEndInningsModal,
  debugInningsStatus
}: UseInningsStatusParams) {
  const dispatch = useDispatch();
  const isNavigating = useRef(false);

  useEffect(() => {
    if (!currentInnings) return; // no innings, do nothing

    const checkInningsStatus = () => {
      debugInningsStatus();

      // 1) If match is over, close any modals
      if (state.matchOver) {
        if (showEndInningsModal) {
          setShowEndInningsModal(false);
        }
        return;
      }

      // 2) If it's second innings and completed, do nothing else
      if (state.currentInning === 2 && currentInnings.isCompleted) {
        return;
      }

      // 3) If it's first innings, ready to transition, and no modals showing
      if (
        state.currentInning === 1 &&
        currentInnings.readyForInnings2 &&
        !showEndInningsModal &&
        !isNavigating.current
      ) {
        // Show your EndInningsModal or navigate
        setShowEndInningsModal(true);
        return;
      }

      // 4) Check if first innings is all out or overs done
      if (
        state.currentInning === 1 &&
        currentInnings.battingTeamId &&
        currentInnings.currentStrikerId
      ) {
        const allOut = currentInnings.wickets >= state.totalPlayers - 1;
        const oversComplete = currentInnings.completedOvers >= state.totalOvers;

        if ((allOut || oversComplete) && !currentInnings.readyForInnings2) {
          // Dispatch an action to mark innings complete
          dispatch({ type: 'scoreboard/checkInningsCompletion' });
        }
      }
    };

    const timer = setTimeout(checkInningsStatus, 150);
    return () => clearTimeout(timer);
  }, [
    currentInnings,
    state.matchOver,
    state.currentInning,
    currentInnings?.isCompleted,
    currentInnings?.readyForInnings2,
    currentInnings?.wickets,
    currentInnings?.completedOvers
  ]);
}