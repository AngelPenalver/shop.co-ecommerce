"use client";
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hook";
import {
  fetchAllAddress,
  setAddressToEdit,
  setCurrentAddress,
  updateDefaultAddress,
} from "../../../lib/store/features/address/addressSlice";
import ShipTo from "../ShipTo";
import { setAlert } from "../../../lib/store/features/alert/alertSlice";
import CreateAddressForm from "../CreateAddres/CreateAddressForm";
import { setModalLoading } from "../../../lib/store/features/products/productsSlice";
import styles from "./Address.module.css";
import EditAddressForm from "../EditAddressForm/EditAddressForm";

export default function Address() {
  const { addresses, defaultAddress, currentAddress } = useAppSelector(
    (state) => state.addressSlice
  );
  const { profile } = useAppSelector((state) => state.userSlice);
  const dispatch = useAppDispatch();
  const [addressView, setAddressView] = useState<
    "currentAddress" | "editAddress" | "changeAddress" | "createAddress"
  >("currentAddress");

  useEffect(() => {
    if (profile?.id) {
      dispatch(fetchAllAddress(profile.id));
    }
  }, [dispatch, profile?.id]);

  const handleChangeView = (
    newView:
      | "currentAddress"
      | "editAddress"
      | "changeAddress"
      | "createAddress"
  ) => {
    setAddressView(newView);
  };

  const handleSelectNewDefaultAddress = (addressId: number) => {
    dispatch(updateDefaultAddress(addressId));
    dispatch(
      setAlert({ message: "Default address updated!", type: "success" })
    );
    setAddressView("currentAddress");
  };

  const handleSelectAddressToShip = async (addressId: number) => {
    dispatch(setModalLoading(true));
    const selectedAddress = addresses.find((addr) => addr.id === addressId);

    if (!selectedAddress) {
      dispatch(setAlert({ message: "Address not found!", type: "error" }));
      return;
    }
    await dispatch(setCurrentAddress(selectedAddress));
    setTimeout(() => {
      dispatch(setModalLoading(false));
      setAddressView("currentAddress");
    }, 1300);
  };

  const handleEditAddress = (id: number) => {
    const address = addresses.find((address) => address.id === id);
    dispatch(setAddressToEdit(address));
    setAddressView("editAddress");
  };

  useEffect(() => {
    dispatch(setModalLoading(true));
    setTimeout(() => {
      dispatch(setModalLoading(false));
    }, 1300);
  }, [addressView, dispatch]);

  if (addressView === "currentAddress") {
    return (
      <div className={styles.addressContainer}>
        {!currentAddress ? (
          defaultAddress && <ShipTo shippingAddress={defaultAddress} />
        ) : (
          <ShipTo shippingAddress={currentAddress} />
        )}
        <a onClick={() => handleChangeView("changeAddress")}>Change</a>
      </div>
    );
  }

  if (addressView === "editAddress") {
    return (
      <div className={styles.editAddressContainer}>
        <EditAddressForm setAddressView={setAddressView} />
        <button
          type="button"
          onClick={() => handleChangeView("currentAddress")}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (addressView === "changeAddress") {
    return (
      <div className={styles.changeAddressContainer}>
        {addresses && addresses.length > 0 ? (
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {addresses.map((addr) => (
              <li key={addr.id}>
                <ShipTo shippingAddress={addr} />{" "}
                {addr.id !== defaultAddress?.id && (
                  <a onClick={() => handleSelectAddressToShip(addr.id)}>
                    Select
                  </a>
                )}
                {addr.id === defaultAddress?.id && (
                  <span style={{ color: "green" }}> (Default)</span>
                )}
                {addr.id !== defaultAddress?.id && (
                  <a onClick={() => handleSelectNewDefaultAddress(addr.id)}>
                    Set as Default
                  </a>
                )}
                <a onClick={() => handleEditAddress(addr.id)}>Edit</a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No other addresses available. Please create a new one.</p>
        )}
        <div className={styles.buttonContainer}>
          <button onClick={() => handleChangeView("currentAddress")}>
            Back
          </button>
          <button onClick={() => handleChangeView("createAddress")}>
            Add new address
          </button>
        </div>
      </div>
    );
  }

  if (addressView === "createAddress") {
    return (
      <div className={styles.createAddressContainer}>
        <CreateAddressForm setAddressView={setAddressView} />
        <button
          type="button"
          onClick={() => handleChangeView("currentAddress")}
        >
          Cancel
        </button>
      </div>
    );
  }

  return <div>Loading address information or invalid view...</div>;
}
