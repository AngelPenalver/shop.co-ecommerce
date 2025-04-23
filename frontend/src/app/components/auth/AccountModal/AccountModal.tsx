"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import styles from "./AccountModal.module.css";
import { useAppDispatch, useAppSelector } from "@/src/app/hook";
import Link from "next/link";
import {
  logoutUser,
  setAuthView,
  setModalAuth,
} from "@/src/app/lib/store/features/user/userSlice";
import { setModalLoading } from "@/src/app/lib/store/features/products/productsSlice";
import { clearCart } from "@/src/app/lib/store/features/cart/cartSlice";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  anchorElement?: HTMLElement | null;
}

export default function AccountModal({
  isOpen,
  onClose,
  anchorElement,
}: AccountModalProps) {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.userSlice);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calcula la posición del modal
  const updatePosition = useCallback(() => {
    if (anchorElement) {
      const rect = anchorElement.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 5, // 5px de margen
        left: rect.left + window.scrollX - 100, // Ajuste horizontal
      });
    }
  }, [anchorElement]);

  // Actualiza posición cuando se abre o cambia el anchor
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      // Agrega listener para reposicionar en scroll/resize
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
    }

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Limpia timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      onClose();
    }, 300); // 300ms antes de cerrar
  };
  // Abrir modal de registro
  const handleModalRegister = () => {
    onClose();
    dispatch(setModalAuth(true));
    dispatch(setAuthView("register"));
  };
  const handleModalLogin = () => {
    onClose();
    dispatch(setModalAuth(true));
    dispatch(setAuthView("login"));
  };

  const handleLogout = async() => {
    dispatch(setModalLoading(true))
    await dispatch(logoutUser())
    await dispatch(clearCart())
    onClose()
    setTimeout(() => {
      dispatch(setModalLoading(false))
    }, 1000);
    }
  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className={styles.modal}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {token ? (
        <div className={styles.modalContent}>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{"Usuario"}</p>
          </div>
          <Link href="/profile" className={styles.modalItem} onClick={onClose}>
            My Profile
          </Link>
          <Link href="/orders" className={styles.modalItem} onClick={onClose}>
            My Orders
          </Link>
          <button onClick={handleLogout} className={`${styles.modalItem} ${styles.logout}`}>
            Sign Out
          </button>
        </div>
      ) : (
        <div className={styles.modalContent}>
          <button
            className={styles.modalItem}
            id={styles.login}
            onClick={handleModalLogin}
          >
            Sign In
          </button>
          <button
            className={styles.modalItem}
            id={styles.register}
            onClick={handleModalRegister}
          >
            Register
          </button>
        </div>
      )}
    </div>
  );
}
