"use client";
import styles from "./page.module.css";
import CardSpaces from "./components/cardSpaces/CardSpaces";
import ImageDining from "../../public/dining_image.png";
import ImageLiving from "../../public/living_image.png";
import ImageBedroom from "../../public/bedroom_image.png";
import CardProduct from "./components/cardProduct/cardProducts";
import { useSelector } from "react-redux";
import { RootState } from "./lib/store";
import { useEffect, useState } from "react";
import { useAppDispatch } from "./hook";
import {
  clearCurrentProduct,
  fetchAllProducts,
} from "./lib/store/features/products/productsSlice";

export default function Home(): React.JSX.Element {
  const [scroll, setScroll] = useState(12);
  const dispatch = useAppDispatch();
  const products = useSelector(
    (state: RootState) => state.productSlice.products
  );

  useEffect(() => {
    dispatch(fetchAllProducts());
  }, [dispatch]);

  useEffect(() => {
    dispatch(clearCurrentProduct());
  }, [dispatch]);

  return (
    <main className={styles.home_contain}>
      <header className={styles.home_header}>
        <article className={styles.hero_content}>
          <span>New Arrival</span>
          <h1>
            Discover Our <br />
            New Collection
          </h1>
          <p>
            Explore our exclusive collection of furniture designed to transform
            your spaces.
          </p>
          <button aria-label="Browse our new collection">BUY NOW</button>
        </article>
      </header>

      <section className={styles.home_content} aria-labelledby="browse-heading">
        <div className={styles.home_content_header}>
          <h2 id="browse-heading">Browse The Range</h2>
          <p>Discover our curated selection of furniture for every space.</p>
        </div>
        <ul className={styles.home_content_adverting}>
          <li>
            <CardSpaces name="Dining" image={ImageDining} />
          </li>
          <li>
            <CardSpaces name="Living" image={ImageLiving} />
          </li>
          <li>
            <CardSpaces name="Bedroom" image={ImageBedroom} />
          </li>
        </ul>
      </section>

      <section
        className={styles.cards_content_products}
        aria-labelledby="products-heading"
      >
        <h2 id="products-heading" hidden>
          Featured Products
        </h2>
        <ul className={styles.products_grid}>
          {products?.slice(0, Math.max(0, scroll)).map((product) => (
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
        <button
          onClick={() => {
            setScroll((prev) => prev + 4);
          }}
          id={styles.show_button}
          aria-label="Load more products"
        >
          Show More
        </button>
      </section>
    </main>
  );
}
