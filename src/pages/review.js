/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import database from "../utils/database";
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "../firebase";
import FrontpageTemplateSelector from "../components/FrontpageTemplateSelector";

const ReviewPage = () => {
  const navigate = useNavigate();
  const params = useParams();

  const [currentConfig, setCurrentConfig] = React.useState(null);
  const [showFPSelector, setShowFPSelector] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState(currentConfig?.frontpage);

  React.useEffect(() => {
    // Get configurations
    handleSetCurrentConfig();
  }, [params]);

  React.useEffect(() => {
    // Update config when front page changes
    if (!currentConfig) return;

    (async () => {
      const updated = {
        ...currentConfig,
        frontpage: selectedTemplate,
      };

      setCurrentConfig(updated);

      const allConfigs = await handleGetConfigurations();
      const copy = [...allConfigs];

      const currentConfigIndex = allConfigs.findIndex((i) => i.configId === params.configId);
      if (currentConfigIndex !== -1) {
        copy[currentConfigIndex] = updated;
      }

      await localStorage.setItem("mg-configData", JSON.stringify(copy));
    })();
  }, [selectedTemplate]);

  const handleSetCurrentConfig = async () => {
    try {
      const allConfigs = (await handleGetConfigurations()) || [];
      const finder = allConfigs.find((i) => i.configId === params.configId);

      if (finder) {
        setCurrentConfig(finder);
        setSelectedTemplate(finder?.frontpage);
      }
    } catch (error) {
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

  const handleGetCurriculum = (code) => {
    const getter = database.curriculum.find((i) => i.code === code);

    return `${getter ? getter.name : code}`;
  };
  const handleGetLevel = (code) => {
    const getter = database.levels.find((i) => i.code === code);

    return `${getter ? getter.name : code}`;
  };
  const handleGetCourse = (code) => {
    const getter = database.subject.find((i) => i.code === code);

    return `${getter ? getter.name : code}`;
  };

  return (
    <section className="font-dm-sans py-12 md:py-[90px] flex flex-col">
      <div className="py-6 m-auto mt-5 max-w-default bg-slate-light">
        <h2 className="text-mobile-h2 md:text-desktop-h2 mx-6 font-medium text-center max-w-[680px] md:m-auto text-slate-headline leading-tight">
          Review Selected Configuration
        </h2>
        <div className="mt-[70px] mx-6">
          {!currentConfig && <p className="text-3xl font-bold">Loading configuration...</p>}
          {currentConfig && (
            <div className="flex flex-col items-center justify-center">
              {currentConfig?.frontpage?.id && selectedTemplate?.id && (
                <div className="flex flex-row items-center justify-between w-full max-w-lg p-4 my-4 space-x-16 bg-gray-200 border-2 rounded-md">
                  <h4 className="text-2xl font-bold">Front Page</h4>
                  <div className="relative overflow-hidden rounded-md">
                    <img
                      className="w-[150px] aspect-[0.707] rounded-md overflow-hidden"
                      src={selectedTemplate?.path}
                      alt={"Preview of front page"}
                    />
                    <button
                      className="absolute bottom-0 left-0 w-full py-2 text-white bg-[#4353ff80] hover:bg-slate-blue"
                      onClick={() => setShowFPSelector(true)}
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}
              <div className="flex flex-row justify-between w-full max-w-lg p-4 my-4 space-x-16 bg-gray-200 border-2 rounded-md">
                <h4 className="text-2xl font-bold">Curriculum</h4>
                <h4 className="text-2xl font-bold">{handleGetCurriculum(currentConfig.curriculum)}</h4>
              </div>
              <div className="flex flex-row justify-between w-full max-w-lg p-4 my-4 space-x-16 bg-gray-200 border-2 rounded-md">
                <h4 className="text-2xl font-bold">Level/Exam</h4>
                <h4 className="text-2xl font-bold">{handleGetLevel(currentConfig.level)}</h4>
              </div>
              <div className="flex flex-row justify-between w-full max-w-lg p-4 my-4 space-x-16 bg-gray-200 border-2 rounded-md">
                <h4 className="text-2xl font-bold">Exam Date</h4>
                <h4 className="text-2xl font-bold">{handleGetCurriculum(currentConfig.examDate)}</h4>
              </div>
              <div className="flex flex-row justify-between w-full max-w-lg p-4 my-4 space-x-16 bg-gray-200 border-2 rounded-md">
                <h4 className="text-2xl font-bold">Course</h4>
                <h4 className="text-2xl font-bold">{handleGetCourse(currentConfig.course)}</h4>
              </div>
              <div className="flex flex-row justify-between w-full max-w-lg p-4 my-4 space-x-16 bg-gray-200 border-2 rounded-md">
                <h4 className="text-2xl font-bold">Number of Sections</h4>
                <h4 className="text-2xl font-bold">{currentConfig.sectionTotal}</h4>
              </div>
              <div className="flex flex-row justify-between w-full max-w-lg p-4 my-4 space-x-16 bg-gray-200 border-2 rounded-md">
                <h4 className="text-2xl font-bold">Exam Instructions</h4>
                <h4 className="text-2xl font-bold">{currentConfig.examInstructions || "N/A"}</h4>
              </div>
              <div className="flex flex-row justify-between w-full max-w-lg p-4 my-4 space-x-16 bg-gray-200 border-2 rounded-md">
                <h4 className="mt-1 text-2xl font-bold">Exam Difficulty</h4>
                <h4 className="mt-1 text-2xl font-bold">{currentConfig?.examDifficulty}</h4>
              </div>
              <div className="flex flex-row justify-between w-full max-w-lg p-4 my-4 space-x-16 bg-gray-200 border-2 rounded-md">
                <h4 className="mt-1 text-2xl font-bold">Question Repetition</h4>
                <h4 className="mt-1 text-2xl font-bold">{currentConfig?.repetition}</h4>
              </div>

              {currentConfig.sectionBlock.map((section, index) => {
                const sectionTitles = ["A", "B", "C", "D", "E"];
                return (
                  <div className="" key={index}>
                    <div className="flex flex-row justify-between w-full max-w-lg p-4 my-4 space-x-16 bg-gray-200 border-2 rounded-md">
                      <h4 className="text-2xl font-bold">Section {sectionTitles[index]}</h4>
                      {currentConfig.sectionValidity[index] && (
                        <h4 className="text-2xl font-bold">{currentConfig.sectionValidity[index] === "1" ? "Mandatory" : "Optional"}</h4>
                      )}
                    </div>
                    <div className="flex flex-row justify-between w-full max-w-lg p-4 my-4 space-x-16 bg-gray-200 border-2 rounded-md">
                      <h4 className="text-2xl font-bold">Number of Questions</h4>
                      <h4 className="text-2xl font-bold">{section.questionTotal}</h4>
                    </div>
                    <div className="flex flex-row justify-between w-full max-w-lg p-4 my-4 space-x-16 bg-gray-200 border-2 rounded-md">
                      <h4 className="text-2xl font-bold">Section Duration</h4>
                      <h4 className="text-2xl font-bold">{section.sectionDuration}</h4>
                    </div>
                    <div className="flex flex-row justify-between w-full max-w-lg p-4 my-4 space-x-16 bg-gray-200 border-2 rounded-md">
                      <h4 className="text-2xl font-bold">Type of Questions</h4>
                      <h4 className="text-2xl font-bold">{section.questionType}</h4>
                    </div>
                    <div className="flex flex-col items-center justify-between w-full max-w-lg p-4 my-4 space-x-16 bg-gray-200 border-2 rounded-md">
                      <h4 className="text-2xl font-bold">Topics for Questions</h4>
                      <div className="flex flex-col w-full">
                        {section.topicPercentages.map((item, index) => {
                          return (
                            <h4
                              key={item.topicId + index}
                              className="flex flex-row justify-start w-full gap-6 text-2xl font-medium text-left"
                            >
                              {/* {handleGetTopic(item.topicId)} */}
                              <div className="basis-2/3 ">{item.topic}</div>
                              <strong>{Number(item.value)}</strong>
                            </h4>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex flex-row justify-between w-full max-w-lg p-4 my-4 space-x-16 bg-gray-200 border-2 rounded-md">
                      <h4 className="text-2xl font-bold">Section Instructions</h4>
                      <h4 className="text-2xl font-bold">{section.sectionInstructions || "N/A"}</h4>
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-col justify-center mt-8 md:space-x-4 md:flex-row md:mt-10">
                <button
                  onClick={async () => {
                    await setDoc(
                      doc(firestore, "examConfiguration", params.configId),
                      {
                        ...currentConfig,
                      },
                      {
                        merge: true,
                      }
                    );
                    navigate("/preview/" + params.configId);
                  }}
                  className="px-8 py-4 font-medium duration-300 border-2 rounded-lg text-slate-blue border-slate-blue text-desktop-paragraph filter hover:text-white hover:bg-slate-blue"
                >
                  Generate Preview
                </button>
                <button
                  onClick={() => navigate("/generator/" + params.configId)}
                  className="px-8 py-4 mt-2 font-medium text-white transition-all duration-300 border-2 border-white rounded-lg bg-slate-blue md:mt-0 hover:text-slate-blue hover:bg-white hover:border-slate-blue text-desktop-paragraph"
                >
                  Edit Configuration
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <FrontpageTemplateSelector
        isOpen={showFPSelector}
        setIsOpen={setShowFPSelector}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
      />
    </section>
  );
};

export default ReviewPage;
