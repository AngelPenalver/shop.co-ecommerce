import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../../apiClient";
import axios from "axios";
interface OrderProduct {
  id: number;
  name: string;
  subtitle: string | null;
  description: string;
  stock: number;
  price: string;
  image: string;
  create_at: string | Date;
  update_at: string | Date;
  delete_at: string | Date | null;
}

interface OrderUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  create_at: string | Date;
  update_at: string | Date;
  delete_at: string | Date | null;
}

interface OrderLineItem {
  id: number;
  product: OrderProduct;
  quantity: number;
  unitPrice: string;
}

export interface Order {
  id: string;
  user: OrderUser;
  orderDate: string | Date;
  totalAmount: number;
  orderStatus:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | null;
  paymentStatus: "pending" | "completed" | "failed" | "refunded" | null;
  items: OrderLineItem[];
  subtotal: string;
  paymentMethod: string | null;
  sessionId: string;
}

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
}
const initialState: OrderState = {
  currentOrder: null,
  orders: [],
  loading: false,
  error: null,
};

export const createOrder = createAsyncThunk(
  "order/create",
  async (
    orderData: {
      userId: string;
      addressId: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post(`/order/create`, {
        addressId: orderData.addressId,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message);
      }
      return rejectWithValue("Error desconocido al cargar las órdenes");
    }
  }
);

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.orders = action.payload;
    },
    clearOrders: (state) => {
      state.orders = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearOrders, setOrders } = orderSlice.actions;
export default orderSlice.reducer;
