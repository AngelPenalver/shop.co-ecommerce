"use client";
import { TextField } from "@mui/material";
import { useAppDispatch } from "../../hook";
import { useLoginUser } from "../../hooks/useLoginUser";
import { setAuthView } from "../../lib/store/features/user/userSlice";
import styles from "./LoginForm.module.css";

export default function LoginForm(): React.JSX.Element {
  const { register, onSubmit, handleSubmit, errors } = useLoginUser();
  const dispatch = useAppDispatch();

  const handleChangeModal = () => {
    dispatch(setAuthView("register"));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.loginForm}>
      <h1>Sign in</h1>
      <div className={styles.formGroup}>
        <TextField
          label="Email"
          variant="filled"
          error={!!errors.email || !!errors.root}
          id="Email"
          {...register("email", {
            required: { value: true, message: "Email is required" },
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: "Enter a valid email address",
            },
          })}
        />

        <div id={styles.error}>
          {(errors.email || errors.root) && (
            <span>
              {errors.email?.message || errors.root?.message}
            </span>
          )}
        </div>
      </div>
      <div className={styles.formGroup}>
        <TextField
        type="password"
          label="Password"
          variant="filled"
          error={!!errors.password || !!errors.root}
          id="Password"
          {...register("password", {
            required: { value: true, message: "Password is required" },
            minLength: { value: 8, message: "Minimum 8 characters" },
          })}
        />
        <div id={styles.error}>
          {(errors.password || errors.root) && (
            <span className={styles.errorMessage}>
              {errors.password?.message || errors.root?.message}
            </span>
          )}
        </div>
      </div>
      <button type="submit">Login</button>
      <span className={styles.registerLink}>
        Don&apos;t have an account? <a onClick={handleChangeModal}>Register</a>
      </span>
    </form>
  );
}
