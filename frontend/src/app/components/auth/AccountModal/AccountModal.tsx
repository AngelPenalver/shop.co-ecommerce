"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import styles from "./AccountModal.module.css";
import { useAppDispatch, useAppSelector } from "@/src/app/hook";
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
  const { profile } = useAppSelector((state) => state.userSlice);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef(false);

  const updatePosition = useCallback(() => {
    if (anchorElement) {
      const rect = anchorElement.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX - 100,
      });
    }
  }, [anchorElement]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
    }

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    isHoveringRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    isHoveringRef.current = false;
    timeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        onClose();
      }
    }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleModalMouseEnter = (e: React.MouseEvent) => {
    if (
      e.relatedTarget &&
      anchorElement &&
      !anchorElement.contains(e.relatedTarget as Node)
    ) {
      return;
    }
    handleMouseEnter();
  };

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

  const handleLogout = async () => {
    dispatch(setModalLoading(true));
    await dispatch(logoutUser());
    await dispatch(clearCart());
    onClose();
    setTimeout(() => {
      dispatch(setModalLoading(false));
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className={styles.modal}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        pointerEvents: isOpen ? "auto" : "none",
      }}
      onMouseEnter={handleModalMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {token ? (
        <div className={styles.modalContent}>
          <div className={styles.userInfo}>
            <p className={styles.userName}>
              {profile?.first_name} {profile?.last_name}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className={`${styles.modalItem} ${styles.logout}`}
          >
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
