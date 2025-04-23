"use client";
import { useEffect } from "react";
import { useAppDispatch } from "../hook";
import { initializeAuth } from "../lib/store/features/user/userSlice";

export default function AuthInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return null;
}
