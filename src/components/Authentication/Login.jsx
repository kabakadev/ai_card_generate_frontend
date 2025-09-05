// src/components/Authentication/Login.jsx
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

const validationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function Login() {
  const { login } = useUser();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const initialValues = useMemo(() => ({ email: "", password: "" }), []);
  const toggleShowPassword = () => setShowPassword((s) => !s);

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
                Welcome Back
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                Sign in to continue learning
              </Typography>
            </Box>

            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={async (
                values,
                { setSubmitting, setErrors, setStatus }
              ) => {
                // extra guard against accidental double-submit
                if (setSubmitting.__locked) return;
                setSubmitting.__locked = true;

                // normalize inputs
                const payload = {
                  email: values.email.trim(),
                  password: values.password,
                };

                setStatus(undefined);
                setErrors({});

                try {
                  const ok = await login(payload.email, payload.password);
                  if (ok) navigate("/dashboard");
                } catch (error) {
                  const msg = error?.message || "Login failed";
                  const status = error?.status;

                  // Common mappings (adjust to your backend messages if needed)
                  if (
                    status === 401 ||
                    /invalid|incorrect|unauthorized/i.test(msg)
                  ) {
                    setStatus("Invalid email or password.");
                  } else if (status === 400) {
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
                    id="password"
                    name="password"
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.password && Boolean(errors.password)}
                    helperText={touched.password && errors.password}
                    sx={{ mb: 3 }}
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
                    {isSubmitting ? "Signing in..." : "Sign in"}
                  </Button>

                  <Typography
                    variant="body2"
                    align="center"
                    sx={{ color: "text.secondary" }}
                  >
                    Don&apos;t have an account?{" "}
                    <Link
                      component={RouterLink}
                      to="/signup"
                      sx={{
                        color: (theme) => theme.palette.secondary.main,
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      Sign up here
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
