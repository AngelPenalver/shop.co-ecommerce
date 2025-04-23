"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingModal from "./LoadingModal";
import { useAppSelector, useAppDispatch } from "../hook";
import { setModalLoading } from "../lib/store/features/products/productsSlice";

export default function RouteHandler() {
  const dispatch = useAppDispatch();
  const showModal = useAppSelector((state) => state.productSlice.showModal);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleRouteChange = () => {
      dispatch(setModalLoading(true));
      const timer = setTimeout(() => dispatch(setModalLoading(false)), 1300);
      return () => clearTimeout(timer);
    };

    handleRouteChange();
  }, [pathname, searchParams, dispatch]);

  return showModal ? <LoadingModal /> : null;
}