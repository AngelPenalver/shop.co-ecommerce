"use client";
import styles from "./AddToCartModal.module.css";
import { useAppDispatch, useAppSelector } from "../../hook";
import Image from "next/image";
import { useAddToCart } from "../../hooks/useAddToCart";
import { CircularProgress } from "@mui/material";
import QuantityInput from "../QuantityInput";
import { useState, useEffect, useRef } from "react";
import { setModalAddToCart } from "../../lib/store/features/cart/cartSlice";
import { setAlert } from "../../lib/store/features/alert/alertSlice";

export default function AddToCartModal() {
  const { showModal } = useAppSelector((state) => state.cartSlice);
  const { currentProduct: product } = useAppSelector(
    (state) => state.productSlice
  );
  const { handleAddToCart, loading } = useAddToCart();
  const { profile } = useAppSelector((state) => state.userSlice);
  const [quantity, setQuantity] = useState(1);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (product?.stock) {
      setQuantity(Math.min(1, product.stock));
    }
  }, [product]);

  useEffect(() => {
    if (showModal && !profile) {
      dispatch(
        setAlert({
          type: "error",
          message: "Please log in to add items to your cart.",
        })
      );
      dispatch(setModalAddToCart(false));
      return;
    }

    if (!dialogRef.current) return;

    if (showModal) {
      dialogRef.current.showModal();
    } else {
      dialogRef.current.close();
    }
  }, [showModal, profile, dispatch]);

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  if (!showModal || !profile) return null;

  const handleCloseModal = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      dispatch(setModalAddToCart(false));
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleCloseModal}
      className={styles.dialog}
    >
      <div className={styles.modal_content}>
        <button
          onClick={() => dispatch(setModalAddToCart(false))}
          className={styles.close_button}
          aria-label="Close modal"
        >
          &times;
        </button>

        {!product ? (
          <div className={styles.contain}>
            <h1>Product not found</h1>
          </div>
        ) : (
          <article className={styles.article}>
            <div className={styles.content_images}>
              <Image
                src={product.image}
                alt={product.name}
                width={300}
                height={300}
                className={styles.image_primary}
              />
            </div>

            <div className={styles.content_text}>
              <h1>{product.name}</h1>
              <h2>{product.subtitle}</h2>
              <span className={styles.price}>${product.price}</span>

              <h3>Description</h3>
              <p>{product.description}</p>

              <div className={styles.contain_buttons}>
                <h5>Quantity</h5>
                <QuantityInput
                  maxQuantity={product.stock}
                  initialQuantity={1}
                  productId={product.id}
                  onQuantityChange={handleQuantityChange}
                />

                <div className={styles.button_group}>
                  <button className={styles.buttons_buy}>Buy now</button>
                  <div>
                    <button
                      className={styles.buttons}
                      onClick={() => handleAddToCart(product.id, quantity)}
                    >
                      {loading ? (
                        <CircularProgress color="inherit" size={24} />
                      ) : (
                        "Add to cart"
                      )}
                    </button>
                    <button className={styles.buttons}>Wishlist</button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        )}
      </div>
    </dialog>
  );
}
