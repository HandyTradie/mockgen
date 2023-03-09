import logo from "../logo.svg";
import { useState } from "react";

import database from "../utils/database";
import courseContent from "../utils/courseContent";

import { collection, setDoc, addDoc, doc, query, where, getDocs, updateDoc } from "firebase/firestore";
import { firestore, functions, storage } from "../firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import InputBase from "../components/FormElements/InputBase";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { camelCase } from "lodash";

function DatabaseConfig() {
  const [jsonFile, setJsonFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [courseID, setCourseID] = useState("");
  const onSaveSiteConfig = async () => {
    try {
      const payload = Object.entries(database);

      for (let i = 0; i < payload.length; i++) {
        const allPromises = payload[i][1]?.map((item, idx) => {
          return setDoc(
            doc(collection(firestore, "siteConfig"), payload[i][0]),
            {
              [idx]: item,
            },
            { merge: true }
          );
        });

        await Promise.all(allPromises);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const onSaveCourses = async () => {
    try {
      const allPromises = courseContent?.map((item, idx) => {
        return setDoc(
          doc(firestore, "courseContent", item?.courseID),
          {
            category: item?.category,
            name: item?.name,
            author: item?.author,
            courseID: item?.courseID,
            topics: item?.topics,
            // base64css: item?.base64css,
            updated_at: item?.updated_at,
            package_code: item?.package_code,
            topicbanks: item?.topicbanks,
            // questions: item?.questions,
            course_id: item?.course_id,
            nquestions: item?.nquestions,
            quizzes: item?.quizzes,
            description: item?.description,
          },
          { merge: true }
        );
      });

      await Promise.all(allPromises);
    } catch (error) {
      console.error(error.message);
    }
  };

  const onSaveQuestions = async () => {
    try {
      const oldEntries = courseContent?.map((c) =>
        Object.entries(c?.questions)?.reduce((acc, [key, value]) => {
          return {
            ...acc,
            [key]: {
              courseID: c?.course_id,
              ...value,
            },
          };
        }, {})
      );

      const entries = oldEntries?.map((e) => Object.entries(e));

      const results = [];

      entries?.forEach((item) => {
        item.forEach((r) => {
          r.forEach((z) => {
            if (typeof z !== "string") results.push(z);
          });
        });
      });

      const allPromises = results?.map((p, idx) => {
        return setDoc(
          doc(firestore, "mockCourseQuestions", p?.qid),
          {
            ...p,
          },
          { merge: true }
        );
      });

      await Promise.all(allPromises);
    } catch (error) {
      console.error(error.message);
    }
  };
  const onSavePreambles = async () => {
    try {
      const preambles = {};
      const instructions = {};

      const q = collection(firestore, "mockCourseQuestions");
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        const question = doc.data();

        if (question.resource) {
          if (preambles[question.resource]) {
            preambles[question.resource].push({
              pqIndex: preambles[question.resource].length,
              qID: question.qid,
            });
          } else {
            preambles[question.resource] = [{ pqIndex: 0, qID: question.qid }];
          }
        }

        if (question.instructions) {
          if (instructions[question.instructions]) {
            instructions[question.instructions].push({
              iqIndex: instructions[question.instructions].length,
              qID: question.qid,
            });
          } else {
            instructions[question.instructions] = [{ iqIndex: 0, qID: question.qid }];
          }
        }
      });

      const arrayPreambles = Object.entries(preambles);

      const allPromises = arrayPreambles?.map(([key, value], idx) => {
        return addDoc(
          collection(firestore, "preambles"),
          {
            text: key,
            questionIDs: value,
          },
          { merge: true }
        );
      });

      await Promise.all(allPromises);
    } catch (error) {
      console.error(error.message);
    }
  };

  const onSavePreamblesToQuestion = async () => {
    try {
      const q = collection(firestore, "preambles");
      const querySnapshot = await getDocs(q);

      const allPromises = [];

      querySnapshot.forEach((docu) => {
        const docID = docu.id;
        const preamble = docu.data();

        const questionIDs = preamble?.questionIDs;

        questionIDs?.forEach((q) => {
          allPromises.push(
            updateDoc(doc(firestore, "mockCourseQuestions", q?.qID), {
              preambleID: docID,
            })
          );
        });
      });

      await Promise.all(allPromises);
    } catch (error) {
      console.error(error.message);
    }
  };

  const uploadJSONFileToStorage = async () => {
    try {
      setLoading(true);
      const file = jsonFile;

      if (file) {
        const fileName = `${camelCase(file?.name)}.${`json`}`;

        const metadata = {
          contentType: file.type,
        };

        const storageRef = ref(storage, `packages/${fileName}`);
        await uploadBytes(storageRef, file, metadata);

        const downloadURL = await getDownloadURL(storageRef);
        const demUrl = "http://127.0.0.1:5001/projects-mvp/us-central1/uploadQuestions";
        const prodUrl = "https://us-central1-projects-mvp.cloudfunctions.net/uploadQuestions";
        const res = await fetch(prodUrl, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            courseID,
            downloadURL,
          }),
        });

        const data = await res.json();
      }
    } catch (error) {
      console.error("error return by fetch: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Load Configs...</p>
        <div className="flex flex-col items-center">
          <input
            className="p-3 border-2 rounded-lg"
            type="file"
            accept="application/json"
            onChange={(e) => {
              const file = e.target.files[0];
              setJsonFile(file);
            }}
          />
          <InputBase
            label={"Course ID"}
            value={courseID}
            onChange={setCourseID}
            inputStyleClasses={"placeholder-black text-black"}
            placeholder={"Course ID"}
          />
          <button
            disabled={loading || !courseID}
            className={`${!loading ? "bg-slate-orange" : "bg-gray-200"} rounded-lg px-6 py-2 mt-10`}
            onClick={() => {
              uploadJSONFileToStorage();
            }}
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </header>
    </div>
  );
}

export default DatabaseConfig;
