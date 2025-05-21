import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../../apiClient";
import axios from "axios";

interface Country {
  geonameId: number;
  name: string;
  iso2: string;
}

interface State {
  geonameId: number;
  name: string;
  iso2: string;
}
interface City {
  geonameId: number;
  name: string;
}

interface LocationState {
  countries: Country[];
  states: State[];
  cities: City[];
  loading: boolean;
  error: string | null;
}

const initialState: LocationState = {
  countries: [],
  states: [],
  cities: [],
  loading: false,
  error: null,
};

//Get all countries
export const getAllCountries = createAsyncThunk<Country[], void>(
  "location/getCountries",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<Country[]>("/locations/countries");
      return response.data;
    } catch (errorCountries) {
      if (axios.isAxiosError(errorCountries)) {
        return rejectWithValue(errorCountries.message);
      }
      return rejectWithValue("Error fetching countries");
    }
  }
);

//Get all states by country
export const getStatesByCountry = createAsyncThunk<
  State[],
  number,
  { rejectValue: string }
>(
  "location/getStatesByCountry",
  async (countryGeonameId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<State[]>(
        `/locations/states/${countryGeonameId}`
      );
      return response.data;
    } catch (errorStates) {
      if (axios.isAxiosError(errorStates)) {
        return rejectWithValue(errorStates.message);
      }
      return rejectWithValue("Error fetching states");
    }
  }
);

//Get all cities by state
export const getCitiesByState = createAsyncThunk<
  City[],
  number,
  { rejectValue: string }
>("location/getCitiesByState", async (stateGeonameId, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<City[]>(
      `/locations/cities/${stateGeonameId}`
    );
    return response.data;
  } catch (errorCities) {
    if (axios.isAxiosError(errorCities)) {
      return rejectWithValue(errorCities.message);
    }
    return rejectWithValue("Error fetching cities");
  }
});

const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    clearLocation: (state) => {
      state.countries = [];
      state.states = [];
      state.cities = [];
      state.loading = false;
      state.error = null;
    },
    clearCities: (state) => {
      state.cities = [];
      state.loading = false;
      state.error = null;
    },
    clearStates: (state) => {
      state.states = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all countries cases
      .addCase(getAllCountries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllCountries.fulfilled, (state, action) => {
        state.loading = false;
        state.countries = action.payload;
      })
      .addCase(getAllCountries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get all states by country cases
      .addCase(getStatesByCountry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStatesByCountry.fulfilled, (state, action) => {
        state.loading = false;
        state.states = action.payload;
      })
      .addCase(getStatesByCountry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get all cities by state cases
      .addCase(getCitiesByState.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCitiesByState.fulfilled, (state, action) => {
        state.loading = false;
        state.cities = action.payload;
      })
      .addCase(getCitiesByState.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearLocation, clearCities, clearStates } =
  locationSlice.actions;
export default locationSlice.reducer;
