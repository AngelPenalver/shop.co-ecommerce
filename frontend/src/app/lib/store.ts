import { configureStore } from "@reduxjs/toolkit";
import productSlice from "./store/features/products/productsSlice";
import cartSlice from "./store/features/cart/cartSlice";
import userSlice from "./store/features/user/userSlice";
import alertSlice from "./store/features/alert/alertSlice";
import orderSlice from "./store/features/orders/ordersSlice";
import addressSlice from "./store/features/address/addressSlice";
import locationSlice from "./store/features/location/locationSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      productSlice,
      cartSlice,
      userSlice,
      alertSlice,
      orderSlice,
      addressSlice,
      locationSlice,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;

export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
