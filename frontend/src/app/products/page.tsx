"use client";
import { useEffect } from "react";
import CardProduct from "../components/cardProduct/cardProducts";
import FilterBar from "../components/filterBar/FilterBar";
import { useAppDispatch, useAppSelector } from "../hook";
import styles from "./page.module.css";
import { fetchAllProducts } from "../lib/store/features/products/productsSlice";

export default function ProductsPage(): React.JSX.Element {
  const { products } = useAppSelector((state) => state.productSlice);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchAllProducts({ limit: 12 }));
  }, [dispatch]);

  return (
    <section>
      <FilterBar />
      <ul className={styles.products_grid}>
        {products.map((product) => (
          <li key={product.id}>
            <CardProduct
              id={product.id}
              image={product.image}
              title={product.name}
              price={product.price}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
