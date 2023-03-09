/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { CircularProgress } from "@material-ui/core";
import { useNavigate, useParams } from "react-router-dom";
import { doc, collection, getDoc } from "firebase/firestore";
import ImageUploader from "react-image-upload";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import "../firebase";
import InputBase from "../components/FormElements/InputBase";
import SelectInput from "../components/FormElements/SelectInput";
import database from "../utils/database";
import TextArea from "../components/FormElements/TextArea";
import { genRandomString } from "../utils";
import Slider from "../components/Slider";
import { firestore } from "../firebase";
import FrontPageTemplates from "../utils/templates.json";
import { storage } from "../firebase";
import { useFetchCourses } from "../api/courses";
import UserModel from "../models/User";
import { useFetchTemplates } from "../api/configurations";
import RenderQuestionTopics from "../components/Generator/RenderQuestionTopics";
import RenderCourseQuestions from "../components/Generator/RenderCourseQuestions";
import CheckBox from "../components/FormElements/CheckBox";
import { useFetchTopics } from "../api/topics";

const GeneratorBuild = () => {
  const user = UserModel.user;
  const userDetails = UserModel.user;

  const navigate = useNavigate();
  const params = useParams();

  const [curriculumOptions, setCurriculumOptions] = React.useState([]);
  const [levelOptions, setLevelOptions] = React.useState([]);
  const [courseOptions, setCourseOptions] = React.useState([]);
  const [sectionOptions, setSectionOptions] = React.useState([]);
  const [schoolLogoSource, setSchoolLogoSource] = useState({});
  const [existingLogoSource, setExistingLogoSource] = useState("");
  const [currentCurriculum, setCurrentCurriculum] = React.useState(null);
  const [currentCourseContent, setCurrentCourseContent] = React.useState(null);
  const [editMode, setEditMode] = React.useState(false);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [remainingQuestion, setRemainingQuestion] = useState([]);
  const [formState, setFormState] = React.useState({
    schoolName: "",
    schoolLogoURL: "",
    useProfileLogo: false,
    examTitle: "",
    curriculum: "",
    level: "",
    course: "",
    sectionTotal: 1,
    sectionValidity: ["1"],
    examInstructions: "",
    sectionBlock: [],
    createdAt: new Date().toISOString(),
    status: "draft",
    examDifficulty: 0,
    repetition: "",
    examDate: "",
    courseName: "",
    frontpage: FrontPageTemplates[0],
    templateCategory: "",
    templates: [],
  });
  const [formErrorState, setFormErrorState] = React.useState({
    schoolName: "",
    examTitle: "",
    curriculum: "",
    level: "",
    course: "",
    sectionTotal: null,
    sectionValidity: [null],
    examInstructions: "",
    sectionBlock: [],
  });

  const { data: topics, isLoading: loadingTopics } = useFetchTopics(formState.course, formState.level);
  const { courses } = useFetchCourses();
  const { data: templates, isLoading: isTemplatesLoading } = useFetchTemplates();
  const tempCategoryOptions = Object.keys(templates || {}).map((key) => ({
    value: key,
    label: key,
  }));

  const templateCategoryOptions = [{ value: "", label: "Select a template category", disabled: true }, ...tempCategoryOptions];
  const templateOptions = [
    ...(templates?.[formState.templateCategory]?.map((template) => ({
      value: template.id,
      label: template.templateName,
    })) || []),
  ];

  // Helper statements
  const isSimpleMode = Boolean(formState.templateCategory);
  const isAdvancedMode = Boolean(formState.curriculum);

  const [failedMsg, setFailedMsg] = useState('');

  const clearFormSelection = () => {
    setFormState({
      ...formState,
      curriculum: "",
      templateCategory: "",
    });
  };

  useEffect(() => {
    // load saved logo
    (async (_) => {
      let logo = await localStorage.getItem("mg-existingLogo");
      setExistingLogoSource(logo);
      // cache topics percentages
      localStorage.setItem('topicPercentages', JSON.stringify({topics: []}))
    })();

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
    setEditMode(Boolean(params.configId));

    (async () => {
      // Get configurations
      const configData = await handleSetCurrentConfig(params.configId);
      if (configData) setFormState(configData);
    })();
  }, [params]);

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
          possibleAnswerOrientation: "vertical",
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

  const handleSaveConfiguration = async (reRouter) => {
    // console.log(formState)
    const sectBlocks = formState.sectionBlock.filter(blk => blk.topicType === 'manual');
    let noneSelected = false, sectIndex;
    sectBlocks.forEach((blk, index) => {
      noneSelected = blk.topicPercentages.every(topic => topic.value === 0);
      if (noneSelected) sectIndex = index;
    })
    if (noneSelected) {
      setFailedMsg(`Section ${sectIndex + 1} has question type set to manual but no topics were selected! Please re-select the topics to proceed if the initial selections have been cleared.`);
      return;
    }

    let logoURL = "";
    setSaveLoading(true);
    try {
      if (!handleValidations()) return false;

      // Upload logo
      if (schoolLogoSource && !formState.useProfileLogo) {
        const file = schoolLogoSource?.file;

        if (file) {
          const fileName = `${user?.uid || Math.random().toString(36).substring(3, 9)}.${new Date().toISOString()}`;

          const metadata = {
            contentType: file.type,
            contentDisposition: `${file.name}.${file.type.split("/")[1]}`,
          };

          const storageRef = ref(storage, `logos/${fileName}`);
          await uploadBytes(storageRef, file, metadata);

          const downloadURL = await getDownloadURL(storageRef);
          logoURL = downloadURL;
        }
      }

      // Use profile picture as logo
      if (formState.useProfileLogo) {
        const { schoolLogo } = user;
        logoURL = schoolLogo || "";
      }

      let data = {
        ...formState,
        ...{
          configId: editMode ? params.configId : genRandomString(10),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          schoolLogoURL: logoURL,
        },
        userId: user && user.uid !== undefined ? user.uid : null,
      };

      if (user && user.uid !== undefined) {
        data["userId"] = user?.uid;
      }

      // If template selected, get template data and add to data
      if (formState?.templates.length === 1 && !formState.curriculum) {
        const templateData = templates[formState.templateCategory].find((template) => template.id === formState.templates[0]);
        data = { ...data, ...templateData };
      }

      const allConfigs = await handleGetConfigurations();
      let saver = [...allConfigs];

      if (editMode) {
        const currentConfigIndex = allConfigs.findIndex((i) => i.configId === params.configId);
        if (currentConfigIndex !== -1) {
          saver[currentConfigIndex] = data;
        }
      } else {
        saver = [...allConfigs, data];
      }

      localStorage.setItem("mg-configData", JSON.stringify(saver));
      localStorage.setItem("mg-existingLogo", logoURL);

      if (reRouter) {
        navigate(`${reRouter}/${data.configId}`);
      } else {
        navigate(`/generator/${data.configId}`);
      }
    } catch (error) {
      alert("Something went wrong while trying to save configuration. Please try again.");
      console.error(error);
    }

    setSaveLoading(false);
  };

  const handleGenerateMultipleExams = async () => {
    let logoURL = "";
    setSaveLoading(true);
    try {
      if (!handleValidations()) return false;

      // Upload logo
      if (schoolLogoSource && !formState.useProfileLogo) {
        const file = schoolLogoSource?.file;

        if (file) {
          const fileName = `${user?.uid || Math.random().toString(36).substring(3, 9)}.${new Date().toISOString()}`;

          const metadata = {
            contentType: file.type,
            contentDisposition: `${file.name}.${file.type.split("/")[1]}`,
          };

          const storageRef = ref(storage, `logos/${fileName}`);
          await uploadBytes(storageRef, file, metadata);

          const downloadURL = await getDownloadURL(storageRef);
          logoURL = downloadURL;
        }
      }

      // Use profile picture as logo
      if (formState.useProfileLogo) {
        const { schoolLogo } = user;
        logoURL = schoolLogo || "";
      }

      // For each template selected, generate a config
      const configs = [];

      for (const templateID of formState.templates) {
        let data = {
          ...formState,
          configId: editMode ? params.configId : genRandomString(10),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          schoolLogoURL: logoURL,
          userId: user && user.uid !== undefined ? user.uid : null,
        };

        if (user && user.uid !== undefined) {
          data["userId"] = user?.uid;
        }

        const templateData = templates[formState.templateCategory].find((template) => template.id === templateID);
        data = { ...data, ...templateData };
        configs.push(data);
      }

      // Save configs
      const allConfigs = await handleGetConfigurations();
      let saver = [...allConfigs];
      saver = [...saver, ...configs];

      await localStorage.setItem("mg-configData", JSON.stringify(saver));
      localStorage.setItem("mg-existingLogo", logoURL);

      navigate(`/preview/m/${configs.map((i) => i.configId).join(",")}`);
    } catch (error) {
      alert("Something went wrong while trying to save configuration. Please try again.");
      console.error(error);
    }

    setSaveLoading(false);
  };

  const handleTopicSelectionForSections = () => {
    // console.log(formState)
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
      const savedTopics = localStorage.getItem('topicPercentages');
      let { topics: topicPcts } = JSON.parse(savedTopics);

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
      let percentages = topicPcts.length > 0 ? topicPcts[blockIndex] : [];
      // console.log(topicPcts)
      for (const key of topicKeys) {
        const { topic, max } = topicsToUse[key];
        if (!topic) continue;

        let savedTopic = percentages ? 
        percentages.find(topic => topic.topicId === key) : undefined;
        // console.log('Saved topic with id:' + key, savedTopic)
        if (savedTopic !== undefined) {
          topicSelections.push({
            topicId: key,
            max,
            value: savedTopic.value || 0,
            selected: savedTopic.selected || isRandom,
            topic: savedTopic.topic || topicsToUse[key].topic,
          });
        } else {
          topicSelections.push({
            topicId: key,
            max,
            value: 0,
            selected: isRandom,
            topic: topicsToUse[key].topic,
          });
        }
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
    // console.log(topics)
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

              <InputBase
                min={0}
                disabled={!topics || !topics?.find((t) => t.qtype === sectionQuestionType)?.data?.length}
                max={
                  formState.sectionBlock?.length > 0
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
                      : formState.sectionBlock[index].questionType === "multiple" ? Number(val.replace("-", "")) : Number(val);
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
                    sectionBlock: newSectionBlock,
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
              sectionValidity: Array(val).fill("1"),
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
        {!user && (
          <div className="p-4 my-4 bg-yellow-300 rounded-md">
            <p>You're not logged in. You will need to log in to persist your configuration.</p>
          </div>
        )}
        <div className="mt-[70px] md:mx-6 xs:mx-2">
          <div className="flex flex-col items-start gap-2 mb-2">
            <p className="ml-2 text-lg font-bold text-slate-body">School Logo</p>
            <div className="">
              {!formState.useProfileLogo ? (
                existingLogoSource ? (
                  <div className="img-prev">
                    <img
                      src={existingLogoSource}
                      alt="school logo"
                      style={{
                        height: 150,
                        width: 150,
                        borderRadius: 8,
                      }}
                    />
                    <i
                      className="fas fa-minus-circle"
                      onClick={() => {
                        setExistingLogoSource("");
                      }}
                    ></i>
                  </div>
                ) : (
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
                    onFileAdded={(img) => {
                      setSchoolLogoSource(img);
                    }}
                    onFileRemoved={() => {
                      setSchoolLogoSource({});
                    }}
                  />
                )
              ) : (
                <img
                  src={userDetails.schoolLogo}
                  alt="User profile"
                  className="rounded-lg overflow-hidden w-[150px] h-[150px] object-cover"
                />
              )}
            </div>

            <label
              className={`flex items-center mt-1 ml-2`}
              title={userDetails?.schoolLogo ? "" : "User does not have a profile picture set. Add one from the dashboard."}
            >
              <input
                type={"checkbox"}
                disabled={!userDetails?.schoolLogo}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormState({
                      ...formState,
                      useProfileLogo: true,
                    });
                  } else {
                    setFormState({
                      ...formState,
                      useProfileLogo: false,
                    });
                  }
                }}
              />
              <span className={`ml-2 text-sm font-bold text-slate-body ${!userDetails?.schoolLogo && "text-opacity-30"}`}>
                Use profile picture as logo
              </span>
            </label>
          </div>

          <InputBase
            name="schoolName"
            ariaLabel="School Name"
            label="School Name"
            value={formState.schoolName}
            onChange={(val) =>
              setFormState({
                ...formState,
                ...{
                  schoolName: val,
                },
              })
            }
          />

          <InputBase
            name="examTitle"
            ariaLabel="Exam Title"
            label="Exam Title"
            value={formState.examTitle}
            onChange={(val) =>
              setFormState({
                ...formState,
                ...{
                  examTitle: val,
                },
              })
            }
          />
          <InputBase
            name="examdate"
            ariaLabel="Exam Date"
            label="Exam Date"
            value={formState.examDate}
            placeholder="eg: April 2019"
            onChange={(val) =>
              setFormState({
                ...formState,
                ...{
                  examDate: val,
                },
              })
            }
          />

          {(isAdvancedMode || isSimpleMode) && (
            <button className="mt-8 -mb-6 text-left back-btn item-start" onClick={clearFormSelection}>
              <span className="arrow-left">&lt;</span>
              <span className="bck-txt">Back</span>
            </button>
          )}

          {!isAdvancedMode && (
            <div>
              <div>
                <p className="mt-10 ml-2 text-lg font-bold text-slate-body">Use a ready-made exam template</p>
                <p>Fill in the details above and select a standardized exam below to quickly get started.</p>

                {isTemplatesLoading ? (
                  <div className="mt-4">
                    <CircularProgress />
                  </div>
                ) : (
                  <div className="mt-6">
                    <SelectInput
                      name="Exam Type"
                      ariaLabel="Exam Type"
                      label="Exam Type"
                      value={formState?.templateCategory}
                      options={templateCategoryOptions}
                      onChange={(val) => {
                        setFormState({
                          ...formState,
                          templateCategory: val,
                          templates: [],
                        });
                      }}
                    />
                    {formState?.templateCategory && (
                      <div className="mt-4 ml-2 text-left">
                        <p className="text-lg font-bold text-slate-body">Subjects</p>
                        <div className="space-y-2">
                          {templateOptions.map((template) => (
                            <label className="flex items-center gap-3" key={template.value}>
                              <CheckBox
                                name={template.value}
                                checked={formState.templates.includes(template.value)}
                                onChange={() => {
                                  // Add or remove the template from the list
                                  if (formState.templates.includes(template.value)) {
                                    setFormState({
                                      ...formState,
                                      templates: formState.templates.filter((t) => t !== template.value),
                                    });
                                  } else {
                                    setFormState({
                                      ...formState,
                                      templates: [...formState.templates, template.value],
                                    });
                                  }
                                }}
                              />
                              <p className="mt-2">{template.label}</p>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {!isAdvancedMode && !isSimpleMode && (
            <div className="relative my-10 border-b border-black">
              <span className="absolute px-2 bg-white -bottom-[11px]">or</span>
            </div>
          )}

          {!isSimpleMode && (
            <>
              <div>
                <p className="mt-10 ml-2 text-lg font-bold text-slate-body">Advanced</p>
                <p>Select a curriculum below to go on to create a customised exam.</p>
              </div>
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
            </>
          )}

          {saveLoading && (
            <div className="mt-6">
              <CircularProgress size={"2em"} />
            </div>
          )}

          {failedMsg !== '' ? <p className="failedmsg" style={{
            marginTop: '40px',
            color: 'crimson',
            maxWidth: '600px',
            marginInline: 'auto'
          }}>{failedMsg}</p> : null}

          {isSimpleMode && formState.templates.length > 1 ? (
            <div className="flex flex-col justify-center mt-8 md:space-x-4 md:flex-row md:mt-10">
              <button
                disabled={saveLoading}
                onClick={() => handleGenerateMultipleExams()}
                className="px-8 py-4 font-medium duration-300 border-2 rounded-lg text-slate-blue border-slate-blue text-desktop-paragraph filter hover:text-white hover:bg-slate-blue"
              >
                Generate Exams
              </button>
            </div>
          ) : (
            <div className="flex flex-col justify-center mt-8 md:space-x-4 md:flex-row md:mt-10">
              <button
                disabled={saveLoading}
                onClick={() => handleSaveConfiguration("/review")}
                className="px-8 py-4 font-medium duration-300 border-2 rounded-lg text-slate-blue border-slate-blue text-desktop-paragraph filter hover:text-white hover:bg-slate-blue"
              >
                Review Configuration
              </button>
              <button
                disabled={saveLoading}
                onClick={() => handleSaveConfiguration()}
                className="px-8 py-4 mt-2 font-medium text-white transition-all duration-300 border-2 border-white rounded-lg bg-slate-blue md:mt-0 hover:text-slate-blue hover:bg-white hover:border-slate-blue text-desktop-paragraph"
              >
                Save Configuration
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default GeneratorBuild;

const handleGetConfigurations = async () => {
  try {
    const configData = (await localStorage.getItem("mg-configData")) || "[]";

    return JSON.parse(configData);
  } catch (error) {
    console.error(error);
    alert("Something went wrong while trying to retrieve configuration. Please try again.");
    return [];
  }
};

const handleSetCurrentConfig = async (configId) => {
  try {
    const allConfigs = (await handleGetConfigurations()) || [];
    const finder = allConfigs.find((i) => i.configId === configId);
    return finder;
  } catch (error) {
    alert("Something went wrong while trying to set configuration data. Please try again.");
  }
};
