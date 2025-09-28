import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useFirebase } from "./FirebaseContext";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { setDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    fullName: ""
  });
  const navigate = useNavigate();
  const { login } = useFirebase();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        navigate("/dashboard");
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        // Save extra fields to Firestore
        await setDoc(doc(db, "users", user.uid), {
          email: formData.email,
          fullName: formData.fullName,
          businessName: formData.businessName,
          createdAt: new Date()
        });
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="w-full">
      {/* Toggle Buttons */}
      <div className="flex mb-6 bg-background rounded-lg p-1 border border-border">
        <button
          onClick={() => setIsLogin(true)}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            isLogin
              ? "bg-panel text-primary shadow-sm border border-border"
              : "text-muted hover:text-heading"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setIsLogin(false)}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            !isLogin
              ? "bg-panel text-primary shadow-sm border border-border"
              : "text-muted hover:text-heading"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Form */}
      <motion.form
        key={isLogin ? "login" : "signup"}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {!isLogin && (
          <>
            <div>
              <label className="block text-sm font-medium text-heading mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-lg bg-background text-body focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-heading mb-2">
                Business Name
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className="w-full p-3 border border-border rounded-lg bg-background text-body focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="Enter your business name"
                required
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-heading mb-2">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full p-3 border border-border rounded-lg bg-background text-body focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="Enter your email address"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-heading mb-2">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full p-3 border border-border rounded-lg bg-background text-body focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="Enter your password"
            required
          />
        </div>

        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-heading mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full p-3 border border-border rounded-lg bg-background text-body focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="Confirm your password"
              required
            />
          </div>
        )}

        {error && (
          <div className="bg-error/10 text-error text-sm rounded-lg px-4 py-2 mb-2 border border-error">{error}</div>
        )}

        <button
          type="submit"
          className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (isLogin ? "Signing In..." : "Creating Account...") : isLogin ? "Sign In" : "Create Account"}
        </button>
      </motion.form>

      {/* Additional Links */}
      <div className="mt-6 text-center">
        {isLogin ? (
          <p className="text-sm text-muted">
            Don't have an account?{" "}
            <button
              onClick={() => setIsLogin(false)}
              className="text-primary hover:text-primary/90 font-medium"
            >
              Sign up here
            </button>
          </p>
        ) : (
          <p className="text-sm text-muted">
            Already have an account?{" "}
            <button
              onClick={() => setIsLogin(true)}
              className="text-primary hover:text-primary/90 font-medium"
            >
              Sign in here
            </button>
          </p>
        )}
      </div>

      {/* Admin Link */}
      <div className="mt-4 text-center">
        <Link
          to="/admin/login"
          className="text-sm text-muted hover:text-heading underline"
        >
          Admin Access
        </Link>
      </div>
    </div>
  );
};

export default AuthForm; 