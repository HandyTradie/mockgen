import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ArrowRightIcon from "@heroicons/react/outline/ArrowRightIcon";
import { CircularProgress } from "@mui/material";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import InputBase from "../components/FormElements/InputBase";
import UserModel from "../models/User";
import { auth } from "../firebase";
import { errorMessages, validateEmail, validatePassword } from "../utils/validators";
import toast from "react-hot-toast";
import "../firebase";

const AuthPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [signin, setSignin] = useState(true);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");

  const handleCompleteAuth = async (userData) => {
    setLoading(true);

    try {
      if (!userData) throw new Error("Failed to fetch user details");

      // Create/fetch user in database
      const cred = await UserModel.createFirebaseUserDetails(userData?.uid, userData);

      // Handle model errors
      if (cred?.error) throw new Error();

      // Navigate to dashboard
      toast.success("Successfully signed in");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      setForgotPasswordMessage("Something went wrong. Check your email or Password and retry.");
    }

    setLoading(false);
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email.trim());
      setEmail("");
      setForgotPasswordMessage("success");
    } catch (error) {
      setForgotPasswordMessage("An error occurred, check your email and try again");
    }
    setLoading(false);
  };

  const handleAuth = async () => {
    setForgotPasswordMessage("");

    try {
      setLoading(true);
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (credential.user) {
        return handleCompleteAuth(credential.user);
      }
    } catch (error) {
      console.error(error);
      const errorCode = error.code;

      switch (errorCode) {
        case "auth/email-already-in-use":
          // handleLogin();
          setForgotPasswordMessage("Email already exist, login to continue");
          setLoading(false);
          break;
        case "auth/invalid-email":
          setForgotPasswordMessage(`Email address ${email} is invalid.`);
          setLoading(false);
          break;
        case "auth/operation-not-allowed":
          setForgotPasswordMessage(`Error during sign up.`);
          setLoading(false);
          break;
        case "auth/weak-password":
          setForgotPasswordMessage("Password is not strong enough. Add additional characters including special characters and numbers.");
          setLoading(false);
          break;
        default:
          setForgotPasswordMessage("error: " + error.message);
          setLoading(false);
          break;
      }
    }
  };

  const handleLogin = async () => {
    setForgotPasswordMessage("");
    try {
      setLoading(true);
      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (credential.user) {
        return handleCompleteAuth(credential.user);
      }
    } catch (error) {
      setForgotPasswordMessage("Invalid email or password, try again");
      setLoading(false);
    }
  };

  return (
    <section className="h-[80vh] flex items-center justify-center font-dm-sans">
      <div className="w-full px-6">
        <div className="">
          <div className="flex items-center justify-center h-full">
            <div className="max-w-[574px] w-full space-y-4">
              {!forgotPassword ? (
                <>
                  <h1 className="font-medium text-mobile-h2">{signin ? " Sign In" : "Create an account"} </h1>
                  <InputBase
                    name="email"
                    label="Email"
                    type="email"
                    ariaLabel="Email"
                    value={email}
                    disabled={loading}
                    onChange={(val) => setEmail(val)}
                  />
                  <InputBase
                    name="password"
                    label="Password"
                    type="password"
                    ariaLabel="Password"
                    value={password}
                    disabled={loading}
                    onChange={(val) => setPassword(val)}
                  />
                  <div className="text-left">
                    {forgotPasswordMessage.length > 0 ? (
                      forgotPasswordMessage === "success" ? (
                        <span className="text-lime-700">Reset Email sent</span>
                      ) : (
                        <span className="text-red-600">{forgotPasswordMessage}</span>
                      )
                    ) : (
                      ""
                    )}
                  </div>
                  {signin ? (
                    <div className="flex justify-end">
                      <div
                        className="cursor-pointer "
                        onClick={() => {
                          setForgotPassword(true);
                        }}
                      >
                        Forgot Password?
                      </div>
                    </div>
                  ) : null}
                  <button
                    disabled={loading}
                    onClick={() => {
                      if (signin) {
                        if (validateEmail(email) && validatePassword(password)) {
                          handleLogin();
                        } else {
                          !validateEmail(email)
                            ? setForgotPasswordMessage(errorMessages("email"))
                            : setForgotPasswordMessage(errorMessages("Password"));
                        }
                      } else {
                        if (validateEmail(email) && validatePassword(password)) {
                          handleAuth();
                        } else {
                          !validateEmail(email)
                            ? setForgotPasswordMessage(errorMessages("email"))
                            : setForgotPasswordMessage(errorMessages("Password"));
                        }
                      }
                    }}
                    className="flex items-center justify-center w-full px-6 py-4 space-x-2 rounded-lg bg-slate-blue filter hover:brightness-125"
                  >
                    {loading ? (
                      <CircularProgress size={24} style={{ color: "white" }} />
                    ) : (
                      <>
                        <span className="text-white">{signin ? "Login" : "Join us"}</span>
                        <ArrowRightIcon className="w-5 text-white" />
                      </>
                    )}
                  </button>
                  <hr />
                  <button
                    disabled={loading}
                    onClick={() => {
                      setSignin(!signin);
                    }}
                    className="flex items-center justify-center w-full px-6 py-4 space-x-2 rounded-lg bg-blue-50 filter w-hover"
                  >
                    <span className="text-slate-blue">{signin ? "Create an Account" : "Go Back to Sign in"}</span>
                  </button>
                </>
              ) : (
                <>
                  <h4 className="text-3xl">Forgot Your Password?</h4>
                  <h5>Provide your email below to reset</h5>
                  <InputBase
                    name="email"
                    label="Email"
                    type="email"
                    ariaLabel="Email"
                    value={email}
                    disabled={loading}
                    onChange={(val) => setEmail(val)}
                  />
                  <div className="">
                    {forgotPasswordMessage.length > 0 ? (
                      forgotPasswordMessage === "success" ? (
                        <span className="text-lime-700">Reset Email sent</span>
                      ) : (
                        <span className="text-red-600">{forgotPasswordMessage}</span>
                      )
                    ) : (
                      ""
                    )}
                  </div>
                  <button
                    disabled={loading}
                    onClick={() => {
                      if (validateEmail(email)) {
                        handleForgotPassword();
                      } else {
                        setForgotPasswordMessage("Provide a valid email address");
                      }
                    }}
                    className="flex items-center justify-center w-full px-6 py-4 space-x-2 rounded-lg bg-slate-blue filter hover:brightness-125"
                  >
                    {loading ? (
                      <CircularProgress size={24} style={{ color: "white" }} />
                    ) : (
                      <>
                        <span className="text-white">Reset</span>
                        <ArrowRightIcon className="w-5 text-white" />
                      </>
                    )}
                  </button>
                  <hr />
                  <button
                    disabled={loading}
                    onClick={() => {
                      setForgotPassword(false);
                      setForgotPasswordMessage("");
                      setEmail("");
                    }}
                    className="flex items-center justify-center w-full px-6 py-4 space-x-2 rounded-lg bg-blue-50 filter "
                  >
                    <span className="text-slate-blue">{"Go Back to Sign in"}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthPage;
