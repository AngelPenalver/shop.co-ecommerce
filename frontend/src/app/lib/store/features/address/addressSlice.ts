import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "../../../apiClient"; // Asegúrate que la ruta sea correcta
import axios from "axios";

interface UserAddress {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  create_at: string; 
  update_at: string; 
  delete_at: string | null; 
}

interface Address {
  id: number;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  phone_number: string;
  user?: UserAddress; 
}

interface CreateAddressPayload {
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  phone_number: string;
}

interface CreateAddressData {
  address: CreateAddressPayload;
  userId: string;
}

interface InitialStateAddress {
  addresses: Address[];
  loading: boolean;
  error: string | null;
  showModal: boolean;
  currentAddress: Address | null;
}

const initialState: InitialStateAddress = {
  currentAddress: null,
  addresses: [],
  loading: false,
  error: null,
  showModal: false,
};


// Fetch all addresses for a user
export const fetchAllAddress = createAsyncThunk<
  Address[], 
  string, 
  { rejectValue: string } 
>("address/fetchAllAddress", async (userId, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<Address[]>(`address/user/${userId}`); 
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Error al cargar direcciones"
      );
    }
    return rejectWithValue("Error desconocido al cargar direcciones");
  }
});

// Fecth address by ID
export const fetchAddressById = createAsyncThunk<
  Address, 
  number, 
  { rejectValue: string } 
>("address/fetchAddressById", async (addressId, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<Address>(`address/${addressId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Error al cargar la dirección"
      );
    }
    return rejectWithValue("Error desconocido al cargar la dirección");
  }
});

// Create a new address for a user
export const createAddress = createAsyncThunk<
  Address, 
  CreateAddressData, 
  { rejectValue: string } 
>("address/createAddress", async (createAddressData, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<Address>(
      `/address/user/${createAddressData.userId}`, 
      createAddressData.address
    );
    return response.data; 
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Error al crear la dirección"
      );
    }
    return rejectWithValue("Error desconocido al crear la dirección");
  }
});

// --- Slice ---
const addressSlice = createSlice({
  name: "address",
  initialState,
  reducers: {
    setAddress(state, action: PayloadAction<Address[]>) {
      state.addresses = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    setModalAddress(state, action: PayloadAction<boolean>) {
      state.showModal = action.payload;
    },
    clearCurrentAddress(state) {
        state.currentAddress = null;
    }
  },
  extraReducers: (builder) =>
    builder
      // --- fetchAllAddress Cases ---
      .addCase(fetchAllAddress.pending, (state) => {
        state.loading = true;
        state.error = null; 
      })
      .addCase(fetchAllAddress.fulfilled, (state, action: PayloadAction<Address[]>) => {
        state.addresses = action.payload;
        state.loading = false;
      })
      .addCase(fetchAllAddress.rejected, (state, action) => {
        state.error = action.payload ?? "Error desconocido al cargar direcciones"; 
        state.loading = false;
      })

      // --- fetchAddressById Cases ---
      .addCase(fetchAddressById.pending, (state) => {
        state.loading = true;
        state.currentAddress = null; 
        state.error = null;
      })
      .addCase(fetchAddressById.fulfilled, (state, action: PayloadAction<Address>) => {
        state.currentAddress = action.payload;
        state.loading = false;
      })
      .addCase(fetchAddressById.rejected, (state, action) => {
        state.currentAddress = null;
        state.loading = false;
        state.error = action.payload ?? "Error desconocido al cargar la dirección"; 
      })

      // --- createAddress Cases ---
      .addCase(createAddress.pending, (state) => { 
        state.loading = true;
        state.error = null; 
      })
      .addCase(createAddress.fulfilled, (state, action: PayloadAction<Address>) => {
        state.addresses.push(action.payload);
        state.loading = false;
      })
      .addCase(createAddress.rejected, (state, action) => {
        state.error = action.payload ?? "Error desconocido al crear la dirección"; 
        state.loading = false;
      }),
});

export const { setAddress, clearError, setModalAddress, clearCurrentAddress } = addressSlice.actions;
export default addressSlice.reducer;