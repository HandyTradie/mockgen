/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
// import { Page, Text, View, Document, StyleSheet, PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import database from "../utils/database";
import lodash from "lodash";
import PaymentTransaction from "../models/PaymentTransaction";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDoc, doc, collection, FieldValue, Timestamp, setDoc, deleteDoc, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { getLocalDatastoreUser, handleRefreshUser } from "../utils";
import { handleCreateNewMockDocx_next, handleCreateNewMockWithTopics_next, handlePayment, verifyOTP } from "../firebase/functions";
import Configuration from "../models/Configuration";
import InputBase from "../components/FormElements/InputBase";
import SelectInput from "../components/FormElements/SelectInput";
// import { Page as PDFPage, Document as PDFDocument, pdfjs, Outline } from "react-pdf";
import { firestore } from "../firebase";
// import { DocumentViewer } from "react-documents";
import PDFViewer from "pdf-viewer-reactjs";
import Lottie from "react-lottie";
import loaderData from "../lotties/loader.json";
import { ArrowUpIcon } from "@heroicons/react/outline";
import User from "../models/User";

const sectionTitles = ["A", "B", "C", "D", "E"];

const auth = getAuth();

const Payment = () => {
  const params = useParams();
  const [pdffile, setpdffile] = useState(null);
  const [answerPDFFile, setAnswerPDFFile] = useState(null);
  const [message, setMessage] = useState({
    status: "",
    message: "",
  });
  const [currentConfig, setCurrentConfig] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [paymentDetails, setPaymentDetails] = React.useState({
    network: "",
    number: "",
  });
  const [email, setEmail] = useState("");
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pricing, setPricing] = useState(null);
  const [paystackResponse, setPaystackResponse] = useState(null);
  const [otp, setOtp] = useState("");
  const [timeStamp, setTimeStamp] = useState(0);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [downloadDocName, setDownloadDocName] = useState(params?.configId || "");
  const [downloadAnswerDocName, setDownloadAnswerDocName] = useState(`${params?.configId}-answer` || "");

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }
  function changePage(offset) {
    setPageNumber((prevPageNumber) => prevPageNumber + offset);
  }
  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function onItemClick({ pageNumber: itemPageNumber }) {
    setPageNumber(itemPageNumber);
  }

  useEffect(() => {
    const unsub = onSnapshot(doc(firestore, "examConfiguration", params.configId), async (doc) => {
      if (doc.exists()) {
        // console.log('Current exam configurations:', doc.data())
        setCurrentConfig(doc.data());
        setTimeStamp(doc.data().updatedAt);

        if (doc.data().finalpdfUrl) {
          setLoading(false);
          setpdffile(doc.data().finalpdfUrl);
        } else {
          if (doc.data().status === "paid") {
            console.log("paid but no pdf");
            setLoading(true);
            setMessage({
              message: "",
              status: "",
            });

            try {
              const { data } = await handleCreateNewMockWithTopics_next({
                config: currentConfig,
                course: handleGetCourse(currentConfig.course),
                status: "paid",
              });
              console.log('Handled new mock creation with response:')
            } catch (err) {
              setLoading(false)
              console.log(err)
            }
          }
        }
      }

      if (doc.exists() && doc.data()?.answerPDFURL) {
        setAnswerPDFFile(doc.data().status === "paid" ? doc.data()?.answerPDFURL : doc.data()?.answerPreviewPDFURL);
        setTimeStamp(doc.data().updatedAt);
      }
    });
    return () => unsub();
  }, [params, user]);

  const pdf = React.useMemo(
    () => ({
      url: pdffile,
    }),
    [pdffile]
  );

  const answerPDF = React.useMemo(
    () => ({
      url: answerPDFFile,
    }),
    [answerPDFFile]
  );

  React.useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoading(true);
        // handleSetCurrentConfig();
        try {
          await handleRefreshUser(user.uid, true); // this save data to firebase
          await handleGetUserDetails();
          setLoading(false);
        } catch (err) {
          console.log(err)
          setLoading(false)
          alert('Something went wrong. Please try again.')
        }
      }
    });

    (async () => {
      const pricingRes = await getDoc(doc(firestore, "siteConfig/pricing"));
      const pricingData = pricingRes.data();

      setPricing(pricingData);
    })();
  }, []);

  const handleGetCourse = (code) => {
    const getter = database.subject.find((i) => i.code === code);

    return `${getter ? getter.name : code}`;
  };

  useEffect(() => {
    if (pdffile !== null && pdffile.length > 2) {
      setConfirmLoading(false);
    }

    return () => {};
  }, [pdffile]);

  const handleProcessPayment = async () => {
    try {
      setLoading(true);
      // if (!user) {
      //   setLoading(false)
      //   throw new Error("User not defined")};
      if (
        !paymentDetails?.network ||
        !paymentDetails?.number ||
        paymentDetails?.number?.length < 10 ||
        (user === null && (!email.includes("@") || !email.includes(".") || email.length < 5))
      ) {
        setLoading(false);
        throw new Error("Payment details not defined correctly,make sure you have provided all necessary details");
      }
      setMessage({ message: "", status: "" });
      const transaction = new PaymentTransaction(null, user?.uid ?? params.configId, params.configId);
      transaction.setPaymentTransaction({
        status: "PENDING", // CHANGE THIS TO PENDING WHEN MAKING REAL PAYMENT AND DRAFT OTHERWISE
        amountDefined: pricing?.payAsYouGo10?.price,
        amountPaid: 0,
        remainingBalance: 0,
        paymentDetails,
        transactionData: currentConfig,
        createdAt: Timestamp.now(),
      });
      const transactionDataRes = await transaction.createOrUpdateFirebaseTransaction();

      const { data: paystackResponse } = await handlePayment({
        transactionData: transactionDataRes?.data,
        user: user !== null ? user : { email: email },
        paymentDetails,
        amount: pricing?.payAsYouGo10?.price,
        config: currentConfig,
      });

      if (paystackResponse?.status) {
        setMessage({
          message: "",
          status: "",
        });

        setPaystackResponse(paystackResponse);
      } else {
        setMessage({ status: "error", message: paystackResponse?.message });
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setMessage({ status: "error", message: error?.message || "Something went wrong while trying to process Payment. Please try again." });
      return [];
    } finally {
      // setLoading(false);
    }
  };

  const handleGetUserDetails = async () => {
    try {
      const userDetails = await getLocalDatastoreUser();
      setUser(userDetails);
    } catch (error) {
      console.error(error);
    }
  };

  const render = useMemo(() => {
    return (
      <>
        {loading || !currentConfig ? (
          <section className="py-12 bg-slate-light font-dm-sans">
            <div className="flex flex-col items-center justify-center m-auto max-w-default">
              <h3 className="text-xl font-bold">{"Loading. Please wait...."}</h3>
            </div>
          </section>
        ) : paystackResponse ? (
          <>
            {paystackResponse?.status && paystackResponse?.data?.status === "send_otp" ? (
              <>
                <div className="flex items-center justify-center">
                  <div className="w-1/2">
                    <InputBase
                      name={`OTP`}
                      ariaLabel="OTP"
                      label="OTP"
                      type="number"
                      min={1}
                      value={otp}
                      onChange={(val) => {
                        setOtp(val);
                      }}
                    />
                  </div>
                </div>

                <h6 className="text-lg font-bold">{paystackResponse?.data?.display_text}</h6>

                <button
                  onClick={async () => {
                    if (!otp || !paystackResponse?.data?.reference) {
                      setLoading(false);
                      return setMessage({ status: "error", message: "Payment details not defined correctly" });
                    }
                    setMessage({
                      message: "",
                      status: "",
                    });

                    setLoading(true);
                    const { data: verifyOTPResponse } = await verifyOTP({
                      otp,
                      reference: paystackResponse?.data?.reference,
                    });

                    setPaystackResponse(verifyOTPResponse);
                    setLoading(false);
                  }}
                  className={`${
                    loading
                      ? "bg-gray-200 hover:gray-100 hover:border-gray-100 hover:bg-gray-100"
                      : "bg-slate-blue hover:text-slate-blue hover:border-slate-blue hover:bg-white"
                  } px-8 py-4 mt-2 font-medium transition-all duration-300 border-2 rounded-lg md:mt-0 text-white border-white   text-desktop-paragraph`}
                >
                  Verify OTP
                </button>
              </>
            ) : (
              paystackResponse?.status &&
              (paystackResponse?.data?.status === "pay_offline" || paystackResponse?.data?.status === "success") &&
              pdffile === null &&
              (!confirmLoading ? (
                <>
                  <h6 className="text-lg font-bold">{paystackResponse?.data?.display_text}</h6>
                  <h6 className="mb-4 text-lg font-bold">{`Click on confirm button when done`}</h6>
                  <div className="flex flex-col items-center justify-center gap-4">
                    <button
                      onClick={async () => {
                        const transactionRef = await getDoc(doc(firestore, `examConfiguration/${currentConfig.configId}`));
                        const transactionRefData = transactionRef.data();

                        if (transactionRefData?.status === "paid") {
                          // window.location.reload();
                          (async () => {
                            setConfirmLoading(true);
                            setMessage({
                              message: "",
                              status: "",
                            });

                            const { data } = await handleCreateNewMockWithTopics_next({
                              config: currentConfig,
                              schoolLogoURL: currentConfig.schoolLogo,
                              // base64css: base64Images,
                              course: handleGetCourse(currentConfig.course),
                              status: "paid",
                            });

                            if (data) {
                              // setpdffile(data.generatorPDFURL);
                              // setTimeStamp(data.timeStamp);
                              // setProcessingPDF(false);
                            }
                          })();
                        } else {
                          setConfirmLoading(false);

                          setMessage({ status: "error", message: "Payment not received" });
                        }
                      }}
                      disabled={confirmLoading}
                      className={`${
                        loading
                          ? "bg-gray-200 hover:gray-100 hover:border-gray-100 hover:bg-gray-100"
                          : "bg-slate-blue hover:text-slate-blue hover:border-slate-blue hover:bg-white"
                      } px-8 py-4 mt-2 font-medium transition-all duration-300 border-2 rounded-lg md:mt-0 text-white border-white   text-desktop-paragraph`}
                    >
                      Confirm Payment
                    </button>

                    {/* Resend prompt */}
                    <div className="mt-8">
                      <p className="mb-2 text-lg font-bold">Didn't receive the authorization prompt?</p>
                      <button
                        className={`${
                          loading
                            ? "bg-gray-200 hover:gray-100 hover:border-gray-100 hover:bg-gray-100"
                            : "bg-slate-blue hover:text-slate-blue hover:border-slate-blue hover:bg-white"
                        } px-8 py-4 mt-2 font-medium transition-all duration-300 border-2 rounded-lg md:mt-0 text-white border-white   text-desktop-paragraph`}
                        onClick={handleProcessPayment}
                      >
                        Resend prompt
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {" "}
                  <div>
                    <Lottie
                      height={150}
                      width={150}
                      options={{
                        loop: true,
                        autoplay: true,
                        animationData: loaderData,
                        rendererSettings: {
                          preserveAspectRatio: "xMidYMid slice",
                        },
                      }}
                    />
                  </div>{" "}
                  <div>Loading...</div>{" "}
                </>
              ))
            )}
          </>
        ) : (
          <section className="py-12 bg-slate-light font-dm-sans">
            <div className="flex flex-col items-center justify-center m-auto mt-2 max-w-default"></div>

            <div>
              {currentConfig.status === "draft" && (
                <>
                  <div className="flex items-center justify-center">
                    <div className="w-1/2">
                      <SelectInput
                        name={`network`}
                        ariaLabel="Mobile Network"
                        label="Mobile Network"
                        value={paymentDetails?.network}
                        options={[
                          {
                            disabled: true,
                            label: "Please select a network",
                            value: "",
                          },
                          {
                            disabled: false,
                            label: "MTN",
                            value: "mtn",
                          },
                          {
                            disabled: false,
                            label: "Vodafone",
                            value: "vod",
                          },
                          {
                            disabled: false,
                            label: "Airtel/Tigo",
                            value: "tgo",
                          },
                        ]}
                        onChange={(val) => {
                          setPaymentDetails((data) => ({ ...data, network: val }));
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-1/2">
                      <InputBase
                        name={`mobileNumber`}
                        ariaLabel="Mobile Number"
                        label="Mobile Number"
                        type="number"
                        max={10}
                        min={10}
                        value={paymentDetails?.number}
                        onChange={(val) => {
                          setPaymentDetails((data) => ({ ...data, number: val }));
                        }}
                      />
                    </div>
                  </div>
                  {user === null && (
                    <div className="flex items-center justify-center">
                      <div className="w-1/2">
                        <InputBase
                          name={`email`}
                          ariaLabel="Email"
                          label="Email"
                          type="email"
                          max={100}
                          // min={5}
                          value={email}
                          onChange={(val) => {
                            setEmail(val);
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {pricing?.payAsYouGo10?.price && (
                    <h3 className="text-lg font-bold">{`You will be prompted to pay GHS ${
                      pricing?.payAsYouGo10?.price / 100
                    } to download this document.`}</h3>
                  )}
                </>
              )}
            </div>
            <div className="flex flex-col justify-center mt-8 md:space-x-4 md:flex-row md:mt-10">
              {currentConfig.status === "draft" ? (
                <button
                  onClick={() => handleProcessPayment()}
                  className={`${
                    loading
                      ? "bg-gray-200 hover:gray-100 hover:border-gray-100 hover:bg-gray-100"
                      : "bg-slate-blue hover:text-slate-blue hover:border-slate-blue hover:bg-white"
                  } px-8 py-4 mt-2 font-medium transition-all duration-300 border-2 rounded-lg md:mt-0 text-white border-white   text-desktop-paragraph`}
                >
                  Make Payment
                </button>
              ) : (
                <></>
              )}
            </div>
          </section>
        )}
        {pdffile && currentConfig.status !== "draft" && (
          <div className="flex flex-col items-center justify-center">
            <h1 className="my-4 text-lg font-bold">Questions</h1>
            <div className="flex border-2">
              <PDFViewer scale={1} scaleStep={0.5} maxScale={5} minScale={0.5} page={1} document={pdf} />
            </div>
            <div className="flex mb-4">
              <label className="flex items-center gap-2 font-bold">
                <div className="pt-2">Document name:</div>
                <InputBase
                  value={downloadDocName}
                  onChange={(val) => {
                    setDownloadDocName(val);
                  }}
                />
              </label>
            </div>

            <button
              onClick={() => {
                fetch(`https://storage.googleapis.com/quizmine-dev.appspot.com/generatorDownloads/${currentConfig.configId}.pdf`, {
                  method: "GET",
                })
                  .then((resp) => resp.blob())
                  .then((blob) => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.style.display = "none";
                    a.href = url;
                    a.download = downloadDocName; // the filename you want
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                  });
              }}
              className={`${"my-4 bg-slate-blue hover:text-slate-blue hover:border-slate-blue hover:bg-white"} px-8 py-2 mt-2 font-light transition-all duration-300 border-2 rounded-lg md:mt-0 text-white border-white text-desktop-paragraph`}
            >
              Download document
            </button>
          </div>
        )}

        {answerPDFFile && currentConfig.status !== "draft" && (
          <div className="flex flex-col items-center justify-center mt-16">
            <h1 className="my-4 text-lg font-bold">Answers</h1>
            <div className="flex border-2">
              <PDFViewer scale={1} scaleStep={0.5} maxScale={5} minScale={0.5} page={1} document={answerPDF} />
            </div>
            <div className="flex mb-4">
              <label className="flex items-center gap-2 font-bold">
                <div className="pt-2">Document name:</div>
                <InputBase
                  value={downloadAnswerDocName}
                  onChange={(val) => {
                    setDownloadAnswerDocName(val);
                  }}
                />
              </label>
            </div>

            <button
              onClick={() => {
                fetch(`https://storage.googleapis.com/quizmine-dev.appspot.com/generatorAnswerDownloads/${currentConfig.configId}.pdf`, {
                  method: "GET",
                })
                  .then((resp) => resp.blob())
                  .then((blob) => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.style.display = "none";
                    a.href = url;
                    a.download = downloadAnswerDocName; // the filename you want
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                  });
              }}
              className={`${"my-4 bg-slate-blue hover:text-slate-blue hover:border-slate-blue hover:bg-white"} px-8 py-2 mt-2 font-light transition-all duration-300 border-2 rounded-lg md:mt-0 text-white border-white text-desktop-paragraph`}
            >
              Download document
            </button>
            {User.isLoggedIn && (
              <div>
                <hr className="my-8" />
                <h2 className="mb-4 text-2xl bold">Convert to Online Test</h2>
                <p className="max-w-xl m-auto mb-4">
                  Click the button below to go to QuizMine online (
                  <a target="_blank" rel="noopener noreferrer" href={ONLINE_TEST_LINK}>
                    {ONLINE_TEST_LINK}
                  </a>
                  ) where you can create a test your students will take online with these same questions
                </p>
                <a target="_blank" rel="noopener noreferrer" href={ONLINE_TEST_LINK + "/create-test/" + currentConfig?.configId}>
                  <button
                    className={`${"my-4 flex items-center gap-2 m-auto bg-slate-blue hover:text-slate-blue hover:border-slate-blue hover:bg-white"} px-8 py-2 mt-2 font-light transition-all duration-300 border-2 rounded-lg md:mt-0 text-white border-white text-desktop-paragraph`}
                  >
                    Create Test <ArrowUpIcon className="w-4 h-4 rotate-45" />
                  </button>
                </a>
              </div>
            )}
          </div>
        )}
      </>
    );
  }, [
    loading,
    currentConfig,
    paystackResponse,
    paymentDetails,
    pricing,
    user,
    otp,
    numPages,
    pageNumber,
    currentConfig,
    confirmLoading,
    email,
    downloadDocName,
    downloadAnswerDocName,
    answerPDFFile,
    pdffile,
  ]);

  return (
    <>
      {render}
      {message.message.length > 0 && <div className="text-xl text-red-600">{message.message}</div>}
    </>
  );
};

export const ONLINE_TEST_LINK = process.env.NODE_ENV === "development" ? "http://localhost:5173" : "https://mockgen-online-test.web.app/";

export default Payment;
