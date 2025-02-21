import { configureStore } from '@reduxjs/toolkit';
import scoreboardReducer from './cricket/scoreboardSlice';
import { scoreboardMiddleware } from './scoreboardMiddleware';

const store = configureStore({
    reducer: {
        scoreboard: scoreboardReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['cricket/loadSavedMatch'],
            },
        }).concat(scoreboardMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;