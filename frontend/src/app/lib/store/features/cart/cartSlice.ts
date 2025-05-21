import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IProduct } from "../products/productsSlice";
import axios from "axios";
import apiClient from "../../../apiClient";

interface AddToCartBody {
  quantity: number;
  productId: number;
}

export interface CartItemInterface {
  id: number;
  quantity: number;
  product: IProduct;
}

interface Cart {
  id: number | string;
  total: number;
  items: CartItemInterface[];
}

interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  showModal: boolean;
  errorRemoveItem: string | null;
}

const initialState: CartState = {
  cart: null,
  loading: false,
  error: null,
  errorRemoveItem: null,
  showModal: false,
};

export const fetchCart = createAsyncThunk<
  Cart,
  string,
  { rejectValue: string }
>("cart/fetchCart", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<Cart>(`/carts/user`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
    return rejectWithValue("Unknown error when loading the cart");
  }
});

export const addProductToCart = createAsyncThunk(
  "cart/addProductToCart",
  async ({ quantity, productId }: AddToCartBody, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<Cart>(`/carts/user/items`, {
        quantity,
        productId,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message);
      }
      return rejectWithValue("Unknown error when loading the cart");
    }
  }
);

export const removeFromCartFetch = createAsyncThunk(
  "cart/removeFromCart",
  async ({ quantity, productId }: AddToCartBody, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<Cart>(`/carts/user/items/remove`, {
        quantity,
        productId,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message);
      }
      return rejectWithValue("Unknown error when loading the cart");
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCart: (state, action: PayloadAction<Cart>) => {
      state.cart = action.payload;
    },
    clearCart: (state) => {
      state.cart = null;
    },
    setModalAddToCart: (state, action) => {
      state.showModal = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.cart = action.payload;
        state.loading = false;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error al cargar el carrito";
      })
      .addCase(addProductToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProductToCart.fulfilled, (state, action) => {
        state.cart = action.payload;
        state.loading = false;
      })
      .addCase(addProductToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(removeFromCartFetch.pending, (state) => {
        state.loading = true;
        state.errorRemoveItem = null;
      })
      .addCase(removeFromCartFetch.fulfilled, (state, action) => {
        state.cart = action.payload;
        state.loading = false;
      })
      .addCase(removeFromCartFetch.rejected, (state, action) => {
        state.loading = false;
        state.errorRemoveItem = action.payload as string;
      });
  },
});

export const { setCart, clearCart, setModalAddToCart } = cartSlice.actions;
export default cartSlice.reducer;
