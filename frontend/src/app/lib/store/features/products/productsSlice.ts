import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface IProduct {
  id: number;
  title: string;
  description: string;
  status: boolean;
  price: number;
  create_at: string; 
  update_at: string;
  delete_at: string | null;
}

interface ProductState {
  products: IProduct[];
  loading: boolean;
  error: string | null;
  currentProduct: IProduct | null;
  lastFetch: string | null;
}

const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
  currentProduct: null,
  lastFetch: null,
};

export const fetchAllProducts = createAsyncThunk(
  "products/fetchAllStatus",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<IProduct[]>(
        `http://localhost:4000/api/v1/product`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message);
      }
      return rejectWithValue("Error desconocido al cargar productos");
    }
  }
);

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setProducts: (state, action: PayloadAction<IProduct[]>) => {
      state.products = action.payload;
      state.lastFetch = new Date().toISOString();
    },
    addProduct: (state, action: PayloadAction<IProduct>) => {
      state.products.unshift(action.payload); 
    },
    clearProducts: (state) => {
      state.products = [];
      state.lastFetch = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
        state.lastFetch = new Date().toISOString();
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setProducts, addProduct, clearProducts } = productSlice.actions;
export default productSlice.reducer;
