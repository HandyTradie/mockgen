/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { CircularProgress } from "@material-ui/core";
import { doc, collection, getDoc, setDoc } from "firebase/firestore";

import "../../firebase";
import InputBase from "../FormElements/InputBase";
import SelectInput from "../FormElements/SelectInput";
import database from "../../utils/database";
import TextArea from "../FormElements/TextArea";
import Slider from "../Slider";
import { firestore } from "../../firebase";
import FrontPageTemplates from "../../utils/templates.json";
import FrontpageTemplateSelector from "../FrontpageTemplateSelector";
import { useFetchCourses } from "../../api/courses";
import UserModel from "../../models/User";
import toast from "react-hot-toast";
import { useQueryClient } from "react-query";
import RenderQuestionTopics from "../Generator/RenderQuestionTopics";
import RenderCourseQuestions from "../Generator/RenderCourseQuestions";
import { useFetchTopics } from "../../api/topics";

const CreateTemplateForm = () => {
  const user = UserModel.user;
  const queryClient = useQueryClient();

  const [curriculumOptions, setCurriculumOptions] = React.useState([]);
  const [levelOptions, setLevelOptions] = React.useState([]);
  const [courseOptions, setCourseOptions] = React.useState([]);
  const [sectionOptions, setSectionOptions] = React.useState([]);
  const [currentCurriculum, setCurrentCurriculum] = React.useState(null);
  const [currentCourseContent, setCurrentCourseContent] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [remainingQuestion, setRemainingQuestion] = useState([]);
  const [showFPSelector, setShowFPSelector] = useState(false);

  const [formState, setFormState] = React.useState({
    templateName: "",
    templateCategory: "",
    curriculum: "",
    level: "",
    course: "",
    sectionTotal: 1,
    sectionValidity: ["1"],
    examInstructions: "",
    sectionBlock: [],
    templateCreatedAt: new Date().toISOString(),
    status: "draft",
    examDifficulty: 0,
    repetition: "",
    courseName: "",
    frontpage: FrontPageTemplates[0],
  });
  const [formErrorState, setFormErrorState] = React.useState({
    templateName: "",
    templateCategory: "",
    curriculum: "",
    level: "",
    course: "",
    sectionTotal: null,
    sectionValidity: [null],
    examInstructions: "",
    sectionBlock: [],
  });

  const { courses } = useFetchCourses();
  const { data: topics, isLoading: loadingTopics } = useFetchTopics(formState.course, formState.level);

  useEffect(() => {
    // Fill curriculum options
    const optionsCurriculum = [];

    database.curriculum.forEach((item, index) => {
      optionsCurriculum.push({
        disabled: false,
        label: item.name,
        value: item.code,
      });

      setCurriculumOptions([
        {
          disabled: true,
          label: "Please select a curriculum",
          value: "",
        },
        ...optionsCurriculum,
      ]);
    });

    if (database.curriculum.length)
      setFormState({
        ...formState,
        ...{ curriculum: database.curriculum[0].code },
      });

    // Fill section options
    const optionsSections = [];
    [1, 2, 3, 4, 5].forEach((item, index) => {
      optionsSections.push({
        disabled: false,
        label: `${item}`,
        value: item,
      });
      setSectionOptions(optionsSections);
    });
  }, []);

  useEffect(() => {
    setCurrentCurriculum(database.curriculum.filter((item) => item.code === formState.curriculum)[0] || null);

    // Fill level options
    const optionsLevel = [];
    const filteredLabels = database.levels.filter((item) => item.curriculum === formState.curriculum);

    filteredLabels.forEach((item) => {
      optionsLevel.push({
        disabled: false,
        label: item.name,
        value: item.code,
      });

      setLevelOptions([
        {
          disabled: true,
          label: "Please select a level",
          value: "",
        },
        ...optionsLevel,
      ]);
    });

    if (courses) {
      let levels = [];

      for (let index = 0; index < courses.length; index++) {
        const element = courses[index];
        levels.push(element.package_code);
      }

      levels = [...new Set(levels)];
      let levelOpt = [];
      for (let index = 0; index < levels.length; index++) {
        const element = levels[index];
        levelOpt.push({
          disabled: false,
          label: element,
          value: element,
        });
      }

      setLevelOptions([
        {
          disabled: true,
          label: "Please select a level",
          value: "",
        },
        ...levelOpt,
      ]);
    }
  }, [formState.curriculum, formState]);

  useEffect(() => {
    // Fill course options
    const optionsCourse = [];
    const filteredCourses = database.subject.filter((item) => {
      return item.curriculum === formState.curriculum && item.level === formState.level;
    });

    filteredCourses.forEach((item, index) => {
      optionsCourse.push({
        disabled: false,
        label: item.name,
        value: item.code,
        course: item.name,
      });
      setCourseOptions([
        {
          disabled: true,
          label: "Please select a course",
          value: "",
          courseName: "",
        },
        ...optionsCourse,
      ]);
    });

    if (courses) {
      let levels = [];

      for (let index = 0; index < courses.length; index++) {
        const element = courses[index];

        if (element.package_code === formState.level) {
          levels.push({
            disabled: false,
            label: element.name,
            value: element.courseID,
            course: element.name,
          });
        }
      }

      setCourseOptions([
        {
          disabled: true,
          label: "Please select a course",
          value: "",
          courseName: "",
        },
        ...levels,
      ]);
    }
  }, [formState.level, formState]);

  useEffect(() => {
    if (topics?.length > 0) handleTopicSelectionForSections();
  }, [topics, formState.sectionTotal]);

  useEffect(() => {
    if (!formState.course) return;

    // Get course content
    (async () => {
      const q = await getDoc(doc(collection(firestore, "courseContent"), formState.course));
      const courseContent = q.data();

      setCurrentCourseContent(courseContent || null);
    })();
  }, [formState.course]);

  useEffect(() => {
    const sectionTotalArray = [...Array(Number(formState.sectionTotal)).keys()];
    if (formState.sectionBlock.length !== Number(formState.sectionTotal)) {
      setFormState({ ...formState, sectionBlock: [] });

      const blockData = [];
      const blockErrorData = [];

      sectionTotalArray.forEach(() => {
        blockData.push({
          questionTotal: 0,
          sectionDuration: 0,
          questionType: "multiple",
          topicType: "random",
          topicPercentages: [],
          questionOverrides: [],
          sectionInstructions: "",
          possibleAnswerOrientation: "vertical",
        });
        blockErrorData.push({
          questionTotal: null,
          sectionDuration: null,
          questionType: null,
          topicType: null,
          topicPercentages: [],
          questionOverrides: [],
          sectionInstructions: null,
          possibleAnswerOrientation: null,
        });
      });

      setFormState({
        ...formState,
        sectionBlock: blockData,
      });
      setFormErrorState({
        ...formErrorState,
        sectionBlock: blockErrorData,
      });
    }
  }, [formState.sectionTotal]);

  useEffect(() => {
    if (!currentCourseContent || !topics) return false;
    const sectionBlockArray = [...Array(Number(formState.sectionBlock.length)).keys()];
    for (const section of sectionBlockArray) {
      // Get topic type
      const topicType = formState.sectionBlock[section].topicType || "random";

      // Handle topic selection
      handleTopicSelection(section, topicType === "random");
    }
  }, [formState.sectionBlock.length, currentCourseContent]);

  const handleValidations = () => {
    try {
      // Check section validity
      if (formState.sectionTotal < 1) {
        setFormErrorState({
          ...formErrorState,
          ...{
            sectionTotal: "Section total must be a valid number greater than or equal to 1",
          },
        });
      }

      if (formState.sectionTotal < 1) return;

      const sectionTotal = formState.sectionTotal;

      let i = 0;
      for (i; i < sectionTotal; i++) {
        // Validate number of questions
        if (formState.sectionBlock[i].questionTotal < 1) {
          const newErrorSectionBlock = [...formErrorState.sectionBlock];
          newErrorSectionBlock[i].questionTotal = "Question total must be a valid number greater than or equal to 1";

          setFormErrorState({
            ...formErrorState,
            ...newErrorSectionBlock,
          });
        }

        // Validate section duration
        if (formState.sectionBlock[i].questionTotal < 1) {
          const newErrorSectionBlock = [...formErrorState.sectionBlock];
          newErrorSectionBlock[i].sectionDuration = "Question total must be a valid number greater than or equal to 1";

          setFormErrorState({
            ...formErrorState,
            ...newErrorSectionBlock,
          });
        }

        return true;
      }
    } catch (error) {
      alert("Something went wrong while trying to validate configuration. Please try again.");
      return false;
    }
  };

  const handleSaveTemplate = async () => {
    setSaveLoading(true);
    try {
      if (!handleValidations()) return false;

      const template = formState;
      const collRef = collection(firestore, "templates");
      const docRef = doc(collRef);
      await setDoc(docRef, template);

      toast.success("Template created successfully");

      queryClient.invalidateQueries(["templates", "templatesByCategory"]);

      window.location.href = "/admin/dashboard";
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while trying to save template. Please try again.");
    }

    setSaveLoading(false);
  };

  const handleTopicSelectionForSections = () => {
    if (formState.sectionTotal !== undefined && formState.sectionTotal !== null && topics.length > 0) {
      for (let index = 0; index < formState.sectionTotal; index++) {
        const element = formState.sectionBlock[index];
        handleTopicSelection(index, element?.topicType === "random");
      }
    }
  };

  const handleTopicSelection = (blockIndex = 0, isRandom = true) => {
    try {
      const topicSelections = [];
      let topicsToUse = {};

      for (let index = 0; index < topics?.length; index++) {
        let element = topics[index];
        let numberOftopics = element.data.length;

        if (element.qtype === "SINGLE" && formState.sectionBlock[blockIndex].questionType === "multiple") {
          for (let i = 0; i < numberOftopics; i++) {
            const el = element.data[i];

            topicsToUse[el.topic_id] = {
              max: el?.num_q,
              topic: el.topic,
            };
          }
          break;
        } else if (element.qtype === "ESSAY" && formState.sectionBlock[blockIndex].questionType === "essay") {
          for (let i = 0; i < numberOftopics; i++) {
            const el = element.data[i];

            topicsToUse[el.topic_id] = {
              max: el?.num_q,
              topic: el.topic,
            };
          }
          break;
        }
      }
      const topicKeys = Object.keys(topicsToUse);
      for (const key of topicKeys) {
        const { topic, max } = topicsToUse[key];
        if (!topic) continue;

        topicSelections.push({
          topicId: key,
          max,
          value: 0,
          selected: isRandom,
          topic: topicsToUse[key].topic,
        });
      }

      if (isRandom) {
        let loopTimes =
          Number(Math.floor(formState.sectionBlock[blockIndex].questionTotal / topicKeys.length)) +
          (formState.sectionBlock[blockIndex].questionTotal % topicKeys.length === 0 ? 0 : 1);
        let count = 0;
        for (let i = 0; i < loopTimes; i++) {
          for (let index = 0; index < topicSelections.length; index++) {
            let element = topicSelections[index];

            if (element.value >= element.max) continue;

            element.value += 1;
            count += 1;

            if (count === formState.sectionBlock[blockIndex].questionTotal) {
              break;
            }
          }
        }
      }

      const newSectionBlock = [...formState.sectionBlock];
      newSectionBlock[blockIndex].topicPercentages = topicSelections.sort((a, b) => a.topic.localeCompare(b.topic));

      setFormState({
        ...formState,
        sectionBlock: newSectionBlock,
      });
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
      return false;
    }
  };

  const renderSectionValidity = () => {
    const sectionTitles = ["A", "B", "C", "D", "E"];
    return (
      <div className="flex flex-col border-2">
        <div className="p-4 bg-gray-200">
          <p>Mandatory/Optional</p>
        </div>
        {[...Array(Number(formState.sectionTotal)).keys()].map((item, index) => {
          return (
            <div key={`${item + index}`} className="flex items-center justify-center">
              <div className="flex items-center justify-center flex-initial p-4">
                <p className="font-bold text-md">Section {sectionTitles[index]}</p>
              </div>
              <SelectInput
                className="flex-initial"
                name={`sectionValidity${index}`}
                ariaLabel="Section Validity"
                label=""
                value={formState.sectionValidity[index]}
                options={[
                  {
                    disabled: false,
                    label: "Mandatory",
                    value: "1",
                  },
                  {
                    disabled: false,
                    label: "Optional",
                    value: "0",
                  },
                ]}
                onChange={(val) => {
                  const newSectionValidity = [...formState.sectionValidity];
                  newSectionValidity[index] = val;
                  setFormState({
                    ...formState,
                    ...{
                      sectionValidity: newSectionValidity,
                    },
                  });
                }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderSectionBlocks = () => {
    const sectionTitles = ["A", "B", "C", "D", "E"];

    // return nothing if no topics available
    if (topics?.length === 0) {
      return null;
    }

    return (
      <div className="flex flex-col p-4 bg-gray-100 border-2">
        {[...Array(Number(formState.sectionTotal)).keys()].map((item, index) => {
          const sectionQuestionType = formState.sectionBlock[index]?.questionType === "multiple" ? "SINGLE" : "ESSAY";

          return (
            <div key={`${item + index}`}>
              <p className="text-lg font-bold">Section {sectionTitles[index]}</p>
              <div className="">
                <InputBase
                  min={0}
                  disabled={!topics || !topics?.find((t) => t.qtype === sectionQuestionType)?.data?.length}
                  max={
                    formState.sectionBlock.length > 0
                      ? formState.sectionBlock[index].questionType === "essay" && topics.length > 0 && topics[0].data.length > 0
                        ? topics[0].data[0].num_q_d
                        : null
                      : null
                  }
                  name={`questionTotal${index}`}
                  ariaLabel="Number of Questions"
                  label="Number of Questions"
                  type="number"
                  value={formState.sectionBlock[index] ? String(formState.sectionBlock[index].questionTotal).replace(/^0+/, "") : 0}
                  onChange={(val) => {
                    const newSectionBlock = [...formState.sectionBlock];
                    newSectionBlock[index].questionTotal =
                      formState.sectionBlock[index].questionType === "essay" &&
                      topics.length > 0 &&
                      Number(val.replace("-", "")) > topics[0].data[0].num_q_d
                        ? topics[0].data[0].num_q_d
                        : Number(val.replace("-", ""));
                    setFormState({
                      ...formState,
                      ...{
                        sectionBlock: newSectionBlock,
                      },
                    });
                    handleTopicSelectionForSections();
                  }}
                />

                <InputBase
                  name={`questionTotal${index}`}
                  ariaLabel="Section Duration (In minutes)"
                  label="Section Duration (In minutes)"
                  min={0}
                  type="number"
                  value={formState.sectionBlock[index] ? String(formState.sectionBlock[index].sectionDuration).replace(/^0+/, "") : 0}
                  onChange={(val) => {
                    const newSectionBlock = [...formState.sectionBlock];
                    newSectionBlock[index].sectionDuration = Number(val.replace("-", ""));
                    setFormState({
                      ...formState,
                      ...{
                        sectionBlock: newSectionBlock,
                      },
                    });
                  }}
                />

                <SelectInput
                  name={`questionType${index}`}
                  ariaLabel="Type of Questions"
                  label="Type of Questions"
                  value={formState.sectionBlock[index] ? formState.sectionBlock[index].questionType : "multiple"}
                  options={[
                    {
                      disabled: false,
                      label: "Multiple Choice",
                      value: "multiple",
                    },
                    {
                      disabled: false,
                      label: "Essay",
                      value: "essay",
                    },
                    {
                      disabled: false,
                      label: "Fill in",
                      value: "fill",
                    },
                  ]}
                  onChange={(val) => {
                    const newSectionBlock = [...formState.sectionBlock];
                    newSectionBlock[index].questionType = val;
                    // Reset number of questions to 0
                    newSectionBlock[index].questionTotal = 0;
                    setFormState({
                      ...formState,
                      ...{
                        sectionBlock: newSectionBlock,
                      },
                    });
                    if (val !== "fill") {
                      handleTopicSelection(index, newSectionBlock[index].topicType === "random");
                    }
                  }}
                />
                {formState.sectionBlock[index].questionType === "multiple" && (
                  <SelectInput
                    name={`orientation${index}`}
                    label="Possible Answers"
                    ariaLabel="Possible Answers"
                    value={formState.sectionBlock[index]?.possibleAnswerOrientation}
                    options={[
                      {
                        disabled: false,
                        label: "Vertical Align",
                        value: "vertical",
                      },
                      {
                        disabled: false,
                        label: "Horizontal Align",
                        value: "horizontal",
                      },
                      {
                        disabled: false,
                        label: "No Possible Answers",
                        value: "none",
                      },
                    ]}
                    onChange={(val) => {
                      const newSectionBlock = [...formState.sectionBlock];
                      newSectionBlock[index].possibleAnswerOrientation = val;
                      setFormState({
                        ...formState,
                        ...{
                          sectionBlock: newSectionBlock,
                        },
                      });
                    }}
                  ></SelectInput>
                )}

                <InputBase
                  name={`questionTotal${index}`}
                  ariaLabel="Section Marks"
                  label="Section Marks"
                  min={0}
                  type="number"
                  value={formState.sectionBlock[index]?.totalMarks}
                  onChange={(val) => {
                    const newSectionBlock = [...formState.sectionBlock];
                    newSectionBlock[index]["totalMarks"] = Number(val);
                    setFormState({
                      ...formState,
                      ...{
                        sectionBlock: newSectionBlock,
                      },
                    });
                  }}
                />

                {formState.sectionBlock[index].questionType === "essay" && (
                  <InputBase
                    name={`mpq${index}`}
                    ariaLabel="Marks per Question"
                    label="Marks per Question"
                    min={0}
                    type="number"
                    value={formState.sectionBlock[index]?.marksPerQuestion}
                    onChange={(val) => {
                      const newSectionBlock = [...formState.sectionBlock];
                      newSectionBlock[index]["marksPerQuestion"] = Number(val);

                      setFormState({
                        ...formState,
                        ...{
                          sectionBlock: newSectionBlock,
                        },
                      });
                    }}
                  />
                )}

                <SelectInput
                  name={`topicType${index}`}
                  ariaLabel="Topics for Questions"
                  label="Topics for Questions"
                  value={formState.sectionBlock[index] ? formState.sectionBlock[index].topicType : "random"}
                  options={[
                    {
                      disabled: false,
                      label: "Random Topics",
                      value: "random",
                    },
                    {
                      disabled: false,
                      label: "Manual Selection",
                      value: "manual",
                    },
                  ]}
                  onChange={(val) => {
                    const newSectionBlock = [...formState.sectionBlock];
                    newSectionBlock[index].topicType = val;
                    setFormState({
                      ...formState,
                      ...{
                        sectionBlock: newSectionBlock,
                      },
                    });

                    handleTopicSelectionForSections();
                  }}
                />
                {topics?.length > 0 ? (
                  <RenderQuestionTopics
                    blockIndex={index}
                    formState={formState}
                    setFormState={setFormState}
                    loadingTopics={loadingTopics}
                    remainingQuestion={remainingQuestion}
                    setRemainingQuestion={setRemainingQuestion}
                    topics={topics}
                  />
                ) : loadingTopics ? (
                  <div className="flex items-center justify-center">
                    <CircularProgress />
                  </div>
                ) : (
                  <div className="flex items-center justify-center">No topics found.</div>
                )}

                {formState.sectionBlock[index].questionType === "essay" && formState.sectionBlock[index].topicType === "manual" ? (
                  <RenderCourseQuestions
                    blockIndex={index}
                    formState={formState}
                    setFormState={setFormState}
                    loadingTopics={loadingTopics}
                    remainingQuestion={remainingQuestion}
                    setRemainingQuestion={setRemainingQuestion}
                    topics={topics}
                  />
                ) : null}

                <TextArea
                  name={`sectionInstructions${index}`}
                  label="Sections Instructions"
                  ariaLabel="Sections Instructions"
                  value={formState.sectionBlock[index] ? formState.sectionBlock[index].sectionInstructions : ""}
                  onChange={(val) => {
                    const newSectionBlock = [...formState.sectionBlock];
                    newSectionBlock[index].sectionInstructions = val;
                    setFormState({
                      ...formState,
                      ...{
                        sectionBlock: newSectionBlock,
                      },
                    });
                  }}
                />
              </div>
            </div>
          );
        })}
        <div className="flex items-center justify-center mb-4">
          <div className="w-full">
            <h4 className="mt-1 text-xl font-bold">Select Exam Difficulty</h4>
            <Slider />
          </div>
        </div>
        {user !== null && (
          <div className="flex flex-col items-center justify-center mt-4 mb-4">
            <span className="text-xl font-bold mt-">Question Repetition</span>
            <div className="flex gap-4">
              <div>
                <input
                  checked={formState.repetition === "yes"}
                  onChange={(val) => {
                    setFormState({
                      ...formState,
                      repetition: val.target.value,
                    });
                  }}
                  type="radio"
                  id="yes"
                  name="yes"
                  value="yes"
                />
                <label htmlFor="yes">Yes</label>
              </div>
              <div>
                <input
                  onChange={(val) => {
                    setFormState({
                      ...formState,
                      repetition: val.target.value,
                    });
                  }}
                  type="radio"
                  id="no"
                  checked={formState.repetition === "no"}
                  name="no"
                  value="no"
                />
                <label htmlFor="no">No</label>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFormBasedCurriculum = () => {
    if (!currentCurriculum || !currentCurriculum.isAvailable) {
      return (
        <div className="p-4 my-4 bg-yellow-300 rounded-md">
          <p>Coming Soon</p>
        </div>
      );
    }

    return (
      <div>
        <SelectInput
          name="level"
          ariaLabel="Level"
          label="Level"
          options={levelOptions}
          value={formState.level}
          onChange={(val) => {
            setFormState({
              ...formState,
              level: val,
              course: "",
            });
            setCourseOptions([
              {
                disabled: true,
                label: "Please select a course",
                value: "",
                courseName: "",
              },
            ]);
          }}
        />
        <SelectInput
          name="courses"
          ariaLabel="Course"
          label="Course"
          options={courseOptions}
          value={formState.course}
          onChange={(val) => {
            const courseName = courseOptions.find((i) => i.value === val);

            // Reset section block
            const sections = [...Array(formState.sectionBlock.length)].map((i) => ({
              questionTotal: 0,
              sectionDuration: 0,
              questionType: "multiple",
              topicType: "random",
              topicPercentages: [],
              questionOverrides: [],
              sectionInstructions: "",
              possibleAnswerOrientation: "vertical",
            }));

            setFormState({
              ...formState,
              ...{
                course: val,
                courseName: courseName.label ?? "",
                sectionBlock: sections,
              },
            });
          }}
        />
        <SelectInput
          name="sectionTotal"
          ariaLabel="Number of Sections"
          label="Number of Sections"
          options={sectionOptions}
          value={formState.sectionTotal}
          onChange={(val) => {
            let sections = [];
            for (let index = 0; index < val; index++) {
              sections.push({
                questionTotal: 0,
                sectionDuration: 0,
                questionType: "multiple",
                topicType: "random",
                topicPercentages: [],
                questionOverrides: [],
                sectionInstructions: "",
                possibleAnswerOrientation: "vertical",
              });
            }

            const sectionValidity = new Array(Number(val));
            sectionValidity.fill("1");

            setFormState({
              ...formState,
              sectionTotal: Number(val),
              sectionBlock: sections,
              sectionValidity,
            });
          }}
        />
        {renderSectionValidity()}
        <TextArea
          name="examInstructions"
          label="Exam Instructions"
          ariaLabel="Exam Instructions"
          value={formState.examInstructions}
          onChange={(val) =>
            setFormState({
              ...formState,
              ...{
                examInstructions: val,
              },
            })
          }
        />
        {renderSectionBlocks()}
      </div>
    );
  };

  return (
    <section className="py-12 font-dm-sans">
      <div className="m-auto max-w-default">
        <div className="mt-[70px] md:mx-6 xs:mx-2">
          <div className="flex flex-col my-4">
            <h4 className="mb-2 text-lg font-bold text-left text-slate-body">Template Front Page</h4>
            <div className="relative overflow-hidden rounded-md">
              <img
                className="w-[150px] aspect-[0.707] rounded-md overflow-hidden"
                src={formState?.frontpage?.path}
                alt={"Preview of front page"}
              />
              <button
                className="absolute bottom-0 left-0 w-[150px] py-2 text-white bg-[#4353ff80] hover:bg-slate-blue"
                onClick={() => setShowFPSelector(true)}
              >
                Change
              </button>
            </div>
          </div>
          <FrontpageTemplateSelector
            isOpen={showFPSelector}
            setIsOpen={setShowFPSelector}
            selectedTemplate={formState?.frontpage?.path}
            setSelectedTemplate={(frontpage) => {
              setFormState({
                ...formState,
                frontpage,
              });
            }}
          />

          <InputBase
            name="subject"
            ariaLabel="Subject"
            label="Subject"
            value={formState.templateName}
            onChange={(val) =>
              setFormState({
                ...formState,
                templateName: val,
              })
            }
          />

          <InputBase
            name="examType"
            ariaLabel="Exam Type"
            label="Exam Type"
            value={formState.templateCategory}
            onChange={(val) =>
              setFormState({
                ...formState,
                templateCategory: String(val).toUpperCase(),
              })
            }
          />

          <SelectInput
            name="curriculum"
            ariaLabel="Curriculum"
            label="Curriculum"
            options={curriculumOptions}
            value={formState.curriculum}
            onChange={(val) =>
              setFormState({
                ...formState,
                curriculum: val,
              })
            }
          />
          {renderFormBasedCurriculum()}

          <div className="flex flex-col justify-center mt-8 md:space-x-4 md:flex-row md:mt-10">
            <button
              disabled={saveLoading}
              onClick={handleSaveTemplate}
              className="px-8 py-4 mt-2 font-medium text-white transition-all duration-300 border-2 border-white rounded-lg bg-slate-blue md:mt-0 hover:text-slate-blue hover:bg-white hover:border-slate-blue text-desktop-paragraph"
            >
              {saveLoading ? <CircularProgress size={"1.5em"} style={{ color: "white" }} /> : "Create Template"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateTemplateForm;
