import { configureStore } from '@reduxjs/toolkit';
import matchSlice from '@/store/matchSlice';

const store = configureStore({
  reducer: {
    match: matchSlice,
  },
});

export default store;

// We will use these types for TypeScript convenience
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;