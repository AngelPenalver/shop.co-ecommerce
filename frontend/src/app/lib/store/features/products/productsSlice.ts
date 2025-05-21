import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import apiClient from "../../../apiClient";

interface FindAllProductsParams {
  page?: number;
  limit?: number;
  filterBy?: string;
  sortOrder?: "ASC" | "DESC";
  search?: string;
}

interface PaginatedProductsResponse {
  data: IProduct[];
  count: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export interface IProduct {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  stock: number;
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
  showModal: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
  currentProduct: null,
  showModal: false,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  limit: 10,
};

export const fetchAllProducts = createAsyncThunk(
  "products/fetchAll",
  async (params: FindAllProductsParams = {}, { rejectWithValue }) => {
    const {
      page = initialState.currentPage,
      limit = initialState.limit,
      filterBy,
      sortOrder,
      search,
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append("page", String(page));
    queryParams.append("limit", String(limit));
    if (filterBy) {
      queryParams.append("filterBy", filterBy);
    }
    if (sortOrder) {
      queryParams.append("sortOrder", sortOrder);
    }
    if (search) {
      queryParams.append("search", search);
    }

    try {
      const response = await apiClient.get<PaginatedProductsResponse>(
        `/product?${queryParams.toString()}`
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
  async (id: number | string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<IProduct>(`/product/${id}`); // O '/product/'
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
    addProduct: (state, action: PayloadAction<IProduct>) => {
      state.products.unshift(action.payload);
      state.totalCount += 1;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    setModalLoading: (state, action: PayloadAction<boolean>) => {
      state.showModal = action.payload;
    },
    setCurrentProduct: (state, action: PayloadAction<IProduct | null>) => {
      state.currentProduct = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllProducts.fulfilled,
        (state, action: PayloadAction<PaginatedProductsResponse>) => {
          state.loading = false;
          state.products = action.payload.data;
          state.currentPage = action.payload.currentPage;
          state.totalPages = action.payload.totalPages;
          state.totalCount = action.payload.count;
          state.limit = action.payload.limit;
        }
      )
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentProduct = null;
      })
      .addCase(
        fetchProductById.fulfilled,
        (state, action: PayloadAction<IProduct>) => {
          state.loading = false;
          state.currentProduct = action.payload;
        }
      )
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addProduct,
  clearCurrentProduct,
  setCurrentProduct,
  setModalLoading,
  setCurrentPage,
} = productSlice.actions;
export default productSlice.reducer;
