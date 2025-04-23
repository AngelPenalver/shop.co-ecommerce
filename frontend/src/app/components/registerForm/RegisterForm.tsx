"use client";

import styles from "./RegisterForm.module.css";
import { useRegisterUser } from "../../hooks/useRegisterUser";
import { useAppDispatch } from "../../hook";
import { setAuthView } from "../../lib/store/features/user/userSlice";
import { TextField } from "@mui/material";

export default function RegisterForm(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const { register, errors, handleSubmit, onSubmit } = useRegisterUser();
  const handleChangeView = () => {
    dispatch(setAuthView("login"));
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.registerForm}>
      <h1>Register</h1>
      <div className={styles.formGroup}>
        <TextField
          label="First Name"
          variant="filled"
          color="primary"
          type="text"
          error={!!errors.first_name || !!errors.root }
          id="first_name"
          {...register("first_name", {
            required: { value: true, message: "First name is required" },
            minLength: { value: 2, message: "Minimum 2 characters" },
            pattern: {
              value: /^[a-zA-Z]+$/i,
              message: "Only letters are allowed",
            },
          })}
        />
        <div id={styles.error}>
          {(errors.first_name || errors.root) && (
            <span className={styles.errorMessage}>
              {errors.first_name?.message || errors.root?.message}
            </span>
          )}
        </div>
      </div>

      <div className={styles.formGroup}>
        <TextField
          label="Last Name"
          variant="filled"
          type="text"
          error={!!errors.last_name || !!errors.root }
          id="last_name"
          {...register("last_name", {
            required: { value: true, message: "Last name is required" },
            minLength: { value: 2, message: "Minimum 2 characters" },
            pattern: {
              value: /^[a-zA-Z]+$/i,
              message: "Only letters are allowed",
            },
          })}
        />
        <div id={styles.error}>
          {(errors.last_name || errors.root) && (
            <span className={styles.errorMessage}>
              {errors.last_name?.message || errors.root?.message}
            </span>
          )}
        </div>
      </div>
      <div className={styles.formGroup}>
        <TextField
          label="Email"
          variant="filled"
          id="email"
          error={!!errors.email || !!errors.root }
          {...register("email", {
            required: { value: true, message: "Email is required" },
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: "Enter a valid email address",
            },
          })}
        />
        <div id={styles.error}>
          {(errors.email || errors.root )&& (
            <span className={styles.errorMessage}>{errors.email?.message || errors.root?.message}</span>
          )}
        </div>
      </div>
      <div className={styles.formGroup}>
        <TextField
          type="password"
          label="Password"
          variant="filled"
          error={!!errors.password || !!errors.root }
          id="Password"
          {...register("password", {
            required: { value: true, message: "Password is required" },
            minLength: { value: 6, message: "Minimum 6 characters" },
          })}
        />
        <div id={styles.error}>
          {(errors.password || errors.root )&& (
            <span className={styles.errorMessage}>
              {errors.password?.message || errors.root?.message}
            </span>
          )}
        </div>
      </div>

      <button type="submit" className={styles.registerButton}>
        Register
      </button>
      <span className={styles.loginLink}>
        Already have an account? <a onClick={handleChangeView}>Login</a>
      </span>
    </form>
  );
}
