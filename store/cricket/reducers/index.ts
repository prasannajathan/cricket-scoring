import { matchSetupReducers } from './matchSetup';
import { scoringReducers } from './scoring';
import { inningsReducers } from './innings';
import { playerReducers } from './players';

export const reducers = {
    ...matchSetupReducers,
    ...scoringReducers,
    ...inningsReducers,
    ...playerReducers
};