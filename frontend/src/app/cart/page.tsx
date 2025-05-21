"use client";
import styles from "./page.module.css";
import { RootState } from "../lib/store";
import { useEffect } from "react";
import { fetchCart } from "../lib/store/features/cart/cartSlice";
import { useAppDispatch, useAppSelector } from "../hook";
import Logo from "../../../public/logo.png";
import Image from "next/image";
import CartItem from "../components/cartItem/CartItem";
import EmptyCart from "@/public/empty_cart.svg";
import { useRouter } from "next/navigation";

export default function Cart(): React.JSX.Element {
  const { cart } = useAppSelector((state: RootState) => state.cartSlice);
  const { profile } = useAppSelector((state: RootState) => state.userSlice);
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    if (profile) {
      dispatch(fetchCart(profile.id));
    }
  }, [dispatch, profile]);

  const handleRoute = () => {
    router.push("/");
  };

  if (!cart || cart.items?.length === 0) {
    return (
      <main className={styles.emptyMain}>
        <section className={styles.emptyContainer}>
          <div className={styles.emptyIllustration}>
            <Image
              src={EmptyCart}
              alt="Empty cart"
              width={300}
              height={300}
              priority
            />
          </div>
          <h1 className={styles.emptyTitle}>Your cart is empty</h1>
          <button className={styles.emptyButton} onClick={handleRoute}>
            Explorer items
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <section aria-labelledby="cart-heading" className={styles.cartContainer}>
        <div className={styles.cartHeader}>
          <Image src={Logo} alt="Logo" />
          <h1 id={styles.title}>Your Cart</h1>
        </div>
        <div className={styles.cartContent}>
          <div className={styles.itemsContain} aria-labelledby="items-heading">
            <ul className={styles.itemsList} aria-label="products in the cart">
              {cart.items.map((item) => (
                <li key={item.id}>
                  <CartItem
                    product={item.product}
                    id={item.id}
                    quantity={item.quantity}
                  />
                </li>
              ))}
            </ul>
          </div>

          <aside className={styles.summary} aria-labelledby="summary-heading">
            <h2>Order Summary</h2>

            <ul>
              <li>
                <span>Items({cart.items.length})</span>
                <span>${cart.total.toFixed(2)}</span>
              </li>
              <li>
                <span>Delivery Fee</span>
                <span>$15.00</span>
              </li>
            </ul>

            <div className={styles.order_total}>
              <span>Sub Total</span>
              <span>${(cart.total + 15).toFixed(2)}</span>
            </div>
            <button
              id={styles.button_summary}
              aria-label="Proceed to checkout"
              onClick={() => {
                router.push("/trade");
              }}
            >
              Go to Checkout
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
}
