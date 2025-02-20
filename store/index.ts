import { configureStore } from '@reduxjs/toolkit';
import scoreboardReducer from '@/store/scoreboardSlice';
import { scoreboardMiddleware } from '@/store/scoreboardMiddleware';

const store = configureStore({
  reducer: {
    scoreboard: scoreboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // disable or tweak the checks that cause slowdown
      // immutableCheck: false,
      // serializableCheck: false,
    }).concat(scoreboardMiddleware),
});

export default store;

// Infer the `RootState` and `AppDispatch` from the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;