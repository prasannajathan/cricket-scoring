// src/hooks/useScoringState.ts
import { useState } from 'react';

export function useScoringState() {
  const [scoringState, setScoringState] = useState({
    wide: false,
    noBall: false,
    bye: false,
    legBye: false,
    wicket: false,
    tempRuns: 0
  });

  function resetExtras() {
    setScoringState(prev => ({
      ...prev,
      wide: false,
      noBall: false,
      bye: false,
      legBye: false
    }));
  }

  function resetAll() {
    setScoringState({
      wide: false,
      noBall: false,
      bye: false,
      legBye: false,
      wicket: false,
      tempRuns: 0
    });
  }

  return { scoringState, setScoringState, resetExtras, resetAll };
}