import { configureStore } from '@reduxjs/toolkit';
import scoreboardReducer from '@/store/scoreboardSlice';

const store = configureStore({
  reducer: {
    scoreboard: scoreboardReducer,
  },
});

export default store;

// Infer the `RootState` and `AppDispatch` from the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;