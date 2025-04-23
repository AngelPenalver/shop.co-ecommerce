import { useAppDispatch, useAppSelector } from "../hook";
import { setAlert } from "../lib/store/features/alert/alertSlice";
import {
  addProductToCart,
  setModalAddToCart,
} from "../lib/store/features/cart/cartSlice";
import { setModalLoading } from "../lib/store/features/products/productsSlice";

export const useAddToCart = () => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.cartSlice);
  const { profile } = useAppSelector((state) => state.userSlice);
  console.log(profile?.id)
  const handleAddToCart = async (
    productId: number,
    quantity: number,
    userId: string
  ) => {
    await dispatch(setModalLoading(true));
    await dispatch(setModalAddToCart(false));
    if (!profile) {
      setTimeout(() => {
        dispatch(setModalLoading(false));
        dispatch(
          setAlert({
            type: "error",
            message: "You must be logged in to add products to the cart.",
          })
        );
      }, 1300);
      return;
    }
    console.log(userId)
    const result = await dispatch(
      addProductToCart({ productId, quantity, userId })
    );
    if (addProductToCart.fulfilled.match(result)) {
      setTimeout(() => {
        dispatch(
          setAlert({ type: "success", message: "Product added successfully!" })
        );
        dispatch(setModalLoading(false));
      }, 1300);
    } else {
      setTimeout(() => {
        dispatch(
          setAlert({
            type: "error",
            message: "Error adding the product. Please try again.",
          })
        );
        dispatch(setModalLoading(false));
      }, 1300);
    }
  };

  return { handleAddToCart, loading };
};
