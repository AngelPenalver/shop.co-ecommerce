"use client";
import { useAppDispatch, useAppSelector } from "../hook";
import { setAlert } from "../lib/store/features/alert/alertSlice";
import {
  addProductToCart,
  fetchCart,
  removeFromCartFetch,
} from "../lib/store/features/cart/cartSlice";
import { setModalLoading } from "../lib/store/features/products/productsSlice";

interface CartProps {
  userId: string;
  productId: number;
  quantity: number;
}

export const useUpdateFromCart = () => {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.userSlice);

  const decrementItemFromCart = async ({
    userId,
    productId,
    quantity,
  }: CartProps) => {
    if (!profile) {
      dispatch(
        setAlert({
          message: "Please login to modify your cart",
          type: "error",
        })
      );
      return { success: false };
    }

    try {
      dispatch(setModalLoading(true));
      const response = await dispatch(
        removeFromCartFetch({ productId, quantity })
      );

      if (removeFromCartFetch.fulfilled.match(response)) {
        await dispatch(fetchCart(userId));
        dispatch(
          setAlert({
            message: "Item removed from cart",
            type: "success",
          })
        );
        return { success: true };
      } else {
        throw new Error(response.error?.message || "Failed to remove item");
      }
    } catch (error) {
      dispatch(
        setAlert({
          message: (error as string) || "Failed to remove item from cart",
          type: "error",
        })
      );
      return { success: false, error: error };
    } finally {
      dispatch(setModalLoading(false));
    }
  };

  const incrementItemFromCart = async ({
    userId,
    productId,
    quantity,
  }: CartProps) => {
    if (!profile) {
      dispatch(
        setAlert({
          message: "Please login to modify your cart",
          type: "error",
        })
      );
      return { success: false };
    }

    try {
      dispatch(setModalLoading(true));
      const response = await dispatch(
        addProductToCart({
          productId,
          quantity,
        })
      );

      if (addProductToCart.fulfilled.match(response)) {
        await dispatch(fetchCart(userId));
        dispatch(
          setAlert({
            message: "Item added to cart",
            type: "success",
          })
        );
        return { success: true };
      } else {
        dispatch(
          setAlert({
            message: response.error?.message || "Failed to add item",
            type: "error",
          })
        );
      }
    } catch (error) {
      dispatch(
        setAlert({
          message: (error as string) || "Failed to add item to cart",
          type: "error",
        })
      );
      return { success: false, error: error };
    } finally {
      dispatch(setModalLoading(false));
    }
  };

  return { decrementItemFromCart, incrementItemFromCart };
};
