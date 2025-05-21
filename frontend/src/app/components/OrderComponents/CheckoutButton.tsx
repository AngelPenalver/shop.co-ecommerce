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

    if (!defaultAddress) {
      setCheckoutError("You must select a shipping address.");
      return;
    }

    if (!cart || cart.items.length === 0) {
      setCheckoutError("Your cart is empty.");
      return;
    }

    setCheckoutError(null);
    try {
      await dispatch(
        createOrder({
          userId: profile.id,
          addressId: currentAddress?.id ? currentAddress.id : defaultAddress.id,
        })
      ).unwrap();
    } catch (err) {
      console.error("Error creating order:", err);
      const errorMessage =
        typeof err === "string"
          ? err
          : "Could not create the order. Please try again.";
      setCheckoutError(errorMessage);
    }
  }, [dispatch, profile, cart, defaultAddress, currentAddress?.id]);

  const deliveryFee = 15.0;
  const subtotal = cart?.total ?? 0;
  const ivaRate = 0.16;
  const ivaAmount = subtotal * ivaRate;
  const totalAmount = subtotal + deliveryFee + ivaAmount;

  const isDisabled =
    !profile || !defaultAddress || !cart?.items?.length || orderLoading; // Added !defaultAddress

  return (
    <div style={{ margin: "0", padding: "0" }}>
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
        {checkoutError && (
          <p style={{ color: "red", textAlign: "center" }}>{checkoutError}</p>
        )}
        {orderError && (
          <p style={{ color: "red", textAlign: "center" }}>
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
          {orderLoading ? "Processing..." : "Pay with Stripe"} {}
        </button>
      </aside>
      <style jsx>{`
        .checkout-button {
          display: flex;
          height: 60px;
          padding: 16px 54px;
          justify-content: center;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          align-self: stretch;
          border-radius: 62px;
          background: var(--color-primary-gold, #daa520); /* Fallback color */
          color: #fff;
          font-size: clamp(1rem, 3vw, 1.1rem);
          font-style: normal;
          font-weight: 500;
          line-height: normal;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s ease-in-out,
            opacity 0.2s ease-in-out;
        }
        .checkout-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
          opacity: 0.7;
        }
        .order-summary {
          margin-top: 20px;
          padding: 15px;
          border: 1px solid #eee;
          border-radius: 8px;
          width: 400px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          text-align: center;
        }
        .order-summary h2 {
          margin-top: 0;
          font-size: 1.2rem;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .order-summary ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .order-summary li {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }
        .order-summary li:not(:last-child) {
          border-bottom: 1px dashed #eee;
        }
        .order-summary .order-total {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 1.1rem;
          padding-top: 10px;
          margin-top: 10px;
          border-top: 1px solid #ddd;
        }
      `}</style>
    </div>
  );
}
