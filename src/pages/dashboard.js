import React from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { CircularProgress } from "@mui/material";

import { localDatastore } from "../utils";
import { getAllConfigData } from "../firebase/functions";
import Configuration from "../models/Configuration";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import UserModel from "../models/User";
import { useFetchExamConfigs } from "../api/configurations";

const Dashboard = () => {
  const navigate = useNavigate();
  const user = UserModel.user;
  const { data: configurations, isLoading } = useFetchExamConfigs(user?.uid);

  React.useEffect(() => {
    if (!user) return;

    (async () => {
      await handleUpdateConfigurations();
      await handleGetConfigurations();
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  return (
    <section className="py-6 px-2S md:pt-10 md:pb-10 md:px-0">
      <div className="max-w-default md:justify-center md:flex md:items-start md:m-auto">
        <div className="w-full md:flex md:items-center md:justify-center">
          <div className="md:mt-12">
            <div className="flex flex-col items-center justify-center m-auto mb-12 max-w-default">
              {!user && (
                <div className="p-4 mb-12 bg-yellow-300 rounded-md">
                  <p>You're not logged in. You will need to log in to persist your configuration.</p>
                </div>
              )}

              <h3 className="mx-6 my-4 leading-tight text-center text-mobile-h3 md:text-desktop-h3 text-slate-headline">
                Welcome, <b>{user?.firstName || user?.fullName || user?.email || "Guest"}</b>
              </h3>

              <div className="mt-4 mb-6">
                <div className="relative flex items-center justify-center w-40 h-40 overflow-hidden bg-gray-300 rounded-lg">
                  {user?.schoolLogo ? (
                    <img src={user?.schoolLogo} alt="logo" className="object-cover w-full h-full" />
                  ) : (
                    <button onClick={() => navigate("/profile")}>
                      <svg className="svg-circleplus" viewBox="0 0 100 100" style={{ height: "40px", stroke: "#000" }}>
                        <circle cx="50" cy="50" r="45" fill="none" strokeWidth="7.5"></circle>
                        <line x1="32.5" y1="50" x2="67.5" y2="50" strokeWidth="5"></line>
                        <line x1="50" y1="32.5" x2="50" y2="67.5" strokeWidth="5"></line>
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    navigate("/generator");
                  }}
                  className="px-4 py-2 my-2 font-medium text-white transition-all duration-300 border-2 border-white rounded-lg bg-slate-blue md:mt-0 hover:text-slate-blue hover:bg-white hover:border-slate-blue text-desktop-paragraph btn"
                >
                  Create Mock
                </button>
                <button
                  onClick={() => {
                    navigate("/profile");
                  }}
                  className="px-4 py-2 my-2 font-medium text-white transition-all duration-300 border-2 border-white rounded-lg bg-slate-blue md:mt-0 hover:text-slate-blue hover:bg-white hover:border-slate-blue text-desktop-paragraph btn"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="flex w-[100vw] h-full max-w-full md:max-w-default md:px-6">
              <div className="flex-1 max-w-[96vw] items-center justify-center">
                {isLoading & UserModel.isLoggedIn ? (
                  <CircularProgress style={{ color: "#4353ff" }} />
                ) : (
                  <DataGrid
                    initialState={{ pinnedColumns: { right: ["actions"] } }}
                    autoHeight
                    rows={configurations?.rows || []}
                    columns={[
                      ...(configurations?.columns || []),
                      {
                        field: "actions",
                        type: "actions",
                        width: 100,
                        getActions: (params) => [
                          <GridActionsCellItem
                            onClick={() => {
                              let rowData = params.row;
                              if (rowData.isErrored) {
                                navigate("/payment/" + rowData.configId);
                              } else if (rowData.status === "paid") {
                                navigate("/payment/" + rowData.configId);
                                // window.open(rowData.finalpdfUrl);
                              } else {
                                navigate("/preview/" + rowData.configId);
                              }
                            }}
                            icon={
                              <span className="material-icons">
                                {params.row.isErrored ? "refresh" : params.row.status === "paid" ? "file_download" : "edit"}
                              </span>
                            }
                            label="Delete"
                          />,
                        ],
                      },
                    ]}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default observer(Dashboard);
