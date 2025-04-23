import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

export interface IProduct {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  stock: number;
  status: boolean;
  price: string;
  image: string;
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
  showModal: boolean;
}

const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
  currentProduct: null,
  lastFetch: null,
  showModal: false,
};

export const fetchAllProducts = createAsyncThunk(
  "products/fetchAllStatus",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<IProduct[]>(
        `http://localhost:3001/api/v1/product`
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

export const fetchProductById = createAsyncThunk(
  "products/fetchProductById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.get<IProduct>(
        `http://localhost:3001/api/v1/product/${id}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message);
      }
      return rejectWithValue("Error desconocido al cargar producto");
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
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    setModalLoading: (state, action) => {
      state.showModal = action.payload;
    },
    setCurrentProduct: (state, action: PayloadAction<IProduct>) => {
      state.currentProduct = action.payload;
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
      })
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setProducts,
  addProduct,
  clearProducts,
  clearCurrentProduct,
  setCurrentProduct,
  setModalLoading,
} = productSlice.actions;
export default productSlice.reducer;
