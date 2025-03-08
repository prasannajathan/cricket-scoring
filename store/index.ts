import { configureStore } from '@reduxjs/toolkit';
import scoreboardReducer, { loadSavedMatch } from './cricket/scoreboardSlice';
import { scoreboardMiddleware } from './scoreboardMiddleware';

const store = configureStore({
    reducer: {
        scoreboard: scoreboardReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Use the actual action type instead of a hardcoded string
                ignoredActions: [loadSavedMatch.type],
            },
        }).concat(scoreboardMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;