/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-expressions */
// components/AuthModal.tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import useAxiosPublic from "@/hooks/Axios/useAxiosPublic";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { mergeGuestUserWithRealUser } from "@/utils/merge";
import GoogleSignInButton from "./GoogleSignInButton";
import { pushGTMEvent } from "@/lib/gtm";

type ModalView =
  | "signin"
  | "create-account"
  | "password-reset"
  | "enter-password"
  | "change-password"
  | "otp-verification";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: ModalView;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialView = "signin",
}: AuthModalProps) {
  const [view, setView] = useState<ModalView>(initialView);
  const [email, setEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("+880");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [receivedOtp, setReceivedOtp] = useState("");

  const [verificationTarget, setVerificationTarget] = useState<
    "email" | "phone"
  >("email");

  const [useMobileForSignin, setUseMobileForSignin] = useState<boolean>(true);
  const [showTooltip, setShowTooltip] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const axiosPublic = useAxiosPublic();
  const { setUser, setToken } = useAuth();

  // validate password
  const validatePassword = (password: string) => {
    const minLength = /.{8,}/;
    const uppercase = /[A-Z]/;
    const lowercase = /[a-z]/;
    const number = /[0-9]/;

    const errorMessages = [];

    if (!minLength.test(password))
      errorMessages.push("Password must be at least 8 characters");
    if (!uppercase.test(password))
      errorMessages.push("Password must contain at least 1 uppercase letter");
    if (!lowercase.test(password))
      errorMessages.push("Password must contain at least 1 lowercase letter");
    if (!number.test(password))
      errorMessages.push("Password must contain at least 1 number");

    return errorMessages.length > 0 ? errorMessages.join(", ") : null; // valid
  };

  // validate phone Number
  const validatePhoneNumber = (mobileNumber: string) => {
    // +8801XXXXXXXXX (13 chars total)
    const bdPhoneRegex = /^\+8801[3-9]\d{8}$/;

    if (!bdPhoneRegex.test(mobileNumber)) {
      return "Enter a valid Bangladeshi mobile number (e.g. +8801712345678)";
    }

    return null; // valid
  };

  // handle mobile / email toggle
  const handleMobileSignIn = () => {
    useMobileForSignin ? setMobileNumber("") : setEmail("");

    setUseMobileForSignin(!useMobileForSignin);
    // window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  // handle change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      setLoading(false);
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    try {
      await axiosPublic.post(
        "/auth/change-password",
        {
          oldPassword,
          newPassword,
        },
        { withCredentials: true },
      );

      alert("Password changed successfully!");
      handleView("signin"); // redirect to signin after change
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ||
            "Failed to change password.",
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to change password.");
      }
    } finally {
      setLoading(false);
    }
  };

  // handle sign in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Get client IP
      // const ipResponse = await fetch("/api/get-ip");
      // const ipData = await ipResponse.json();
      // const clientIp = ipData.ip;

      interface Payload {
        password?: string;
        keepSignedIn: boolean;
        phone?: string | null;
        email?: string | null;
        // clientIp?: string; // Add client IP to payload
      }

      const payload: Payload = {
        // password,
        keepSignedIn,
        // clientIp,
      };

      if (useMobileForSignin) {
        payload.phone = mobileNumber;
      } else {
        payload.email = email;
      }

      const res = await axiosPublic.post("/auth/signin", payload, {
        withCredentials: true,
      });

      setReceivedOtp(
        res.data.otpDetails.message
          ? res.data.otpDetails.message
          : res.data.otpDetails,
      );

      const data = res.data;

      if (data.otpSentTo) {
        setVerificationTarget(data.otpSentTo);
        toast.success(
          `OTP sent to your ${useMobileForSignin ? "phone" : "email"}`,
        );
        handleView("otp-verification");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);

        await mergeGuestUserWithRealUser(data.token);
        pushGTMEvent({
          event: "login",
          method: useMobileForSignin ? "phone" : "email",
        });

        toast.success(`Welcome to Ondorkotha`);
        handleView("signin");
        onClose();
        // data.user.role === "CUSTOMER"
        //   ? router.push("/")
        //   : router.push("/admin/dashboard");
      }
    } catch (err: unknown) {
      let errorMessage = "";

      if (axios.isAxiosError(err)) {
        errorMessage =
          (err.response?.data as { message?: string })?.message ||
          err.message ||
          "";
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      // devLog(errorMessage, "erromssaa");

      if (errorMessage.includes("Too many attempts")) {
        setError(
          "Account temporarily locked. Please try again after a few minutes.",
        );
      } else if (!errorMessage) {
        setError("Invalid password. Please try again.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // handle sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // const passwordError = validatePassword(password);
    // if (passwordError) {
    //   setError(passwordError);
    //   setLoading(false);
    //   return;
    // }

    const phoneError = validatePhoneNumber(mobileNumber);
    if (phoneError) {
      setError(phoneError);
      setLoading(false);
      return;
    }

    try {
      interface payloadType {
        phone: string | null;
        email?: string | null;
        password?: string;
        name: string;
        keepSignedIn: boolean;
      }
      const payload: payloadType = {
        phone: mobileNumber,
        password: password || undefined,
        name: customerName,
        keepSignedIn,
      };

      if (email.trim()) {
        payload.email = email.trim();
      }

      const res = await axiosPublic.post("/auth/register", payload, {
        withCredentials: true,
      });

      setReceivedOtp(res.data.otpDetails);
      const data = res.data;

      if (data.status === "OTP_REQUIRED") {
        setVerificationTarget(data.otpSentTo);
        toast.success(`OTP sent to your ${mobileNumber ? "phone" : "email"}`);
        handleView("otp-verification");
      } else {
        localStorage.setItem("token", data.token);
        handleView("signin");
        onClose();
        window.location.reload();
      }
    } catch (err: unknown) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ||
            "Failed to create account.",
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create account.");
      }
    } finally {
      setLoading(false);
    }
  };

  // handle otp submit
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axiosPublic.post(
        "/auth/verify-otp",
        {
          code: otp,
          keepSignedIn,
          emailOrPhone:
            verificationTarget === "email" ? email : `${mobileNumber}`,
          type: verificationTarget,
        },
        {
          withCredentials: true,
        },
      );

      const data = res.data;
      const token = data.token;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(token);
      setUser(data.user);

      await mergeGuestUserWithRealUser(token);

      pushGTMEvent({
        event: data.user.isNewUser ? "sign_up" : "login",
        method: "phone",
      });

      toast.success(`Welcome to Ondorkotha`);
      handleView("signin");
      onClose();
      // router.push("/");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ||
            "Failed to create account.",
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create account.");
      }
    } finally {
      setLoading(false);
    }
  };

  // hanlde view change
  const handleView = (option: ModalView) => {
    setPassword("");
    setCustomerName("");
    setOtp("");
    setError("");
    setView(option);
  };

  // mobile number field
  const mobileNumberField = () => {
    return (
      <input
        type="tel"
        value={mobileNumber}
        onChange={(e) => {
          let value = e.target.value.replace(/[^\d+]/g, "");

          if (!value.startsWith("+880")) {
            value = "+880";
          }

          if (value.length > 14) return; // prevent overflow

          setMobileNumber(value);
        }}
        className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-gray-500"
        required
        placeholder="+880"
      />
    );
  };

  // password field
  const passWordField = () => {
    return (
      <div className="mb-4">
        <label className="block text-sm mb-2">Password*</label>
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-gray-500"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-sm blue-link hover:underline mt-2 cursor-pointer
          "
        >
          👁 {showPassword ? "Hide" : "Show"} Password
        </button>
        {/* {view === "signin" && (
          <button
            type="button"
            onClick={() => handleView("password-reset")}
            className="text-sm blue-link hover:underline mt-2 cursor-pointer inline-flex items-end
          "
          >
            Forgot Your Password?
          </button>
        )} */}
      </div>
    );
  };

  // keep sign signed info tooltip
  const keepMeSignedInInfo = () => {
    return (
      <div className="relative inline-block ml-1">
        <span
          onClick={() => setShowTooltip(!showTooltip)}
          className="text-gray-400 cursor-pointer select-none"
        >
          ⓘ
        </span>

        {showTooltip && (
          <div className="absolute z-50 top-7 left-1/2 -translate-x-1/2 w-64">
            {/* Tooltip box */}
            <div className="relative bg-gray-700 text-white text-xs p-3 rounded shadow-lg font-extralight">
              Selecting “keep me signed in” reduces the number of times you will
              be asked to sign in on this device. To keep your account secure,
              use this option only on your personal device.
              {/* Arrow */}
              <div
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 
                        border-l-8 border-r-8 border-b-8
                        border-l-transparent border-r-transparent
                        border-b-gray-700"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/20 transition-opacity duration-300 ease-out
    ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
  `}
    >
      <div
        className={`bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto relative
      transform-gpu transition  duration-300 ease-out
      ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"}
    `}
      >
        <button
          onClick={() => {
            handleView("signin");
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>

        <div className="px-8 py-20">
          {view === "signin" && (
            <>
              <h2 className="text-2xl font-light text-center mb-6 border-b border-gray-200 heading">
                Sign In
              </h2>
              <p className="text-sm text-gray-600 text-center mb-6">
                Sign in so you can save items to your wishlists, track your
                orders, and check out faster!
              </p>
              {/* google sign in */}
              <GoogleSignInButton />
              {/* or line */}
              <div className="mt-6">
                <div className="relative flex items-center gap-3 my-6">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs text-gray-400 uppercase tracking-widest">
                    or
                  </span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
              </div>
              {/* or email password sign in */}
              <form onSubmit={handleSignIn}>
                <div className="mb-4">
                  <label className="block text-sm mb-2">
                    {useMobileForSignin ? "Phone*" : "Email*"}
                  </label>
                  {useMobileForSignin ? (
                    mobileNumberField()
                  ) : (
                    <input
                      type={"email"}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                      }}
                      className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-gray-500"
                      required
                      placeholder={"example@gmail.com"}
                    />
                  )}
                </div>

                {/* password  */}
                {/* {passWordField()} */}

                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="keepSignedIn"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="keepSignedIn" className="text-sm">
                    Keep me signed in
                  </label>
                  {keepMeSignedInInfo()}
                </div>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-700 text-white py-3 rounded hover:bg-gray-800 disabled:opacity-50 heading mb-4"
                >
                  {loading ? "LOADING..." : "NEXT"}
                </button>

                {/* <p className="flex justify-center items-center w-full pb-4">
                  <button
                    type="button"
                    onClick={() => handleView("password-reset")}
                    className="text-sm blue-link hover:underline cursor-pointer
          "
                  >
                    Forgot Your Password?
                  </button>
                </p> */}

                <button
                  type="button"
                  onClick={handleMobileSignIn}
                  className="w-full border border-gray-300 py-3 rounded hover:bg-gray-50 mb-4"
                >
                  USE {!useMobileForSignin ? "MOBILE NUMBER" : "EMAIL"} INSTEAD
                </button>
              </form>
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-light text-center mb-4 heading">
                  Sign Up
                </h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Welcome! It&apos;s quick and easy to set up an account
                </p>
                <button
                  onClick={() => handleView("create-account")}
                  className="w-full border border-gray-700 text-gray-700 py-3 rounded hover:bg-gray-50 heading"
                >
                  CREATE AN ACCOUNT
                </button>
              </div>
            </>
          )}

          {/* create account / sign up  */}
          {view === "create-account" && (
            <>
              <h2 className="text-2xl font-light text-center heading mb-6 border-b border-gray-200">
                Create An Account
              </h2>
              <p className="text-sm text-gray-600 text-center mb-6">
                Welcome to Ondorkotha! It&apos;s quick and easy to set up an
                account.
              </p>
              {/* google sign up  */}
              <GoogleSignInButton label="Sign up with Google" />
              {/* or line */}
              <div className="relative flex items-center gap-3 my-4">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-xs text-gray-400 uppercase tracking-widest">
                  or
                </span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              {/* email and password sign up */}
              <form onSubmit={handleSignUp}>
                {/* name  */}
                <div className="mb-4">
                  <label className="block text-sm mb-2">Name*</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-gray-500"
                    required
                  />
                </div>
                {/* mobile number  */}
                <div className="mb-4">
                  <label className="block text-sm mb-2">Mobile Number*</label>
                  <div className="flex gap-2">{mobileNumberField()}</div>
                </div>
                {/* {passWordField()} */}
                {/* keep me signed in  */}
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="keepSignedInSignup"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="keepSignedInSignup" className="text-sm">
                    Keep me signed in
                  </label>
                  {keepMeSignedInInfo()}
                </div>
                {/* error  */}
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                {/* submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-700 text-white py-3 rounded hover:bg-gray-800 disabled:opacity-50 mb-4 heading"
                >
                  {loading ? "CREATING..." : "NEXT"}
                </button>
                {/* condition  */}
                <div className="text-xs text-gray-600">
                  By creating an account, you agree to Ondorkotha&apos;s{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    arbitration agreement
                  </a>
                  , conditions of use and privacy policy. Landlines, VoIP, and
                  prepaid phones are not supported.
                </div>
              </form>
              {/* already account  */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-light text-center mb-4 heading">
                  Already Have an Account?
                </h3>
                <button
                  onClick={() => handleView("signin")}
                  className="w-full border border-gray-700 text-gray-700 py-3 rounded hover:bg-gray-50 heading"
                >
                  SIGN IN
                </button>
              </div>
            </>
          )}

          {/* otp verification */}
          {view === "otp-verification" && (
            <>
              <h2 className="text-2xl font-light text-center mb-6 pb-3 border-b border-gray-200">
                OTP Verification
              </h2>
              <p className="text-sm text-gray-600 text-center mb-6">
                Enter the OTP sent to your{" "}
                <span className="font-semibold italic">
                  {verificationTarget}
                </span>
              </p>
              <form onSubmit={handleOtpSubmit}>
                <div className="mb-4">
                  <label className="block text-sm mb-2">OTP*</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-gray-500"
                    required
                  />
                </div>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-700 text-white py-3 rounded hover:bg-gray-800 disabled:opacity-50 mb-4"
                >
                  {loading ? "VERIFYING..." : "VERIFY OTP"}
                </button>
              </form>
            </>
          )}

          {view === "change-password" && (
            <>
              <h2 className="text-2xl font-light text-center mb-6">
                Change Password
              </h2>
              <form onSubmit={handleChangePassword}>
                {/* Old password */}
                <div className="mb-4">
                  <label className="block text-sm mb-2">Old Password*</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-gray-500"
                    required
                  />
                </div>

                {/* New password */}
                <div className="mb-4">
                  <label className="block text-sm mb-2">New Password*</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-gray-500"
                    required
                  />
                </div>

                {/* Confirm password */}
                <div className="mb-4">
                  <label className="block text-sm mb-2">
                    Confirm Password*
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-gray-500"
                    required
                  />
                </div>

                {/* Show password toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-sm blue-link hover:underline mt-2 cursor-pointer mb-4"
                >
                  👁 {showPassword ? "Hide" : "Show"} Passwords
                </button>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-700 text-white py-3 rounded hover:bg-gray-800 disabled:opacity-50 mb-4"
                >
                  {loading ? "CHANGING..." : "CHANGE PASSWORD"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
