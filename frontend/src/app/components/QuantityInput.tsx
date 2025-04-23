"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "../hook";
import { useUpdateFromCart } from "../hooks/useUpdateFromCart";

interface QuantityInputProps {
  productId: number;
  initialQuantity: number;
  maxQuantity: number;
  isCartView?: boolean;
  onQuantityChange?: (newQuantity: number) => void; // Nuevo prop para modal
}

function QuantityInput({
  productId,
  initialQuantity,
  maxQuantity,
  isCartView = false,
  onQuantityChange,
}: QuantityInputProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const { incrementItemFromCart, decrementItemFromCart } = useUpdateFromCart();
  const { profile } = useAppSelector((state) => state.userSlice);

  // Sincronizar con cambios externos
  useEffect(() => {
    setQuantity(initialQuantity);
  }, [initialQuantity]);

  const updateQuantity = useCallback(async (action: 'increment' | 'decrement') => {
    if (isUpdating) return;
    
    const newQuantity = action === 'increment' 
      ? Math.min(maxQuantity, quantity + 1)
      : Math.max(1, quantity - 1);

    setQuantity(newQuantity);
    onQuantityChange?.(newQuantity); 

    if (isCartView && profile) {
      setIsUpdating(true);
      try {
        const updateFn = action === 'increment' 
          ? incrementItemFromCart 
          : decrementItemFromCart;
        
        await updateFn({
          productId,
          quantity: 1, 
          userId: profile.id,
        });
      } catch (error) {
        // Revertir en caso de error
        setQuantity(quantity);
        onQuantityChange?.(quantity);
        console.error("Error updating cart:", error);
      } finally {
        setIsUpdating(false);
      }
    }
  }, [quantity, maxQuantity, productId, profile, isCartView, incrementItemFromCart, decrementItemFromCart, isUpdating, onQuantityChange]);

  const handleDecrement = () => updateQuantity('decrement');
  const handleIncrement = () => updateQuantity('increment');

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "16px",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        height: "40px",
        justifyContent: "space-between",
        fontSize: "16px",
        fontWeight: "500",
        border: "1px #828282 solid",
        borderRadius: "20px",
        padding: "1rem 1rem",
        opacity: isUpdating ? 0.7 : 1
      }}>
        <button
          onClick={handleDecrement}
          disabled={quantity <= 1 || isUpdating}
          style={{
            padding: "0",
            cursor: quantity <= 1 ? "not-allowed" : "pointer",
            background: "transparent",
            border: "none",
            fontSize: "16px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            height: "24px",
            color: "#B88E2F",
          }}
          aria-label="Decrease quantity"
        >
          -
        </button>
        
        <span style={{
          padding: "0 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}>
          {isUpdating ? "..." : quantity}
        </span>
        
        <button
          onClick={handleIncrement}
          disabled={quantity >= maxQuantity || isUpdating}
          style={{
            padding: "0",
            cursor: quantity >= maxQuantity ? "not-allowed" : "pointer",
            background: "transparent",
            border: "none",
            fontSize: "16px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "24px",
            height: "24px",
            color: "#B88E2F",
            opacity: quantity >= maxQuantity ? 0.5 : 1
          }}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      
      {!isCartView && (
        <div style={{ color: "#666", fontSize: "14px" }}>
          Maximum allowed: {maxQuantity}
        </div>
      )}
    </div>
  );
}

export default QuantityInput;