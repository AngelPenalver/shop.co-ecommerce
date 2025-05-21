"use client";

import { useEffect } from "react";
import { initializeAuth } from "@/src/app/lib/store/features/user/userSlice";
import { useAppDispatch, useAppSelector } from "../hook";

export default function AuthInitializer() {
  const dispatch = useAppDispatch();
  const { initialized } = useAppSelector((state) => state.userSlice);

  useEffect(() => {
    if (!initialized) {
      dispatch(initializeAuth());
    }
  }, [dispatch, initialized]);

  return null;
}
