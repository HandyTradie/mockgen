/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import database from "../utils/database";
import { handleCreateNewMockWithTopics_next } from "../firebase/functions";
import { pdfjs } from "react-pdf";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "../firebase";
import PDFViewer from "pdf-viewer-reactjs";
import Lottie from "react-lottie";
import loaderData from "../lotties/loader.json";
import User from "../models/User";
import errorImg from '../error.png';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PreviewPage = () => {
  const navigate = useNavigate();
  const params = useParams();

  const [currentConfig, setCurrentConfig] = React.useState(null);
  const [timeStamp, setTimeStamp] = useState("0");
  const [pdffile, setpdffile] = useState(null);
  const [answerPDFFile, setAnswerPDFFile] = useState(null);
  const [loading, setloading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [dataRes, setDataRes] = useState(null);

  // Registers listener for "examConfig" changes
  useEffect(() => {
    const unsub = onSnapshot(
      doc(firestore, "examConfiguration", params.configId),
      (doc) => {
        if (doc.exists() && doc.data().generatorPDFURL) {
          setpdffile(doc.data().status === "paid" ? doc.data().finalpdfUrl : doc.data().generatorPDFURL);
          setTimeStamp(doc.data().updatedAt);
          setloading(false);
        }

        if (doc.exists() && doc.data()?.answerPreviewPDFURL) {
          setAnswerPDFFile(doc.data().status === "paid" ? doc.data()?.answerPDFURL : doc.data()?.answerPreviewPDFURL);
          setTimeStamp(doc.data().updatedAt);
        }
      },
      (error) => {
        setloading(false);
      }
    );
    return () => unsub();
  }, [params]);

  // Register listener for answer pdf url
  useEffect(() => {
    const unsub = onSnapshot(
      doc(firestore, "examConfiguration", params.configId),
      (doc) => {
        if (doc.exists() && doc.data()?.answerPreviewPDFURL) {
          setAnswerPDFFile(doc.data().status === "paid" ? doc.data().answerPDFURL : doc.data().answerPreviewPDFURL);
        }
      },
      (error) => {
        setloading(false);
      }
    );
    return () => unsub();
  }, [params]);

  React.useEffect(_ => {
    if (!dataRes || pdffile) return;
    console.log('file changes has occured')
    setTimeout(_ => {
      // console.log('answer pdf file:', answerPDFFile, 'questions pdf file:', pdffile)
      if (answerPDFFile && !pdffile) {
        setIsError(true)
      } else {
        setIsError(false)
      }
    }, 10000)
  }, [answerPDFFile, pdffile])

  React.useEffect(_ => {
    if (pdffile !== null) setIsError(false);
  }, [pdffile])

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
    // Get configurations
    handleSetCurrentConfig();
  }, [params]);

  const handleGetCourse = (code) => {
    const getter = database.subject.find((i) => i.code === code);

    return `${getter ? getter.name : code}`;
  };

  React.useEffect(() => {
    if (!currentConfig) return;

    try {
      (async () => {
        if (pdffile === null) {
          const { data } = await handleCreateNewMockWithTopics_next({
            config: currentConfig,
            schoolLogoURL: currentConfig?.schoolLogo || "",
            course: handleGetCourse(currentConfig.course),
            status: currentConfig.status ? currentConfig.status : "draft",
          });
          setIsError(!data)
          setDataRes(data)
          console.log(data)
        }
      })();
    } catch (err) {
      setIsError(true)
      console.log(err)
    }
  }, [currentConfig, pdffile]);

  const handleSetCurrentConfig = async () => {
    try {
      const allConfigs = (await handleGetConfigurations()) || [];
      const finder = allConfigs.find((i) => i.configId === params.configId);

      if (finder) {
        setCurrentConfig(finder);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while trying to set configuration data. Please try again.");
      return [];
    }
  };

  const handleGetConfigurations = async () => {
    try {
      const configData = (await localStorage.getItem("mg-configData")) || "[];";

      return JSON.parse(configData);
    } catch (error) {
      alert("Something went wrong while trying to retrieve configuration. Please try again.");
      return [];
    }
  };

  if (!currentConfig)
    return (
      <div className="p-4 my-4 bg-yellow-300 rounded-md">
        <p>Loading</p>
      </div>
    );

  if (isError) {
    return (
      <div className="file-error">
        <img src={errorImg} alt="Error image" className="errorImg" />
        <p>Failed to generate exams! This may be caused by one of the following issues:</p>
        <ul className="error-list">
          <li>There are no questions available based on your exam configurations.</li>
          <li>Unstable internet connection. Please check your internet connection.</li>
        </ul>
        <p>Please try again.</p>
      </div>
    )
  }

  return (
    <section className="py-12 font-dm-sans">
      <div className="flex flex-col items-center justify-center py-6 m-auto mt-5 max-w-default bg-slate-light">
        <h1 className="mx-6 my-4 font-medium leading-tight text-center text-mobile-h3 md:text-desktop-h3 text-slate-headline">
          {currentConfig.schoolName || "No school name"}
        </h1>
        <h2 className="mx-6 my-4 mb-10 font-medium leading-tight text-center text-mobile-h4 md:text-desktop-h4 text-slate-headline">
          {currentConfig.examTitle || "No exam title"}
        </h2>

        {currentConfig.examInstructions && (
          <div>
            <h3 className="mx-6 mt-4 font-bold leading-tight text-center text-mobile-h3 md:text-desktop-h3 text-slate-headline">
              Exam Instructions
            </h3>
            <p className="mb-4 text-x">{currentConfig.examInstructions}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center m-auto mb-12 max-w-default">
        {pdffile !== null ? (
          <>
            <PDFViewer
              navigation={{
                zoomOutBtn: {
                  color: "red",
                  backgroundColor: "blue",
                },
              }}
              scale={1.2}
              scaleStep={0.5}
              maxScale={5}
              minScale={0.5}
              key={timeStamp}
              page={1}
              document={pdf}
            />
          </>
        ) : (
          <>
            <div>Generating Exams...</div>
            <div className="mt-4">
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
          </>
        )}
      </div>

      <div className="flex flex-col items-center justify-center m-auto max-w-default">
        {answerPDFFile !== null && pdffile !== null && (
          <>
            <PDFViewer
              navigation={{
                zoomOutBtn: {
                  color: "red",
                  backgroundColor: "blue",
                },
              }}
              scale={1.2}
              scaleStep={0.5}
              maxScale={5}
              minScale={0.5}
              key={`answer-${timeStamp}`}
              page={1}
              document={answerPDF}
            />
          </>
        )}
      </div>
      {!loading && (
        <>
          <div className="flex flex-col justify-center mt-8 md:space-x-4 md:flex-row md:mt-10">
            <button
              onClick={() => navigate(`/payment${params.configId ? `/${params.configId}` : ""}`)}
              className="px-8 py-4 font-medium duration-300 border-2 rounded-lg text-slate-blue border-slate-blue text-desktop-paragraph filter hover:text-white hover:bg-slate-blue"
            >
              {currentConfig.status === "draft" ? "Pay and Download" : "Download"}
            </button>
            {/* <button
            onClick={() => navigate("/generator/" + params.configId)}
            className="px-8 py-4 mt-2 font-medium text-white transition-all duration-300 border-2 border-white rounded-lg bg-slate-blue md:mt-0 hover:text-slate-blue hover:bg-white hover:border-slate-blue text-desktop-paragraph"
          >
          Edit Configuration
        </button> */}
          </div>
          {User.isLoggedIn && <p className="mt-4">You will also be able to create an online test from this mock after paying.</p>}
        </>
      )}
    </section>
  );
};

export default PreviewPage;
