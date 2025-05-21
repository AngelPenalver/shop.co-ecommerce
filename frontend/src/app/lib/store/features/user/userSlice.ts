import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getLocalStorageItem,
  setLocalStorageItem,
  clearAuthStorage,
} from "@/src/app/utils/storage";
import { decodeToken } from "@/src/app/utils/decodeToken";
import { fetchCart } from "../cart/cartSlice";
import apiClient from "../../../apiClient";
import { fetchAllAddress } from "../address/addressSlice";
import { useAppDispatch } from "@/src/app/hook";

interface UserDataRegister {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

interface UserDataLogin {
  email: string;
  password: string;
}

interface AuthModalState {
  show: boolean;
  view: "login" | "register";
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface InitialStateUser {
  token: string | null;
  profile: UserProfile | null;
  loginError: string | null;
  registerError: string | null;
  loading: boolean;
  authModal: AuthModalState;
  initialized: boolean;
}
// Estado inicial
const getInitialState = (): InitialStateUser => ({
  token: getLocalStorageItem("authToken"),
  profile: null,
  loginError: null,
  registerError: null,
  loading: false,
  authModal: {
    show: false,
    view: "login",
  },
  initialized: false,
});

// Configuración de axios para incluir token en las peticiones
axios.interceptors.request.use(
  (config) => {
    const token = getLocalStorageItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thunks
export const registerUser = createAsyncThunk(
  "user/register",
  async (userData: UserDataRegister, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.post("/auth/register", userData);
      const token = response.data.token;
      if (!token) {
        return rejectWithValue("Respuesta de login inválida del servidor.");
      }
      const decoded = decodeToken(token);

      const userProfile: UserProfile = {
        id: decoded.id,
        email: decoded.email,
        first_name: decoded.first_name,
        last_name: decoded.last_name,
      };
      dispatch(setUserData({ token, profile: userProfile }));

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message);
      }
      return rejectWithValue("Error desconocido al registrar usuario");
    }
  }
);

export const loginUser = createAsyncThunk(
  "user/login",
  async (userData: UserDataLogin, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.post("/auth/login", userData);
      const token = response.data.token;
      if (!token) {
        return rejectWithValue("Respuesta de login inválida del servidor.");
      }

      const decoded = await decodeToken(token);

      const userProfile: UserProfile = {
        id: decoded.id,
        email: decoded.email,
        first_name: decoded.first_name,
        last_name: decoded.last_name,
      };
      dispatch(setUserData({ token, profile: userProfile }));

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message);
      }
      return rejectWithValue("Error desconocido al iniciar sesión");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "user/logout",
  async (_, { dispatch }) => {
    dispatch(clearUserData());
  }
);

export const fetchUserProfile = createAsyncThunk(
  "user/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/me`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message);
      }
      return rejectWithValue("Error al obtener el perfil");
    }
  }
);

export const initializeAuth = createAsyncThunk(
  "user/initialize",
  async (_, { dispatch }) => {
    const token = getLocalStorageItem("authToken");
    if (token) {
      try {
        const decoded = decodeToken(token);
        dispatch(setUserData({ token, profile: decoded }));

        await Promise.all([
          dispatch(fetchCart(decoded.id)).unwrap(),
          dispatch(fetchAllAddress(decoded.id)).unwrap(),
        ]);
        return decoded;
      } catch (error) {
        dispatch(clearUserData());
        throw error;
      }
    }
    return null;
  }
);

const userSlice = createSlice({
  name: "user",
  initialState: getInitialState(),
  reducers: {
    setUserData: (
      state,
      action: PayloadAction<{ token: string; profile: UserProfile }>
    ) => {
      state.token = action.payload.token;
      state.profile = action.payload.profile;
      setLocalStorageItem("authToken", action.payload.token);
      state.loginError = null;
      state.registerError = null;
    },
    clearUserData: (state) => {
      state.token = null;
      state.profile = null;
      state.loginError = null;
      state.registerError = null;
      clearAuthStorage();
    },
    setModalAuth: (state, action: PayloadAction<boolean>) => {
      state.authModal.show = action.payload;
    },
    setAuthView: (state, action: PayloadAction<"login" | "register">) => {
      state.authModal.view = action.payload;
      // Limpiar el error correspondiente al cambiar de vista
      if (action.payload === "login") {
        state.registerError = null;
      } else {
        state.loginError = null;
      }
    },
    resetLoginError: (state) => {
      state.loginError = null;
    },
    resetRegisterError: (state) => {
      state.registerError = null;
    },
    resetAllErrors: (state) => {
      state.loginError = null;
      state.registerError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Registro
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.registerError = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.profile = action.payload.user;
        state.loading = false;
        state.authModal.show = false;
        setLocalStorageItem("authToken", action.payload.token);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.registerError = action.payload as string;
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.loginError = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.profile = action.payload.user;
        state.loading = false;
        state.authModal.show = false;
        setLocalStorageItem("authToken", action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.loginError = action.payload as string;
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.profile = null;
        state.loginError = null;
        state.registerError = null;
      })

      // Obtener perfil
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.loginError = null;
        state.registerError = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        if (action.payload.token) {
          state.token = action.payload.token;
          setLocalStorageItem("authToken", action.payload.token);
        }
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.loginError = action.payload as string;
      })

      // Inicialización
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAuth.fulfilled, (state) => {
        state.loading = false;
        state.initialized = true;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.loading = false;
        state.loginError = action.payload as string;
        state.initialized = true;
      });
  },
});

export const {
  setUserData,
  clearUserData,
  setModalAuth,
  setAuthView,
  resetLoginError,
  resetRegisterError,
  resetAllErrors,
} = userSlice.actions;

export default userSlice.reducer;
