"use client";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "../hook";
import {
  registerUser,
  resetRegisterError,
  setModalAuth,
  setUserData,
} from "../lib/store/features/user/userSlice";
import { setModalLoading } from "../lib/store/features/products/productsSlice";
import { decodeToken } from "../utils/decodeToken";
import { setAlert } from "../lib/store/features/alert/alertSlice";
import { useEffect } from "react";

export const useRegisterUser = () => {
  interface RegisterProps {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
  }

  const dispatch = useAppDispatch();
  const { registerError } = useAppSelector((state) => state.userSlice);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    reset,
  } = useForm<RegisterProps>({
    mode: "onBlur",
  });

  // Manejar errores del servidor
  useEffect(() => {
    if (registerError) {
      setError("root", {
        type: "server",
        message: registerError,
      });
      dispatch(setModalLoading(false));
      dispatch(setModalAuth(true));
      dispatch(setAlert({ type: "error", message: registerError }));
    }
  }, [registerError, setError, dispatch]);

  const onSubmit = async (data: RegisterProps) => {
    dispatch(resetRegisterError());
    clearErrors();
    dispatch(setModalLoading(true));
    dispatch(setModalAuth(false));

    try {
      const response = await dispatch(registerUser(data));

      if (registerUser.fulfilled.match(response)) {
        const userData = decodeToken(response.payload.token);
        dispatch(
          setUserData({ token: response.payload.token, profile: userData })
        );
        reset(); // Limpia el formulario después de éxito

        setTimeout(() => {
          dispatch(setModalLoading(false));
          dispatch(
            setAlert({
              type: "success",
              message: `Welcome, ${userData.first_name}`,
            })
          );
        }, 1300);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      dispatch(setModalLoading(false));
      dispatch(setModalAuth(true));
      setError("root.server", {
        type: "custom",
        message: errorMessage,
      });
      dispatch(setAlert({ type: "error", message: errorMessage }));
    }
  };

  return {
    register,
    handleSubmit,
    errors,
    onSubmit,
  };
};
