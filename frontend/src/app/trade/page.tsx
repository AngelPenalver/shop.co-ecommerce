"use client";
import React, { useEffect } from "react";
import CheckoutButton from "../components/OrderComponents/CheckoutButton";
import Address from "../components/OrderComponents/Address/Address";
import styles from "./page.module.css";
import { useAppDispatch, useAppSelector } from "../hook";
import {
  fetchAllAddress,
  fetchDefaultAddress,
} from "../lib/store/features/address/addressSlice";
import { setAlert } from "../lib/store/features/alert/alertSlice";
import { useRouter } from "next/navigation";
import ReviewCard from "../components/OrderComponents/ReviewCard/ReviewCard";

export default function TradePage(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const { cart } = useAppSelector((state) => state.cartSlice);
  const router = useRouter();

  useEffect(() => {
    dispatch(fetchAllAddress(""));
    dispatch(fetchDefaultAddress(""));
  }, [dispatch]);

  useEffect(() => {
    if (cart?.items.length === 0) {
      dispatch(setAlert({ message: "Cart is empty", type: "error" }));
      router.push("/products");
    }
  }, [cart, dispatch, router]);

  return (
    <section className={styles.contain_trade}>
      <div className={styles.content_trade}>
        <div>
          <h2>Ship to</h2>
          <Address />
        </div>
        <div>
          <h2>Review order</h2>
          <section>
            {cart?.items.map((item) => (
              <ReviewCard
                product={item.product}
                quantity={item.quantity}
                id={item.id}
                key={item.id}
              />
            ))}
          </section>
        </div>
      </div>
      <div className={styles.checkout_content}>
        <CheckoutButton />
      </div>
    </section>
  );
}
