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

// Interface para la información de un Usuario (simplificada)
interface OrderUser {
  id: string; // Parece UUID
  first_name: string;
  last_name: string;
  email: string;
  // Omitimos la contraseña por seguridad al exponer datos
  // password?: string;
  create_at: string | Date;
  update_at: string | Date;
  delete_at: string | Date | null;
}

// Interface para un Item dentro de la Orden
interface OrderLineItem {
  id: number;
  product: OrderProduct;
  quantity: number;
  unitPrice: string;
}

// Interface para una Orden individual
interface Order {
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
  transactionId: string | null;
}

interface OrderState {
  orders: Order[]; // Array de órdenes
  orderDetails: Order | null; // Detalles de una orden específica
  loading: boolean; // Estado de carga
  error: string | null; // Mensaje de error
}
const initialState: OrderState = {
  orderDetails: null,
  orders: [],
  loading: false,
  error: null,
};

export const fecthAllOrders = createAsyncThunk(
  "orders/fetchAllOrders",
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/order/${userId}`);
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
      .addCase(fecthAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fecthAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fecthAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearOrders, setOrders } = orderSlice.actions;
export default orderSlice.reducer;
