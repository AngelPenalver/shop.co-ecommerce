"use client";
import { TextField } from "@mui/material";
import { useAppSelector } from "../../hook";
import { useEffect, useRef } from "react";

export default function CreateAddressModal(): React.JSX.Element {
  const { showModal: showModalAddress } = useAppSelector(
    (state) => state.addressSlice
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (showModalAddress) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [showModalAddress]);
  return (
    <dialog ref={dialogRef}>
      <form>
        <div>
          <TextField />
        </div>
        <div>
          <TextField />
        </div>
        <div>
          <TextField />
        </div>
        <div>
          <TextField />
        </div>
        <div>
          <TextField />
        </div>
      </form>
    </dialog>
  );
}
