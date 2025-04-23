import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AlertState {
  type: "error" | "success" | null;
  message: string | null;
}

interface AlertPayload {
  type: "error" | "success";
  message: string;
}

const initialState: AlertState = {
  type: null,
  message: null,
};

const alertSlice = createSlice({
  name: "alert",
  initialState,
  reducers: {
    setAlert: (state, action: PayloadAction<AlertPayload>) => {
      state.type = action.payload.type;
      state.message = action.payload.message;
    },
    clearAlert: (state) => {
      state.type = null;
      state.message = null;
    },
  },
});

export const { setAlert, clearAlert } = alertSlice.actions;
export default alertSlice.reducer;