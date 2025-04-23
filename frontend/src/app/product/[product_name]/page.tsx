"use client";
import styles from "./page.module.css";
import Image from "next/image";
import QuantityInput from "../../components/QuantityInput";
import { useSelector } from "react-redux";
import { RootState } from "../../lib/store";
import React, { useState } from "react";
import { CircularProgress } from "@mui/material";
import { useAddToCart } from "../../hooks/useAddToCart";
import { useAppDispatch, useAppSelector } from "../../hook";
import { setAlert } from "../../lib/store/features/alert/alertSlice";

export default function ProductDetail(): React.JSX.Element {
  const { handleAddToCart, loading } = useAddToCart();
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.userSlice);
  const [quantity, setQuantity] = useState(1);
  const { currentProduct: product } = useSelector(
    (state: RootState) => state.productSlice
  );
  if (!product) {
    return (
      <div className={styles.contain}>
        <h1>Product not found</h1>
      </div>
    );
  }

  const handleAddToCartClick = () => {
    if (profile) {
      handleAddToCart(product.id, quantity, profile.id);
    } else {
      // Handle the case when the user is not logged in
      dispatch(
        setAlert({
          type: "error",
          message: "Please log in to add items to your cart.",
        })
      );
    }
  };

  return (
    <section className={styles.contain}>
      <div className={styles.content}>
        <div className={styles.content_images}>
          <Image
            src={product?.image}
            alt={product?.name}
            id={styles.image_primary}
            width={700}
            height={600}
          />
        </div>
        <div className={styles.content_text}>
          <h1>{product.name}</h1>
          <h2>{product.subtitle}</h2>
          <span id={styles.price}>${product.price}</span>
          <h3>Description</h3>
          <p>{product.description}</p>
          <div id={styles.contain_buttons}>
            <h5>Quantity</h5>
            <QuantityInput
              max={product.stock}
              quantity={quantity}
              setQuantity={setQuantity}
            />
            <button id={styles.buttons_buy}>Buy now</button>
            <div>
              <button
                id={styles.buttons}
                onClick={handleAddToCartClick}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Add to cart"}
              </button>
              <button id={styles.buttons}>Wishlist</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
