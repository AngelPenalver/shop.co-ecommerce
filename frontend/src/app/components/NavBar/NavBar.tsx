"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import styles from "./NavBar.module.css";
import Logo from "@/public/logo.svg";
import Account from "@/public/account_icon.svg";
import AccountLogout from "@/public/account_logout.svg";
import Favorites from "@/public/favorites_icon.svg";
import Cart from "@/public/cart_icon.svg";
import Image, { StaticImageData } from "next/image";
import { usePathname, useRouter } from "next/navigation";
import AccountModal from "../auth/AccountModal/AccountModal";
import { Search } from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../hook";
import { fetchAllProducts } from "../../lib/store/features/products/productsSlice";

interface NavItem {
  name: string;
  text?: string;
  link?: string;
  image: StaticImageData;
}

export default function NavBar(): React.JSX.Element {
  const router = useRouter();
  const { cart } = useAppSelector((state) => state.cartSlice);
  const { token, profile } = useAppSelector((state) => state.userSlice);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const accountRef = useRef<HTMLLIElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>(null);
  const pathname = usePathname();
  const [isSearch, setIsSearch] = useState(false);
  const [search, setSearch] = useState("");
  const dispatch = useAppDispatch();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleRoute = useCallback(
    (link: string) => {
      router.push(`/${link}`);
    },
    [router]
  );

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsModalOpen(true);
  }, []);

  const handleSearchNav = async () => {
    const params = {
      limit: 12,
      page: 1,
      ...(search && { search }),
    };

    if (isSearch) {
      await dispatch(fetchAllProducts(params));
    } else {
      router.push("/products");
      await dispatch(fetchAllProducts(params));
    }
  };
  const handleChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setSearch(value);
  };

  const navItems: Record<string, NavItem> = {
    account: {
      text:
        isClient && token && profile?.first_name
          ? `Hi, ${profile.first_name}`
          : "Welcome",
      name: isClient && token ? "Account" : "Sign In / Register",
      image: isClient && token && profile ? Account : AccountLogout,
    },
    cart: {
      name: "Cart",
      link: "cart",
      image: Cart,
    },
    favorites: {
      name: "Favorites",
      link: isClient && token ? "favorites" : undefined,
      image: Favorites,
    },
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (pathname === "/products") {
      setIsSearch(true);
    } else {
      setIsSearch(false);
    }
  }, [pathname]);

  const lengthCart = () => {
    const cartLength = cart?.items?.length;
    const quantityItem = cart?.items?.reduce((acc, item) => {
      return acc + item.quantity;
    }, 0);
    if (cartLength && quantityItem) {
      return quantityItem;
    } else {
      return 0;
    }
  };

  return (
    <nav className={styles.navBarContainer} aria-label="Main navigation">
      <div className={styles.logoContainer}>
        <Image
          src={Logo}
          height={41}
          width={185}
          alt="Company Logo"
          className={styles.logo}
          onClick={() => handleRoute("")}
          priority
          style={{ cursor: "pointer" }}
        />
      </div>
      <div id={styles.search}>
        <input
          placeholder="Search for products, brands, and more..."
          onChange={handleChangeInput}
        />
        <div onClick={handleSearchNav}>
          <Search color="inherit" height={4} width={40} />
        </div>
      </div>

      <ul className={styles.nav_list} role="menubar">
        {Object.entries(navItems).map(([key, { name, link, image, text }]) => (
          <li
            key={key}
            className={styles.nav_item}
            onClick={link ? () => handleRoute(link) : undefined}
            onMouseEnter={key === "account" ? handleMouseEnter : undefined}
            ref={key === "account" ? accountRef : null}
            role="menuitem"
            tabIndex={0}
          >
            <Image
              src={image}
              alt={name}
              width={32}
              height={32}
              className={styles.icon}
              aria-hidden="true"
            />

            <div className={styles.nav_text}>
              {key === "account" && (
                <p id={styles.user} aria-label="User greeting">
                  {text}
                </p>
              )}
              {key === "cart" && (
                <p id={styles.quantity} aria-label="Cart items count">
                  {lengthCart()}
                </p>
              )}
              <span className={styles.navText}>{name}</span>
            </div>
          </li>
        ))}
      </ul>

      <AccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        anchorElement={accountRef.current}
      />
    </nav>
  );
}
