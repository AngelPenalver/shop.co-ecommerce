import { configureStore } from "@reduxjs/toolkit";
import productSlice from './store/features/products/productsSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {productSlice},
  });
};

export type AppStore = ReturnType<typeof makeStore>;

export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
