"use client";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../hook";
import { createOrder } from "../../lib/store/features/orders/ordersSlice";

let stripePromise: Promise<Stripe | null> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
    if (!publicKey) {
      console.error("Stripe public key is not defined.");
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(publicKey);
  }
  return stripePromise;
};

export default function CheckoutButton() {
  const dispatch = useAppDispatch();
  const {
    loading: orderLoading,
    error: orderError,
    currentOrder,
  } = useAppSelector((state) => state.orderSlice);
  const { cart } = useAppSelector((state) => state.cartSlice);
  const { profile } = useAppSelector((state) => state.userSlice);
  const { defaultAddress, currentAddress } = useAppSelector(
    (state) => state.addressSlice
  );

  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (currentOrder?.sessionId) {
      const redirectToStripe = async () => {
        setCheckoutError(null);
        try {
          const stripe = await getStripe();
          if (!stripe) {
            setCheckoutError("Error initializing Stripe. Please try again.");
            return;
          }
          const { error } = await stripe.redirectToCheckout({
            sessionId: currentOrder.sessionId,
          });
          if (error) {
            console.error("Stripe redirectToCheckout error:", error);
            setCheckoutError(
              error.message || "An error occurred during checkout."
            );
          }
        } catch (err) {
          console.error("Error in redirectToStripe:", err);
          setCheckoutError(
            "An unexpected error occurred while processing your payment."
          );
        }
      };
      redirectToStripe();
    }
  }, [currentOrder]);

  const handleCheckout = useCallback(async () => {
    if (!profile) {
      setCheckoutError("You must be logged in to continue.");
      return;
    }

    if (!defaultAddress && !currentAddress) {
      setCheckoutError("You must select a shipping address.");
      return;
    }

    if (!cart || cart.items.length === 0) {
      setCheckoutError("Your cart is empty.");
      return;
    }

    setCheckoutError(null);
    try {
      const addressToUse = currentAddress || defaultAddress;
      if (!addressToUse) {
        setCheckoutError("Shipping address is missing."); // Doble chequeo por si acaso
        return;
      }
      await dispatch(
        createOrder({
          userId: profile.id,
          addressId: addressToUse.id,
        })
      ).unwrap();
    } catch (err) {
      console.error("Error creating order:", err);
      const errorMessage =
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof err.message === "string"
          ? err.message
          : typeof err === "string"
          ? err
          : "Could not create the order. Please try again.";
      setCheckoutError(errorMessage);
    }
  }, [dispatch, profile, cart, defaultAddress, currentAddress]);

  const deliveryFee = 15.0;
  const subtotal = cart?.total ?? 0;
  const ivaRate = 0.16;
  const ivaAmount = subtotal * ivaRate;
  const totalAmount = subtotal + deliveryFee + ivaAmount;

  const isDisabled =
    !profile ||
    (!defaultAddress && !currentAddress) ||
    !cart?.items?.length ||
    orderLoading;

  return (
    <div style={{ margin: "0", padding: "0", width: "100%" }}>
      <aside aria-labelledby="summary-heading" className="order-summary">
        <h2 id="summary-heading">Order Summary</h2>
        <ul>
          <li>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </li>
          <li>
            <span>Shipping Cost</span>
            <span>${deliveryFee.toFixed(2)}</span>
          </li>
          <li>
            <span>VAT ({(ivaRate * 100).toFixed(0)}%)</span>{" "}
            <span>${ivaAmount.toFixed(2)}</span>
          </li>
        </ul>
        <div className="order-total">
          <span>Total</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
        {checkoutError && <p className="error-message">{checkoutError}</p>}
        {orderError && (
          <p className="error-message">
            Order Error:{" "}
            {typeof orderError === "string" ? orderError : "An error occurred."}
          </p>
        )}
        <button
          onClick={handleCheckout}
          disabled={isDisabled}
          className="checkout-button"
          aria-live="polite"
          aria-disabled={isDisabled}
        >
          {orderLoading ? "Processing..." : "Pay with Stripe"}
        </button>
      </aside>
      <style jsx>{`
        .checkout-button {
          display: flex;
          height: 50px;
          padding: 0 30px;
          justify-content: center;
          align-items: center;
          gap: 12px;
          align-self: stretch;
          border-radius: 30px;
          background: var(--color-primary-gold, #b88e2f);
          color: #fff;
          font-size: clamp(0.9rem, 2.5vw, 1rem);
          font-style: normal;
          font-weight: 600;
          line-height: normal;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s ease-in-out,
            opacity 0.2s ease-in-out;
          text-transform: uppercase; /* Añadido */
          letter-spacing: 0.5px; /* Añadido */
          width: 100%; /* Que ocupe el ancho del contenedor */
          box-sizing: border-box;
          margin-top: 1rem; /* Espacio arriba del botón */
        }
        .checkout-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
          opacity: 0.7;
        }
        .order-summary {
          margin-top: 1.5rem;
          padding: 1.5rem;
          border: 1px solid #eee;
          border-radius: 8px;
          width: 100%; /* Ocupa el 100% del .checkout_content */
          max-width: 450px; /* Mantiene el max-width de móvil */
          margin-left: auto;
          margin-right: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          text-align: left; /* Alinea a la izquierda */
          box-sizing: border-box;
        }
        .order-summary h2 {
          margin-top: 0;
          font-size: 1.1rem;
          border-bottom: 1px solid #ddd;
          padding-bottom: 0.75rem;
          margin-bottom: 0.75rem;
          font-weight: 600; /* Añadido */
          text-align: center; /* Centrado */
        }
        .order-summary ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .order-summary li {
          display: flex;
          justify-content: space-between;
          padding: 0.6rem 0;
          font-size: 0.9rem;
        }
        .order-summary li:not(:last-child) {
          border-bottom: 1px dashed #eee;
        }
        .order-summary .order-total {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 1rem;
          padding-top: 0.75rem;
          margin-top: 0.75rem;
          border-top: 1px solid #ddd;
        }
        .error-message {
          color: red;
          text-align: center;
          font-size: 0.85rem;
          margin-top: 0.5rem;
        }

        @media (min-width: 768px) {
          .order-summary {
            margin-top: 0;
            max-width: none;
          }
          .checkout-button {
            height: 55px;
          }
        }
      `}</style>
    </div>
  );
}
