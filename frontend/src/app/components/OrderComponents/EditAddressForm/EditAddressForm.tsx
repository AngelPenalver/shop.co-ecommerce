"use client";

import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  FormHelperText,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { Controller } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/src/app/hook";
import { useEffect } from "react";
import {
  getAllCountries,
  getStatesByCountry,
  clearCities,
  clearStates,
  getCitiesByState,
} from "@/src/app/lib/store/features/location/locationSlice";
import useUpdateAddress from "@/src/app/hooks/useUpdateAddress";
import { useRouter } from "next/navigation";
import styles from "./EditAddressForm.module.css";

export default function EditAddressForm({
  setAddressView,
}: {
  setAddressView: React.Dispatch<React.SetStateAction<string>>;
}): React.JSX.Element {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    cities,
    countries,
    states,
    loading: locationLoading,
    error: locationError,
  } = useAppSelector((state) => state.locationSlice);
  const { addressToEdit: address } = useAppSelector(
    (state) => state.addressSlice
  );
  if (!address) {
    router.push("/trade");
  }

  const {
    control,
    handleSubmit,
    register,
    watch,
    setValue,
    errors,
    onSubmit,
    isSubmitting,
  } = useUpdateAddress({ id: address?.id as number, setAddressView });

  const selectedCountryName = watch("country");
  const selectedStateName = watch("state");

  useEffect(() => {
    dispatch(getAllCountries());
  }, [dispatch]);

  useEffect(() => {
    if (selectedCountryName) {
      const countryObject = countries.find(
        (c) => c.name === selectedCountryName
      );
      if (
        countryObject &&
        countryObject.geonameId &&
        countryObject.geonameId !== 0
      ) {
        dispatch(getStatesByCountry(countryObject.geonameId));
      } else if (countryObject) {
        console.warn(
          `Country ${selectedCountryName} has an invalid geonameId: ${countryObject.geonameId}. Not fetching states.`
        );
        dispatch(clearStates());
      }
      setValue("state", "");
      setValue("city", "");
      dispatch(clearCities());
    } else {
      dispatch(clearStates());
      dispatch(clearCities());
      setValue("state", "");
      setValue("city", "");
    }
  }, [selectedCountryName, dispatch, setValue, countries]);

  useEffect(() => {
    if (selectedStateName) {
      const stateObject = states.find((s) => s.name === selectedStateName);
      if (stateObject) {
        dispatch(getCitiesByState(stateObject.geonameId));
      }
      setValue("city", "");
    } else {
      dispatch(clearCities());
      setValue("city", "");
    }
  }, [selectedStateName, dispatch, setValue, states]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.editAddressForm}>
      {errors.root?.serverError && (
        <p className={styles.errorText}>{errors.root.serverError.message}</p>
      )}

      <div className={styles.formGroup}>
        <TextField
          label="First Name"
          fullWidth
          {...register("first_name", { required: "First name is required" })}
          error={!!errors.first_name}
          helperText={errors.first_name?.message}
        />
        <TextField
          label="Last Name"
          fullWidth
          {...register("last_name", { required: "Last name is required" })}
          error={!!errors.last_name}
          helperText={errors.last_name?.message}
        />
      </div>
      <div className={styles.formGroup}>
        <TextField
          label="Address"
          fullWidth
          {...register("address", { required: "Address is required" })}
          error={!!errors.address}
          helperText={errors.address?.message}
          multiline
          rows={4}
        />
      </div>

      <div className={styles.formGroup}>
        <Controller
          name="country"
          control={control}
          rules={{ required: "Country is required" }}
          render={({ field, fieldState }) => (
            <FormControl fullWidth error={!!fieldState.error}>
              <InputLabel>Country</InputLabel>
              <Select {...field} label="Country">
                <MenuItem value="">
                  <em>Select Country</em>
                </MenuItem>
                {countries.map((country) => (
                  <MenuItem key={country.geonameId} value={country.name}>
                    {country.name}
                  </MenuItem>
                ))}
              </Select>
              {fieldState.error && (
                <FormHelperText>{fieldState.error.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
        {/* State Select */}
        <Controller
          name="state"
          control={control}
          rules={{ required: "State is required" }}
          render={({ field, fieldState }) => (
            <FormControl
              fullWidth
              error={!!fieldState.error}
              disabled={
                !selectedCountryName || states.length === 0 || locationLoading
              }
            >
              <InputLabel>State</InputLabel>
              <Select {...field} label="State">
                <MenuItem value="">
                  <em>Select State</em>
                </MenuItem>
                {states.map((state) => (
                  <MenuItem key={state.geonameId} value={state.name}>
                    {state.name}
                  </MenuItem>
                ))}
              </Select>
              {fieldState.error && (
                <FormHelperText>{fieldState.error.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
        {/* City Select */}
        <Controller
          name="city"
          control={control}
          rules={{ required: "City is required" }}
          render={({ field, fieldState }) => (
            <FormControl
              fullWidth
              error={!!fieldState.error}
              disabled={
                !selectedStateName || cities.length === 0 || locationLoading
              }
            >
              <InputLabel>City</InputLabel>
              <Select {...field} label="City">
                <MenuItem value="">
                  <em>Select City</em>
                </MenuItem>
                {cities.map((city) => (
                  <MenuItem key={city.geonameId} value={city.name}>
                    {city.name}
                  </MenuItem>
                ))}
              </Select>
              {fieldState.error && (
                <FormHelperText>{fieldState.error.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </div>

      <div className={styles.formGroup}>
        <TextField
          label="Zip Code"
          fullWidth
          {...register("zipCode", { required: "Zip code is required" })}
          error={!!errors.zipCode}
          helperText={errors.zipCode?.message}
        />
        <TextField
          label="Phone Number"
          fullWidth
          {...register("phoneNumber", {
            required: "Phone number is required",
          })}
          error={!!errors.phoneNumber}
          helperText={errors.phoneNumber?.message}
        />
      </div>
      <div className={styles.formGroup}>
        <Controller
          name="isDefault"
          control={control}
          defaultValue={false}
          render={({ field: { onChange, value, ref } }) => (
            <FormControlLabel
              label="Set as Default Address"
              control={
                <Checkbox
                  checked={!!value}
                  onChange={(e) => onChange(e.target.checked)}
                  inputRef={ref}
                />
              }
            />
          )}
        />
      </div>

      {locationError && (
        <p className={styles.errorText}>
          Error loading locations: {locationError}
        </p>
      )}

      <button type="submit" disabled={isSubmitting || locationLoading}>
        {" "}
        {isSubmitting ? "Updating..." : "Save"}
      </button>
    </form>
  );
}
