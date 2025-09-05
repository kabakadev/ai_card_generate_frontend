// src/components/Authentication/SignUp.jsx
"use client";

import { useState, useMemo } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Link,
  Box,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { motion } from "framer-motion";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import ThemeToggle from "../ThemeComponents/ThemeToggle";

// --- Validation schema ---
const validationSchema = Yup.object({
  email: Yup.string()
    .matches(/^[\w.-]+@[\w.-]+\.\w+$/, "Invalid email address")
    .required("Email is required"),
  username: Yup.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .required("Username is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Password confirmation is required"),
});

export default function SignUp() {
  const { signup } = useUser();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const initialValues = useMemo(
    () => ({ email: "", username: "", password: "", confirmPassword: "" }),
    []
  );

  const toggleShowPassword = () => setShowPassword((s) => !s);
  const toggleShowConfirmPassword = () => setShowConfirmPassword((s) => !s);

  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <ThemeToggle />
      </Box>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          sx={{
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 0 0 1px rgba(0, 0, 0, 0.5)"
                : "0 0 0 1px rgba(0, 0, 0, 0.1)",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ mb: 3, textAlign: "center" }}>
              <Typography
                component="h1"
                variant="h4"
                sx={{ fontWeight: "bold", color: "text.primary", mb: 1 }}
              >
                Create Account
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                Join Flashlearn and start your learning journey
              </Typography>
            </Box>

            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={async (
                values,
                { setSubmitting, setErrors, setStatus }
              ) => {
                // One-shot guard (Formik also disables the button via isSubmitting)
                if (setSubmitting.__locked) return;
                setSubmitting.__locked = true;

                // Trim inputs to avoid accidental whitespace causing false "exists"
                const payload = {
                  email: values.email.trim(),
                  username: values.username.trim(),
                  password: values.password,
                };

                setStatus(undefined);
                setErrors({});

                try {
                  const ok = await signup(
                    payload.email,
                    payload.username,
                    payload.password
                  );
                  if (ok) navigate("/dashboard");
                } catch (error) {
                  // Map common backend messages / statuses to fields
                  const msg = error?.message || "Signup failed";
                  const status = error?.status;

                  if (status === 409 || /already exists/i.test(msg)) {
                    if (/user(name)?/i.test(msg)) {
                      setErrors({ username: msg });
                    } else if (/email/i.test(msg)) {
                      setErrors({ email: msg });
                    } else {
                      setStatus(msg);
                    }
                  } else if (status === 400 || /invalid/i.test(msg)) {
                    setStatus(msg);
                  } else {
                    setStatus(msg);
                  }
                } finally {
                  setSubmitting(false);
                  setSubmitting.__locked = false;
                }
              }}
            >
              {({
                isSubmitting,
                errors,
                touched,
                handleChange,
                handleBlur,
                values,
                status,
              }) => (
                <Form noValidate>
                  {status && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {status}
                    </Alert>
                  )}

                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Email"
                    autoComplete="email"
                    autoFocus
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    id="username"
                    name="username"
                    label="Username"
                    autoComplete="username"
                    value={values.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.username && Boolean(errors.username)}
                    helperText={touched.username && errors.username}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    id="password"
                    name="password"
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.password && Boolean(errors.password)}
                    helperText={touched.password && errors.password}
                    sx={{ mb: 2 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={toggleShowPassword}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={
                      touched.confirmPassword && Boolean(errors.confirmPassword)
                    }
                    helperText={
                      touched.confirmPassword && errors.confirmPassword
                    }
                    sx={{ mb: 3 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={toggleShowConfirmPassword}
                            edge="end"
                          >
                            {showConfirmPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    component={motion.button}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    fullWidth
                    size="large"
                    variant="contained"
                    type="submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    sx={{
                      bgcolor: (theme) => theme.palette.primary.main,
                      color: (theme) =>
                        theme.palette.mode === "dark"
                          ? "white"
                          : "text.primary",
                      "&:hover": {
                        bgcolor: (theme) => theme.palette.primary.light,
                      },
                      mb: 2,
                    }}
                  >
                    {isSubmitting ? "Creating account..." : "Create account"}
                  </Button>

                  <Typography
                    variant="body2"
                    align="center"
                    sx={{ color: "text.secondary" }}
                  >
                    Already have an account?{" "}
                    <Link
                      component={RouterLink}
                      to="/login"
                      sx={{
                        color: (theme) => theme.palette.secondary.main,
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      Sign in here
                    </Link>
                  </Typography>
                </Form>
              )}
            </Formik>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
}
