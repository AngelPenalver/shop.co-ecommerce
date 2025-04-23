"use client";
import React, { useEffect, useRef } from "react";
import styles from "./AuthModal.module.css";
import { useAppDispatch, useAppSelector } from "@/src/app/hook";
import { setModalAuth } from "@/src/app/lib/store/features/user/userSlice";
import LoginForm from "../../loginForm/LoginForm";
import RegisterForm from "../../registerForm/RegisterForm";
import { AlertManager } from "../../AlertManager";

export default function AuthModal(): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const { view, show } = useAppSelector((state) => state.userSlice.authModal);

  // Efecto para manejar el foco y el scroll
  useEffect(() => {
    if (show) {
      dialogRef.current?.showModal();
      // Bloquear scroll del body
      document.body.style.overflow = "hidden";
    } else {
      dialogRef.current?.close();
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  const handleCloseModal = (e: React.MouseEvent) => {
    if (
      modalContentRef.current &&
      !modalContentRef.current.contains(e.target as Node)
    ) {
      dispatch(setModalAuth(false));
    }
  };

  // Manejar cierre con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dispatch(setModalAuth(false));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClick={handleCloseModal}
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <AlertManager />

      <div ref={modalContentRef} className={styles.modalContent}>
        {view === "login" ? <LoginForm /> : <RegisterForm />}
      </div>
    </dialog>
  );
}
