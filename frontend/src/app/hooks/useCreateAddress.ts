"use client";
import { useForm, SubmitHandler } from "react-hook-form";
import { useAppDispatch } from "../hook";
import {
  clearCurrentAndDefaultAddress,
  createAddress,
  fetchAllAddress,
  fetchDefaultAddress,
} from "../lib/store/features/address/addressSlice";
import { setAlert } from "../lib/store/features/alert/alertSlice";
import { setModalLoading } from "../lib/store/features/products/productsSlice";

interface AddressForm {
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phoneNumber: string;
  isDefault: boolean;
}

export const useRegisterAddress = ({
  setAddressView,
}: {
  setAddressView: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const dispatch = useAppDispatch();

  const {
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
    setError,
    register,
    handleSubmit,
  } = useForm<AddressForm>({
    defaultValues: {
      first_name: "",
      last_name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      phoneNumber: "",
      isDefault: false,
    },
  });

  const onSubmit: SubmitHandler<AddressForm> = async (data) => {
    dispatch(setModalLoading(true));

    try {
      const response = await dispatch(createAddress(data));
      setTimeout(() => {
        dispatch(setModalLoading(false));
      }, 1300);
      if (createAddress.fulfilled.match(response)) {
        await dispatch(clearCurrentAndDefaultAddress());
        await dispatch(fetchDefaultAddress(""));
        await dispatch(fetchAllAddress(""));
        dispatch(
          setAlert({ type: "success", message: "Address created successfully" })
        );
        setAddressView("currentAddress");

        reset();
      } else if (createAddress.rejected.match(response)) {
        let errorMessage = "Error creating address. Please try again.";
        if (response.payload && typeof response.payload === "string") {
          errorMessage = response.payload;
        }
        setError("root.serverError", {
          type: "server",
          message: errorMessage,
        });
        dispatch(setAlert({ type: "error", message: errorMessage }));
      } else {
        const unexpectedErrorMessage = "An unexpected error occurred.";
        setError("root.serverError", {
          type: "unexpected",
          message: unexpectedErrorMessage,
        });
        dispatch(setAlert({ type: "error", message: unexpectedErrorMessage }));
      }
    } catch (error) {
      console.error(
        "Catastrophic error during address creation dispatch:",
        error
      );
      const catastrophicErrorMessage =
        "A critical error occurred. Please contact support.";
      setError("root.serverError", {
        type: "catastrophic",
        message: catastrophicErrorMessage,
      });
      dispatch(setAlert({ type: "error", message: catastrophicErrorMessage }));
    }
  };

  return {
    errors,
    register,
    handleSubmit,
    onSubmit,
    control,
    setValue,
    watch,
    reset,
    isSubmitting,
  };
};
