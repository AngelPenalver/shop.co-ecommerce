"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import styles from "./NavBar.module.css";
import Logo from "@/public/logo.svg";
import AccountIcon from "@/public/account_icon.svg"; // Renombrado para claridad
import AccountLogoutIcon from "@/public/account_logout.svg"; // Renombrado
import FavoritesIcon from "@/public/favorites_icon.svg"; // Renombrado
import CartIcon from "@/public/cart_icon.svg"; // Renombrado
import Image, { StaticImageData } from "next/image";
import { usePathname, useRouter } from "next/navigation";
import AccountModal from "../auth/AccountModal/AccountModal"; // Este es el dropdown para desktop
import { Search } from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../hook";
import { fetchAllProducts } from "../../lib/store/features/products/productsSlice";
import {
  setModalAuth,
  setAuthView,
  logoutUser, // Importa logoutUser
} from "../../lib/store/features/user/userSlice";
import { setModalLoading } from "../../lib/store/features/products/productsSlice"; // Importa
import { clearCart } from "../../lib/store/features/cart/cartSlice"; // Importa

interface NavItemConfig {
  key: string;
  name: string;
  text?: string;
  link?: string;
  image: StaticImageData;
  action?: () => void; // Para acciones directas como logout
  isAccountOption?: boolean; // Para identificar sub-items de cuenta
  requiresAuth?: boolean; // Para items que solo aparecen si estás logueado
}

export default function NavBar(): React.JSX.Element {
  const router = useRouter();
  const { cart } = useAppSelector((state) => state.cartSlice);
  const { token, profile } = useAppSelector((state) => state.userSlice);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false); // Para el AccountModal de desktop
  const [isClient, setIsClient] = useState(false);
  const accountRef = useRef<HTMLLIElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useAppDispatch();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileAccountSubMenuOpen, setIsMobileAccountSubMenuOpen] =
    useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleRoute = useCallback(
    (link: string) => {
      router.push(link === "" ? "/" : `/${link}`);
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        setIsMobileAccountSubMenuOpen(false);
      }
    },
    [router, isMobileMenuOpen]
  );

  const handleMouseEnterAccountDesktop = useCallback(() => {
    if (!isMobileMenuOpen) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      setIsAccountDropdownOpen(true);
    }
  }, [isMobileMenuOpen]);

  const handleMouseLeaveAccountDesktop = useCallback(() => {
    if (!isMobileMenuOpen) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsAccountDropdownOpen(false);
      }, 300);
    }
  }, [isMobileMenuOpen]);

  const handleSearchNav = async () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
      setIsMobileAccountSubMenuOpen(false);
    }
  };

  const handleChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleLogout = async () => {
    dispatch(setModalLoading(true));
    await dispatch(logoutUser());
    await dispatch(clearCart());
    setIsAccountDropdownOpen(false);
    setIsMobileAccountSubMenuOpen(false);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    setTimeout(() => {
      dispatch(setModalLoading(false));
    }, 1000);
  };

  const baseNavItems: NavItemConfig[] = [
    {
      key: "account",
      text:
        isClient && token && profile?.first_name
          ? `Hi, ${profile.first_name}`
          : "Welcome",
      name: isClient && token ? "Account" : "Sign In / Register",
      image: isClient && token && profile ? AccountIcon : AccountLogoutIcon,
    },
    {
      key: "cart",
      name: "Cart",
      link: "cart",
      image: CartIcon,
    },
  ];

  const accountSubMenuItems: NavItemConfig[] = [
    {
      key: "logout",
      name: "Sign Out",
      image: AccountLogoutIcon,
      action: handleLogout,
      isAccountOption: true,
    },
  ];

  const getVisibleNavItems = () => {
    let items = baseNavItems.filter(
      (item) => !item.requiresAuth || (isClient && token)
    );

    if (isMobileMenuOpen && isMobileAccountSubMenuOpen && isClient && token) {
      const accountItemIndex = items.findIndex(
        (item) => item.key === "account"
      );
      if (accountItemIndex !== -1) {
        items.splice(accountItemIndex + 1, 0, ...accountSubMenuItems);
      }
    }
    return items;
  };

  const visibleNavItems = getVisibleNavItems();

  useEffect(() => {
    const currentHoverTimeout = hoverTimeoutRef.current;
    return () => {
      if (currentHoverTimeout) {
        clearTimeout(currentHoverTimeout);
      }
    };
  }, []);

  const cartItemCount = useCallback(() => {
    return (
      cart?.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0
    );
  }, [cart]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isMobileMenuOpen) {
      setIsMobileAccountSubMenuOpen(false);
    }
  };

  const handleAccountItemClick = () => {
    if (isClient && token && profile) {
      if (isMobileMenuOpen) {
        setIsMobileAccountSubMenuOpen((prev) => !prev);
      } else {
        setIsAccountDropdownOpen((prev) => !prev);
      }
    } else {
      dispatch(setModalAuth(true));
      dispatch(setAuthView("login"));
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
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

      <div className={styles.searchContainer}>
        <input
          placeholder="Search for products, brands, and more..."
          onChange={handleChangeInput}
          value={searchTerm}
          onKeyDown={(e) => e.key === "Enter" && handleSearchNav()}
          className={styles.searchInput}
        />
        <div
          onClick={handleSearchNav}
          role="button"
          tabIndex={0}
          className={styles.searchButton}
        >
          <Search />
        </div>
      </div>

      <button
        className={`${styles.menuToggle} ${
          isMobileMenuOpen ? styles.open : ""
        }`}
        onClick={toggleMobileMenu}
        aria-expanded={isMobileMenuOpen}
        aria-label="Toggle navigation menu"
      >
        <span />
        <span />
        <span />
      </button>

      <ul
        className={`${styles.navList} ${isMobileMenuOpen ? styles.open : ""}`}
        role="menubar"
      >
        {visibleNavItems.map(
          ({ key, name, link, image, text, action, isAccountOption }) => (
            <li
              key={key}
              className={`${styles.navItem} ${
                isAccountOption ? styles.subItem : ""
              }`}
              onClick={() => {
                if (action) {
                  action();
                } else if (key === "account") {
                  handleAccountItemClick();
                } else if (link) {
                  handleRoute(link);
                }
              }}
              onMouseEnter={
                key === "account" && isClient && token && !isMobileMenuOpen
                  ? handleMouseEnterAccountDesktop
                  : undefined
              }
              onMouseLeave={
                key === "account" && isClient && token && !isMobileMenuOpen
                  ? handleMouseLeaveAccountDesktop
                  : undefined
              }
              ref={key === "account" && !isAccountOption ? accountRef : null}
              role="menuitem"
              tabIndex={0}
            >
              <Image
                src={image}
                alt={name}
                width={isAccountOption ? 24 : 32}
                height={isAccountOption ? 24 : 32}
                className={styles.icon}
                aria-hidden="true"
              />
              <div className={styles.navTextContainer}>
                {key === "account" && !isAccountOption && (
                  <p className={styles.userText}>{text}</p>
                )}
                {key === "cart" && isClient && token && cartItemCount() > 0 && (
                  <p className={styles.itemQuantity}>{cartItemCount()}</p>
                )}
                <span className={styles.itemName}>{name}</span>
              </div>
            </li>
          )
        )}
      </ul>

      {isClient && token && profile && !isMobileMenuOpen && (
        <AccountModal
          isOpen={isAccountDropdownOpen}
          onClose={() => setIsAccountDropdownOpen(false)}
          anchorElement={accountRef.current}
        />
      )}
    </nav>
  );
}
