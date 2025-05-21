import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "../../../apiClient";
import axios from "axios";

interface UserAddress {
  id: number;
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
  zipCode: string;
  phoneNumber: string;
  user?: UserAddress;
  isDefault: boolean;
}
interface CreateAddressData {
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phoneNumber: string;
}
interface UpdateAddressForm {
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phoneNumber: string;
}
interface UpdateAddressDTO {
  address: UpdateAddressForm;
  id: number;
}

interface InitialStateAddress {
  addresses: Address[];
  currentAddress: Address | null;
  loading: boolean;
  error: string | null;
  errorUpdate: string | null;
  errorCreate: string | null;
  showModal: boolean;
  defaultAddress: Address | null;
  addressToEdit: Address | null;
}

const initialState: InitialStateAddress = {
  defaultAddress: null,
  currentAddress: null,
  addresses: [],
  loading: false,
  error: null,
  errorUpdate: null,
  errorCreate: null,
  showModal: false,
  addressToEdit: null,
};

// Fetch all addresses for a user
export const fetchAllAddress = createAsyncThunk<
  Address[],
  string,
  { rejectValue: string }
>("address/fetchAllAddress", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<Address[]>(`/address`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Error al cargar direcciones"
      );
    }
    return rejectWithValue("Error desconocido al cargar direcciones");
  }
});
// Fecth default address
export const fetchDefaultAddress = createAsyncThunk<
  Address,
  string,
  { rejectValue: string }
>("address/fetchDefaultAddress", async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<Address>(`/address/default`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Error al cargar la dirección"
      );
    }
    return rejectWithValue("Error desconocido al cargar la dirección");
  }
});

// Update default address
export const updateDefaultAddress = createAsyncThunk<Address, number>(
  "address/updateDefaultAddress",
  async (addressId, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch<Address>(
        `/address/default/${addressId}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            error.message ||
            "Error al cargar la dirección"
        );
      }
      return rejectWithValue("Error desconocido al cargar la dirección");
    }
  }
);

// Fecth address by ID
export const fetchAddressById = createAsyncThunk<
  Address,
  number,
  { rejectValue: string }
>("address/fetchAddressById", async (addressId, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<Address>(`/address/${addressId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Error al cargar la dirección"
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
    console.log(createAddressData);

    const response = await apiClient.post<Address>(
      `/address`,
      createAddressData
    );
    return response.data;
  } catch (error) {
    console.log(error);

    if (axios.isAxiosError(error)) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Error al crear la dirección"
      );
    }
    return rejectWithValue("Error desconocido al crear la dirección");
  }
});

// Update an address
export const updateAddress = createAsyncThunk<Address, UpdateAddressDTO>(
  "address/updateAddress",
  async (updateAddressData, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch<Address>(
        `/address/${updateAddressData.id}`,
        updateAddressData.address
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ||
            error.message ||
            "Error al actualizar la dirección"
        );
      }
      return rejectWithValue("Error desconocido al actualizar la dirección");
    }
  }
);
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
    setCurrentAddress(state, action: PayloadAction<Address>) {
      state.currentAddress = action.payload;
    },
    clearCurrentAndDefaultAddress(state) {
      state.currentAddress = null;
      state.defaultAddress = null;
    },
    setAddressToEdit(state, action) {
      state.addressToEdit = action.payload;
    },
    clearAddressToEdit(state) {
      state.addressToEdit = null;
    },
  },
  extraReducers: (builder) =>
    builder
      // --- fetchAllAddress Cases ---
      .addCase(fetchAllAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllAddress.fulfilled,
        (state, action: PayloadAction<Address[]>) => {
          state.addresses = action.payload;
          state.loading = false;
        }
      )
      .addCase(fetchAllAddress.rejected, (state, action) => {
        state.error =
          action.payload ?? "Error desconocido al cargar direcciones";
        state.loading = false;
      })

      // --- fetchAddressById Cases ---
      .addCase(fetchAddressById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAddressById.fulfilled,
        (state, action: PayloadAction<Address>) => {
          state.loading = false;
        }
      )
      .addCase(fetchAddressById.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ?? "Error desconocido al cargar la dirección";
      })

      // --- createAddress Cases ---
      .addCase(createAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createAddress.fulfilled,
        (state, action: PayloadAction<Address>) => {
          state.addresses.push(action.payload);
          state.loading = false;
        }
      )
      .addCase(createAddress.rejected, (state, action) => {
        state.error =
          action.payload ?? "Error desconocido al crear la dirección";
        state.loading = false;
      })
      // --- fetchDefaultAddress Cases ---
      .addCase(fetchDefaultAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchDefaultAddress.fulfilled,
        (state, action: PayloadAction<Address>) => {
          state.defaultAddress = action.payload;
          state.loading = false;
        }
      )
      .addCase(fetchDefaultAddress.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })
      // --- updateDefaultAddress Cases ---
      .addCase(updateDefaultAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDefaultAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.defaultAddress = action.payload;
      })
      .addCase(updateDefaultAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // --- updateAddress Cases ---
      .addCase(updateAddress.pending, (state) => {
        state.loading = true;
        state.errorUpdate = null;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.errorUpdate = null;
        const index = state.addresses.findIndex(
          (address) => address.id === action.payload.id
        );
        if (index !== -1) {
          state.addresses[index] = action.payload;
        }
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.loading = false;
        state.errorUpdate = action.payload as string;
      }),
});

export const {
  setAddress,
  clearError,
  setModalAddress,
  setCurrentAddress,
  clearCurrentAndDefaultAddress,
  clearAddressToEdit,
  setAddressToEdit,
} = addressSlice.actions;
export default addressSlice.reducer;
