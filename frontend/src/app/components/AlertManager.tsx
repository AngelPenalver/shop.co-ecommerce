"use client";
import { useEffect } from "react";
import AlertComponent from "./Alert";
import { useAppDispatch, useAppSelector } from "../hook";
import { clearAlert } from "../lib/store/features/alert/alertSlice";

export const AlertManager = () => {
  const { type, message } = useAppSelector((state) => state.alertSlice);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (type && message) {
      const timer = setTimeout(() => {
        dispatch(clearAlert());
      }, 5000); 
      return () => clearTimeout(timer);
    }
  }, [type, message, dispatch]);

  if (!type || !message) return null;

  return <AlertComponent type={type} message={message} />;
};
