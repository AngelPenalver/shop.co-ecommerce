"use client";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "../hook";
import {
  loginUser,
  resetLoginError,
  setModalAuth,
  setUserData,
} from "../lib/store/features/user/userSlice";
import { setModalLoading } from "../lib/store/features/products/productsSlice";
import { decodeToken } from "../utils/decodeToken";
import { setAlert } from "../lib/store/features/alert/alertSlice";
import { useEffect } from "react";

interface LoginProps {
  email: string;
  password: string;
}

export const useLoginUser = () => {
  const dispatch = useAppDispatch();
  const { loginError } = useAppSelector((state) => state.userSlice);
  const {
    register,
    setError,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<LoginProps>({
    mode: "onBlur",
  });

  useEffect(() => {
    if (loginError) {
      setError("root", {
        type: "manual",
        message: loginError,
      });
      dispatch(setAlert({ type: "error", message: loginError }));
      dispatch(setModalAuth(true));
      dispatch(setModalLoading(false));
    }
  }, [loginError, setError, dispatch]);

  const onSubmit = async (data: LoginProps) => {
    dispatch(resetLoginError());
    clearErrors();
    dispatch(setModalLoading(true));
    dispatch(setModalAuth(false));

    try {
      const response = await dispatch(loginUser(data));

      if (loginUser.fulfilled.match(response)) {
        const { token } = response.payload;
        const tokenUser = decodeToken(token);
        dispatch(setUserData({ token, profile: tokenUser }));

        setTimeout(() => {
          dispatch(setModalLoading(false));
          dispatch(
            setAlert({
              message: `Welcome, ${tokenUser.first_name}`,
              type: "success",
            })
          );
        }, 1300);
      }
      // El error se maneja automáticamente con el useEffect
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      dispatch(setModalLoading(false));
      dispatch(setModalAuth(true));
      setError("root", {
        type: "manual",
        message: errorMessage,
      });
      dispatch(setAlert({ type: "error", message: errorMessage }));
    }
  };

  return { handleSubmit, errors, onSubmit, register };
};
