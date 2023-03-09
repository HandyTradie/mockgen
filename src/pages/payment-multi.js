/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import database from "../utils/database";
import PaymentTransaction from "../models/PaymentTransaction";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDoc, doc, Timestamp, onSnapshot } from "firebase/firestore";
import { getLocalDatastoreUser, handleRefreshUser } from "../utils";
import { handleCreateNewMockWithTopics_next, handleMultiPayment, verifyOTP } from "../firebase/functions";
import InputBase from "../components/FormElements/InputBase";
import SelectInput from "../components/FormElements/SelectInput";
import { firestore } from "../firebase";
import { CircularProgress } from "@mui/material";
import Lottie from "react-lottie";
import loaderData from "../lotties/loader.json";
import User from "../models/User";
import { ONLINE_TEST_LINK } from "./payment";
import { ArrowUpIcon } from "@heroicons/react/outline";

const auth = getAuth();

const MultiPaymentPage = () => {
  const params = useParams();
  const configs = params.configId.split(",");
  const [documents, setDocuments] = React.useState([]);

  const [message, setMessage] = useState({
    status: "",
    message: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [paymentDetails, setPaymentDetails] = React.useState({
    network: "",
    number: "",
  });
  const [email, setEmail] = useState("");
  const [pricing, setPricing] = useState(null);
  const [paystackResponse, setPaystackResponse] = useState(null);
  const [otp, setOtp] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);

  const isGenerationComplete = documents.every((doc) => Boolean(doc?.finalpdfUrl) && Boolean(doc?.answerPDFURL));

  useEffect(() => {
    // Registers listeners for doc changes in all configs
    const unsubFns = configs.map((configId) => {
      return onSnapshot(doc(firestore, "examConfiguration", configId), (doc) => {
        if (doc.exists()) {
          const docData = doc.data();

          // Add document to documents array or update if already exists
          setDocuments((docs) => {
            let newDocuments = [...docs];
            let index = newDocuments.findIndex((d) => d.configId === docData.configId);
            if (index === -1) {
              newDocuments.push(docData);
            } else {
              newDocuments[index] = docData;
            }
            return newDocuments;
          });
        }
      });
    });
    return () => {
      unsubFns.forEach((unsubFn) => unsubFn());
    };
  }, [params, user]);

  const isLoadedDocs = documents?.length === configs?.length;

  React.useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoading(true);
        await handleRefreshUser(user.uid, true); // this save data to firebase
        await handleGetUserDetails();
        setLoading(false);
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

  const handleProcessPayment = async () => {
    try {
      setLoading(true);

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

      const transactionDataPromises = configs.map(async (configId) => {
        const txData = documents.filter((doc) => doc.configId === configId)[0];

        const transaction = new PaymentTransaction(null, user?.uid ?? configId, configId);
        transaction.setPaymentTransaction({
          status: "DRAFT", // CHANGE THIS TO PENDING WHEN MAKING REAL PAYMENT
          amountDefined: pricing?.payAsYouGo10?.price,
          amountPaid: 0,
          remainingBalance: 0,
          paymentDetails,
          transactionData: txData,
          createdAt: Timestamp.now(),
        });
        const transactionDataRes = await transaction.createOrUpdateFirebaseTransaction();
        const res = await transactionDataRes.data;
        return res?.data;
      });

      const transactionData = await Promise.all(transactionDataPromises);

      const { data: paystackResponse } = await handleMultiPayment({
        transactionData,
        user: user !== null ? user : { email: email },
        paymentDetails,
        amount: pricing?.payAsYouGo10?.price * configs.length,
        configs: documents,
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
        {loading || !isLoadedDocs ? (
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
              (!confirmLoading ? (
                <>
                  <h6 className="text-lg font-bold">{paystackResponse?.data?.display_text}</h6>
                  <h6 className="mb-4 text-lg font-bold">{`Click on confirm button when done`}</h6>
                  <div className="flex flex-col items-center justify-center gap-4">
                    <button
                      onClick={async () => {
                        setConfirmLoading(true);
                        const transactionDataDocs = [];

                        for (const configId of configs) {
                          const transactionRef = await getDoc(doc(firestore, `examConfiguration/${configId}`));
                          const transactionRefData = transactionRef.data();
                          transactionDataDocs.push(transactionRefData);
                        }

                        const isAllPaid = transactionDataDocs.every((doc) => doc?.status === "paid");

                        if (isAllPaid) {
                          setMessage({
                            message: "",
                            status: "",
                          });

                          const requestPromises = transactionDataDocs.map((currentConfig) => async () => {
                            await handleCreateNewMockWithTopics_next({
                              config: currentConfig,
                              schoolLogoURL: currentConfig.schoolLogo,
                              course: handleGetCourse(currentConfig.course),
                              status: "paid",
                            });
                          });

                          Promise.all(requestPromises.map((i) => i()));
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
                  {!isGenerationComplete && (
                    <>
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
                      </div>
                      <div>Loading...</div>{" "}
                    </>
                  )}
                </>
              ))
            )}
          </>
        ) : (
          <section className="py-12 bg-slate-light font-dm-sans">
            <div className="flex flex-col items-center justify-center m-auto mt-2 max-w-default"></div>

            <div>
              {documents.some((doc) => doc.status === "draft") && (
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
                      (pricing?.payAsYouGo10?.price / 100) * params?.configId.split(",").length
                    } to download these documents.`}</h3>
                  )}
                </>
              )}
            </div>
            <div className="flex flex-col justify-center mt-8 md:space-x-4 md:flex-row md:mt-10">
              {documents.some((doc) => doc.status === "draft") && (
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
              )}
            </div>
          </section>
        )}

        {isGenerationComplete && (
          <div className="flex flex-col max-w-[540px] m-auto mb-20">
            {documents.map((doc) => (
              <div key={doc.configId} className="my-8">
                <ExamDownloadView doc={doc} />

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
                    <a target="_blank" rel="noopener noreferrer" href={ONLINE_TEST_LINK + "/create-test/" + doc.configId}>
                      <button
                        className={`${"my-4 flex items-center gap-2 m-auto bg-slate-blue hover:text-slate-blue hover:border-slate-blue hover:bg-white"} px-8 py-2 mt-2 font-light transition-all duration-300 border-2 rounded-lg md:mt-0 text-white border-white text-desktop-paragraph`}
                      >
                        Create Test <ArrowUpIcon className="w-4 h-4 rotate-45" />
                      </button>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    );
  }, [loading, paystackResponse, paymentDetails, pricing, user, otp, confirmLoading, email, documents]);

  return (
    <>
      {render}
      {message.message.length > 0 && <div className="text-xl text-red-600">{message.message}</div>}
    </>
  );
};

export default MultiPaymentPage;

const downloadFile = (downloadLink, filename) => {
  fetch(downloadLink, {
    method: "GET",
  })
    .then((resp) => resp.blob())
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filename; // the filename you want
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    });
};

const ExamDownloadView = ({ doc }) => {
  const [answerFileName, setAnswerFileName] = useState(`answers-${doc?.courseName}`);
  const [examFileName, setExamFileName] = useState(doc?.courseName);

  return (
    <div className="mt-20">
      <h1 className="mb-8 text-lg font-bold">{doc?.courseName}</h1>
      <div className="flex flex-col justify-between sm:flex-row">
        <div className="flex flex-col items-center justify-center">
          <h2 className="my-2 text-lg font-bold">Exam</h2>
          <div className="flex mb-2">
            <label className="flex flex-col items-center gap-1">
              <InputBase
                value={examFileName}
                onChange={(val) => {
                  setExamFileName(val);
                }}
              />
            </label>
          </div>

          <button
            onClick={() => {
              downloadFile(`https://storage.googleapis.com/projects-mvp.appspot.com/generatorDownloads/${doc.configId}.pdf`, examFileName);
            }}
            className={`${"my-4 bg-slate-blue hover:text-slate-blue hover:border-slate-blue hover:bg-white"} px-8 py-2 mt-2 font-light transition-all duration-300 border-2 rounded-lg md:mt-0 text-white border-white text-desktop-paragraph`}
          >
            Download
          </button>
        </div>

        <div className="flex flex-col items-center justify-center">
          <h2 className="my-2 text-lg font-bold">Answers</h2>
          <div className="flex mb-2">
            <label className="flex flex-col items-center gap-1">
              <InputBase
                value={answerFileName}
                onChange={(val) => {
                  setAnswerFileName(val);
                }}
              />
            </label>
          </div>

          <button
            onClick={() => {
              downloadFile(
                `https://storage.googleapis.com/projects-mvp.appspot.com/generatorAnswerDownloads/${doc.configId}.pdf`,
                answerFileName
              );
            }}
            className={`${"my-4 bg-slate-blue hover:text-slate-blue hover:border-slate-blue hover:bg-white"} px-8 py-2 mt-2 font-light transition-all duration-300 border-2 rounded-lg md:mt-0 text-white border-white text-desktop-paragraph`}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};
