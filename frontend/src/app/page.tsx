"use client";
import styles from "./page.module.css";
import CardSpaces from "./components/cardSpaces/CardSpaces";
import ImageDining from "../../public/dining_image.png";
import ImageLiving from "../../public/living_image.png";
import ImageBedroom from "../../public/bedroom_image.png";
import CardProduct from "./components/cardProduct/cardProducts";
import { useSelector } from "react-redux";
import { RootState } from "./lib/store";
import { useEffect } from "react";
import { useAppDispatch } from "./hook";
import {
  clearCurrentProduct,
  fetchAllProducts,
} from "./lib/store/features/products/productsSlice";
import Link from "next/link";

const PRODUCTS_TO_SHOW_ON_HOME = 12;

export default function Home(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const { products, loading, error } = useSelector(
    (state: RootState) => state.productSlice
  );

  useEffect(() => {
    if (products.length < PRODUCTS_TO_SHOW_ON_HOME || products.length === 0) {
      dispatch(
        fetchAllProducts({
          page: 1,
          limit: PRODUCTS_TO_SHOW_ON_HOME,
          filterBy: "create_at",
          sortOrder: "DESC",
        })
      );
    }
  }, [dispatch, products.length]);

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
          <Link
            href={"/products"}
            style={{ color: "#fff", textDecoration: "none" }}
          >
            <button
              aria-label="Browse our new collection"
              style={{ cursor: "pointer" }}
            >
              BUY NOW
            </button>
          </Link>
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
        <h2 id="products-heading">Our Products</h2>
        {loading && products.length === 0 && <p>Loading products...</p>}

        {!loading && products.length === 0 && !error && (
          <p>There are no featured products available at this time.</p>
        )}
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
        <Link href={"/products"} id={styles.show_button}>
          Explorer more
        </Link>
      </section>
    </main>
  );
}
