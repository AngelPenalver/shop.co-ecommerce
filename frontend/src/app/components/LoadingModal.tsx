"use client";
import React, { useEffect } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { styled } from "@mui/system";

const Overlay = styled("div")({
  position: "fixed",
  top: 0,
  left: 0,
  zIndex: 9999,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backdropFilter: "blur(2px)",
  pointerEvents: "auto",
});

const ProgressContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1rem",
  color: "white",
});

export default function LoadingModal(): React.JSX.Element | null {
  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <Overlay role="alert" aria-live="assertive" aria-busy="true">
      <ProgressContainer>
        <CircularProgress size={60} thickness={4} color="inherit" />
      </ProgressContainer>
    </Overlay>
  );
}
