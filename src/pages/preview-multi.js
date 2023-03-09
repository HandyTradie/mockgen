/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import database from "../utils/database";
import { handleCreateNewMockWithTopics_next } from "../firebase/functions";
import { pdfjs } from "react-pdf";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "../firebase";
import { setDoc } from "firebase/firestore";
import Lottie from "react-lottie";
import loaderData from "../lotties/loader.json";
import User from "../models/User";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const MultiPreviewPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const paramConfigs = params.configId.split(",");

  const [currentConfigs, setCurrentConfigs] = React.useState([]);
  const [documents, setDocuments] = React.useState([]);
  const [pdffile, setpdffile] = useState(null);

  const isCompleted = documents.every((doc) => Boolean(doc?.pdfUrl));

  useEffect(() => {
    // Registers listeners for doc changes in all configs
    const unsubFns = paramConfigs.map((configId) => {
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
  }, [params]);

  React.useEffect(() => {
    (async () => {
      // Get configurations
      try {
        const allConfigs = (await handleGetConfigurations()) || [];
        const found = allConfigs.filter((i) => paramConfigs.includes(i.configId));

        if (found) {
          setCurrentConfigs(found);
        }
      } catch (error) {
        console.error(error);
        alert("Something went wrong while trying to set configuration data. Please try again.");
        return [];
      }
    })();
  }, [params]);

  const handleGetCourse = (code) => {
    const getter = database.subject.find((i) => i.code === code);

    return `${getter ? getter.name : code}`;
  };

  React.useEffect(() => {
    if (currentConfigs.length < 1) return;

    const configPromises = [];

    // Make generate request promises for each config
    currentConfigs.forEach((currentConfig) => {
      configPromises.push(async () => {
        // Create firestore doc
        await setDoc(
          doc(firestore, "examConfiguration", currentConfig.configId),
          {
            ...currentConfig,
          },
          {
            merge: true,
          }
        );

        await handleCreateNewMockWithTopics_next({
          config: currentConfig,
          schoolLogoURL: currentConfig?.schoolLogo || "",
          course: handleGetCourse(currentConfig.course),
          status: currentConfig.status ? currentConfig.status : "draft",
        });
      });
    });

    // Run requests in parallel
    Promise.all(configPromises.map((i) => i()));
  }, [currentConfigs, pdffile]);

  const handleGetConfigurations = async () => {
    try {
      const configData = (await localStorage.getItem("mg-configData")) || "[];";

      return JSON.parse(configData);
    } catch (error) {
      alert("Something went wrong while trying to retrieve configuration. Please try again.");
      return [];
    }
  };

  if (!currentConfigs[0])
    return (
      <div className="p-4 my-4 bg-yellow-300 rounded-md">
        <p>Loading</p>
      </div>
    );

  return (
    <section className="py-12 bg-slate-light font-dm-sans">
      <div className="flex flex-col items-center justify-center m-auto max-w-default">
        <h1 className="mx-6 my-4 font-medium leading-tight text-center text-mobile-h3 md:text-desktop-h3 text-slate-headline">
          {currentConfigs[0].schoolName || "No school name"}
        </h1>
      </div>

      <div className="flex flex-col items-center justify-center m-auto my-8 max-w-default">
        {isCompleted ? (
          <div className="flex flex-col gap-4">
            {documents.map((doc) => (
              <div key={doc.id}>
                <h2 className="mx-6 my-4 text-center text-mobile-h3 md:text-desktop-h3 text-slate-headline">{doc.courseName}</h2>
                <div className="space-x-2">
                  <a href={doc.generatorPDFURL} target="_blank" rel="noopener noreferrer">
                    <button className="px-4 py-2 mt-2 font-medium text-white transition-all duration-300 border-2 border-white rounded-lg bg-slate-blue md:mt-0 hover:text-slate-blue hover:bg-white hover:border-slate-blue text-desktop-paragraph">
                      Preview
                    </button>
                  </a>
                </div>
              </div>
            ))}
          </div>
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
      {isCompleted && (
        <>
          <div className="flex flex-col justify-center mt-8 md:space-x-4 md:flex-row md:mt-10">
            <button
              onClick={() => navigate(`/payment/m/${paramConfigs.join(",")}`)}
              className="px-8 py-4 font-medium duration-300 border-2 rounded-lg text-slate-blue border-slate-blue text-desktop-paragraph filter hover:text-white hover:bg-slate-blue"
            >
              {currentConfigs[0].status === "draft" ? "Pay and Download" : "Download"}
            </button>
          </div>
          {User.isLoggedIn && <p className="mt-4">You will also be able to create online tests from these mocks after paying.</p>}
        </>
      )}
    </section>
  );
};

export default MultiPreviewPage;
