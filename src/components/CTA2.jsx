import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import database from "../utils/database";
import "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getLocalDatastoreUser, handleRefreshUser, localDatastore } from "../utils";
import { getAllConfigData } from "../firebase/functions";
import Configuration from "../models/Configuration";
import moment from "moment";
import ImageUploader from "react-image-upload";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, setDoc, deleteDoc, onSnapshot, query, collection, where, orderBy } from "firebase/firestore";
import { firestore, storage } from "../firebase";
import { DataGrid, GridRowsProp, GridColDef, DataGridPro, GridColumns, GridActionsCellItem } from "@mui/x-data-grid";
import { async } from "@firebase/util";

const rows = [
  { id: 1, col1: "Hello", col2: "World" },
  { id: 2, col1: "DataGridPro", col2: "is Awesome" },
  { id: 3, col1: "MUI", col2: "is Amazing" },
];

const columns = [
  { field: "col1", headerName: "Column 1", width: 150 },
  { field: "col2", headerName: "Column 2", width: 150 },
];

const GenerateImage = ({ src }) => (
  <div className="flex justify-center">
    <img src={src} className="absolute top-0 filter brightness-[500] md:ml-[66px] md:mt-[-52px]" />
    <img src={src} className="relative" />
  </div>
);

const auth = getAuth();

const CTA2 = () => {
  const navigate = useNavigate();
  const [configurations, setConfigurations] = React.useState({ rows: [], columns: [] });
  const [user, setUser] = React.useState(null);
  const [editMode, setEditMode] = React.useState(false);
  const [editFirstName, setEditFirstName] = React.useState("");
  const [editLastName, setEditLastName] = React.useState("");
  const [editSchoolName, setEditSchoolName] = React.useState("");
  const [editPhone, setEditPhone] = React.useState("");
  const [schoolLogoURL, setSchoolLogoURL] = React.useState(null);

  React.useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        handleRefreshUser(user.uid, true);
        handleGetUserDetails();
      }
    });
  }, []);
  useEffect(() => {
    if (user) {
      getExamsConfig();
    }

    return () => {};
  }, [user]);
  const getExamsConfig = async () => {
    const q = query(collection(firestore, "examConfiguration"), orderBy("createdAt", "desc"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snapshots) => {
      let examsConfigs = [];
      snapshots.forEach((snap) => {
        examsConfigs.push({ ...snap.data(), id: snap.id, updatedAt: moment(snap.data().updatedAt).fromNow() });
      });
      let columns = [
        { field: "courseName", headerName: "Course Name", width: 150 },
        { field: "examTitle", headerName: "Exams Title", width: 150 },
        { field: "status", headerName: "Status", width: 100 },
        { field: "updatedAt", headerName: "Last Update", width: 100 },
      ];
      setConfigurations({ columns: columns, rows: examsConfigs });
    });
    return () => {
      unsub();
    };
  };
  React.useEffect(() => {
    if (!user) return;

    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditSchoolName(user.schoolName);
    setEditPhone(user.phone);
    setSchoolLogoURL(user?.schoolLogo || "");

    (async () => {
      await handleUpdateConfigurations();
      const configs = await handleGetConfigurations();
      // setConfigurations(configs || []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleGetUserDetails = async () => {
    try {
      const userDetails = await getLocalDatastoreUser();
      setUser(userDetails);
    } catch (error) {
      console.error(error);
    }
  };

  const handleGetConfigurations = async () => {
    try {
      const configData = (await localDatastore.getItem("configData")) || null;
      if (!configData) throw configData;

      return configData;
    } catch (error) {
      alert("Something went wrong while trying to retrieve configuration. Please try again.");
      return [];
    }
  };

  const handleUpdateConfigurations = async () => {
    try {
      const configData = await getAllConfigData(user.uid);
      const parsedData = configData.map((config) => {
        const newConfig = new Configuration(config.configId, user.uid);
        newConfig.setConfiguration(config);

        return newConfig.getConfiguration();
      });

      await localDatastore.removeItem("configData");
      await localDatastore.setItem("configData", parsedData);
    } catch (error) {
      alert("Something went wrong while trying to retrieve configuration. Please try again.");
      return [];
    }
  };

  const handleGetExam = (level, course) => {
    const levelGetter = database.levels.find((i) => i.code === level);
    const courseGetter = database.subject.find((i) => i.code === course);

    return `${levelGetter ? levelGetter.name : level} ${courseGetter ? courseGetter.name : course}`;
  };

  async function getImageFileObject(item) {
    const file = item?.file;

    if (file) {
      const fileName = `${user.uid}.${`jpg`}`;

      const metadata = {
        contentType: "image/jpeg",
        // contentType: file.type,
      };

      const storageRef = ref(storage, `logos/${fileName}`);
      await uploadBytes(storageRef, file, metadata);

      const downloadURL = await getDownloadURL(storageRef);

      const usersRef = doc(firestore, "users", user?.uid);
      await setDoc(usersRef, { schoolLogo: downloadURL }, { merge: true });
      setSchoolLogoURL(downloadURL);
    }
  }

  async function handleRemoveImage(file) {
    const usersRef = doc(firestore, "users", user?.uid);
    await setDoc(usersRef, { schoolLogo: "" }, { merge: true });
    setSchoolLogoURL("");
  }

  return (
    <section className="md:pt-[142px] py-[48px] md:pb-[90px] bg-slate-light px-6 md:px-0 font-dm-sans">
      <div className="max-w-default md:justify-center md:flex md:items-start md:m-auto">
        <div className="w-full md:flex md:items-center md:justify-center">
          <div className="md:mt-12">
            <div className="flex flex-col items-center justify-center m-auto max-w-default">
              {!user && (
                <div className="p-4 my-4 bg-yellow-300 rounded-md">
                  <p>You're not logged in. You will need to log in to persist your configuration.</p>
                </div>
              )}
              {/* <div className="w-40 h-40 bg-gray-300 rounded-lg"></div> */}

              {schoolLogoURL === null ? (
                <></>
              ) : schoolLogoURL === "" ? (
                <ImageUploader
                  style={{
                    height: 150,
                    width: 150,
                    borderRadius: 15,
                    background: "rgb(243 244 246)",
                  }}
                  uploadIcon={
                    <svg className="svg-circleplus" viewBox="0 0 100 100" style={{ height: "40px", stroke: "#000" }}>
                      <circle cx="50" cy="50" r="45" fill="none" strokeWidth="7.5"></circle>
                      <line x1="32.5" y1="50" x2="67.5" y2="50" strokeWidth="5"></line>
                      <line x1="50" y1="32.5" x2="50" y2="67.5" strokeWidth="5"></line>
                    </svg>
                  }
                  onFileAdded={(img) => getImageFileObject(img)}
                  // deleteIcon={<img src="https://img.icons8.com/ios-glyphs/30/000000/delete-sign.png" alt="" />}
                  // onFileRemoved={(img) => runAfterImageDelete(img)}
                />
              ) : (
                <div className="relative w-40 h-40 overflow-hidden bg-gray-300 rounded-lg">
                  <button
                    onClick={() => handleRemoveImage()}
                    title="Remove profile image"
                    className="absolute bg-white rounded-lg top-1 right-1"
                  >
                    <img src="https://img.icons8.com/ios-glyphs/30/000000/delete-sign.png" className="w-6" alt="Remove icon" />
                  </button>
                  <img src={schoolLogoURL} alt="logo" className="object-cover w-full h-full" />
                </div>
              )}

              <h3 className="mx-6 my-4 font-bold leading-tight text-center text-mobile-h3 md:text-desktop-h3 text-slate-headline">
                Welcome, {user ? user.fullName : "Guest"}
              </h3>
              <button
                onClick={() => {
                  navigate("/profile");
                }}
                // onClick={() => setEditMode(!editMode)}
                className="px-4 py-2 my-2 font-medium text-white transition-all duration-300 border-2 border-white rounded-lg bg-slate-blue md:mt-0 hover:text-slate-blue hover:bg-white hover:border-slate-blue text-desktop-paragraph"
              >
                {editMode ? "Cancel Edits" : "Edit Profile"}
              </button>
            </div>
            <div style={{ display: "flex", height: "100%", width: "90vw" }}>
              <div style={{ flexGrow: 1 }}>
                <DataGrid
                  initialState={{ pinnedColumns: { right: ["actions"] } }}
                  autoHeight
                  rows={configurations.rows}
                  columns={[
                    ...configurations.columns,
                    {
                      field: "actions",
                      type: "actions",
                      width: 100,
                      getActions: (params) => [
                        <GridActionsCellItem
                          onClick={() => {
                            let rowData = params.row;
                            if (rowData.status === "paid") {
                              window.open(rowData.finalpdfUrl);
                            } else {
                              navigate("/preview/" + rowData.configId);
                            }
                          }}
                          icon={<span className="material-icons">{params.row.status === "paid" ? "file_download" : "edit"}</span>}
                          label="Delete"
                        />,
                      ],
                    },
                  ]}
                />
              </div>
            </div>
            {/* <table>
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Status</th>
                  <th>Last Update</th>
                </tr>
              </thead>
              <tbody>
                {configurations.map((config) => {
                  return (
                    <tr key={config.configId}>
                      <td>{handleGetExam(config.level, config.course)}</td>
                      <td>
                        {config.status === "draft" ? "DRAFT" : "PAID"},{" "}
                        <Link to={config.status === "draft" ? `/generator/${config.configId}` : `/preview/${config.configId}`}>
                          <span>{config.status === "draft" ? "Edit" : "Download"}</span>
                        </Link>
                      </td>
                      <td>{moment(config.updatedAt).fromNow()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table> */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA2;
