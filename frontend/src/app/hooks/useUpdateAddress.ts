"use client";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "../hook";
import {
  clearCurrentAndDefaultAddress,
  fetchAllAddress,
  fetchDefaultAddress,
  updateAddress,
} from "../lib/store/features/address/addressSlice";
import { setAlert } from "../lib/store/features/alert/alertSlice";

export default function useUpdateAddress({
  setAddressView,
  id,
}: {
  setAddressView: React.Dispatch<React.SetStateAction<string>>;
  id: number;
}) {
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
  const dispatch = useAppDispatch();
  const { addressToEdit: address } = useAppSelector(
    (state) => state.addressSlice
  );
  const { errorUpdate } = useAppSelector((state) => state.addressSlice);
  const {
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    setError,
    register,
    handleSubmit,
  } = useForm<AddressForm>({
    defaultValues: {
      first_name: address?.first_name,
      last_name: address?.last_name,
      address: address?.address,
      city: address?.city,
      state: address?.state,
      zipCode: address?.zipCode,
      country: address?.country,
      phoneNumber: address?.phoneNumber,
      isDefault: address?.isDefault,
    },
  });

  const onSubmit = async (data: AddressForm) => {
    const {
      first_name,
      last_name,
      address,
      city,
      state,
      zipCode,
      country,
      phoneNumber,
      isDefault,
    } = data;
    const addressData = {
      first_name,
      last_name,
      address,
      city,
      state,
      zipCode,
      country,
      phoneNumber,
      isDefault,
    };

    const response = await dispatch(
      updateAddress({ address: addressData, id: id })
    );
    try {
      console.log(response);
      if (updateAddress.fulfilled.match(response)) {
        await dispatch(clearCurrentAndDefaultAddress());
        await dispatch(fetchAllAddress(""));
        await dispatch(fetchDefaultAddress(""));
        setAddressView("currentAddress");
        dispatch(
          setAlert({ type: "success", message: "Address updated successfully" })
        );
      } else {
        dispatch(
          setAlert({ type: "error", message: "Error updating address" })
        );
        setError("root", {
          type: "server",
          message: errorUpdate as string,
        });
      }
    } catch (error) {
      dispatch(setAlert({ type: "error", message: "Error updating address" }));
      setError("root", {
        type: "server",
        message: errorUpdate as string,
      });
      console.log(error);
    }
  };

  return {
    control,
    handleSubmit,
    register,
    watch,
    setValue,
    errors,
    onSubmit,
    isSubmitting,
  };
}
