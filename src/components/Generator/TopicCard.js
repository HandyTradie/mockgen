import { useState, forwardRef } from "react";
import { ChevronDownIcon } from "@heroicons/react/outline";

import CheckBox from "../FormElements/CheckBox";
import InputBase from "../FormElements/InputBase";
import TextArea from "../FormElements/TextArea";
import TopicQuestionsList from "./TopicQuestionsList";

const TopicCard = forwardRef(
  (
    {
      index,
      blockIndex,
      itemKey,
      topic,
      topics,
      formState,
      setFormState,
      remainingQuestion,
      setRemainingQuestion,
      questionsLeftToBeAssigned,
      checkedCount,
      assignedCount,
      questionTotal,
      ...rest
    },
    ref
  ) => {
    const [showQuestions, setShowQuestions] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    const maxQuestions = checkAvailableForTopic(
      topic.topicId,
      formState.sectionBlock[blockIndex].questionType,
      blockIndex,
      topics,
      formState.sectionBlock[blockIndex].questionTotal
    );

    const inputMax = questionTotal - (assignedCount - formState.sectionBlock[blockIndex].topicPercentages[index]?.value);

    return (
      <li ref={ref} {...rest} className="flex flex-col items-center justify-center w-full bg-[#f3f4f6] border-b border-black">
        <div className="flex flex-col-reverse items-center justify-center w-full md:flex-row">
          <div className="flex items-center justify-start flex-none w-4/12 p-1">
            <div className="w-full">
              <InputBase
                name={`questionTopic${topic.topicId}percent`}
                min={0}
                max={inputMax}
                disabled={
                  formState.sectionBlock[blockIndex].topicType === "random"
                    ? true
                    : !formState.sectionBlock[blockIndex].topicPercentages[index].selected
                }
                ariaLabel="Topic Percentage"
                type="number"
                value={formState.sectionBlock[blockIndex].topicPercentages[index]?.value}
                onChange={(val) => {
                  const newSectionBlock = [...formState.sectionBlock];

                  if (parseInt(val) > inputMax) {
                    newSectionBlock[blockIndex].topicPercentages[index].value = inputMax;
                  } else {
                    newSectionBlock[blockIndex].topicPercentages[index].value = Number(val.replace("-", ""));
                  }

                  setFormState({
                    ...formState,
                    ...{
                      sectionBlock: newSectionBlock,
                    },
                  });

                  // cache topic percentages
                  const savedTopics = localStorage.getItem('topicPercentages');
                  let { topics: topicsPcts } = JSON.parse(savedTopics);
                  topicsPcts[blockIndex] = newSectionBlock[blockIndex].topicPercentages;
                  localStorage.setItem('topicPercentages', JSON.stringify({topics: topicsPcts}));
                  // console.log(topicsPcts)
                }}
              />
            </div>
          </div>
          <div className="flex flex-col items-center justify-between flex-none w-full gap-4 p-4 md:flex-row sm:w-8/12">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="w-6 h-6 mt-2 rounded-lg"
                onChange={() => {
                  const newSectionBlock = [...formState.sectionBlock];
                  newSectionBlock[blockIndex].topicPercentages[index] = {
                    ...newSectionBlock[blockIndex].topicPercentages[index],
                    selected: !formState.sectionBlock[blockIndex].topicPercentages[index].selected,
                    value: formState.sectionBlock[blockIndex].topicPercentages[index].value,
                  };
                  setFormState({
                    ...formState,
                    sectionBlock: newSectionBlock,
                  });

                  // cache topic percentages
                  const savedTopics = localStorage.getItem('topicPercentages');
                  let { topics: topicsPcts } = JSON.parse(savedTopics);
                  topicsPcts[blockIndex] = newSectionBlock[blockIndex].topicPercentages;
                  localStorage.setItem('topicPercentages', JSON.stringify({topics: topicsPcts}));
                  // console.log(topicsPcts)
                }}
                name={`questionTopic${itemKey}`}
                label={formState.sectionBlock[blockIndex].topicPercentages[index].topic}
                disabled={
                  formState.sectionBlock[blockIndex].topicType === "random" ||
                  (formState.sectionBlock[blockIndex].questionTotal - (remainingQuestion[blockIndex] ?? 0) === 0 &&
                    (formState.sectionBlock[blockIndex].topicPercentages[index].value ?? 0) === 0)
                }
                checked={formState.sectionBlock[blockIndex].topicPercentages[index].selected}
              />
              <p className={`mt-2 ml-4 text-xl font-medium text-left line-clamp-4 `}>
                {formState.sectionBlock[blockIndex].topicPercentages[index].topic}
              </p>
            </div>
            <button
              onClick={() => setShowQuestions((e) => !e)}
              className="px-2 py-2 font-medium duration-300 border-2 rounded-lg text-slate-blue border-slate-blue text-desktop-paragraph filter hover:text-white hover:bg-slate-blue"
            >
              Questions
            </button>
          </div>
        </div>
        <div className="w-full pb-2">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-start flex-grow p-1">
              <p className="font-bold text-md">Available questions: {maxQuestions}</p>
            </div>

            <button className="flex items-center gap-2" onClick={() => setShowInstructions((e) => !e)}>
              Instructions
              <ChevronDownIcon
                width={16}
                height={16}
                className={`transition-all duration-200 ease-in-out mt-[1px] ${showInstructions && "rotate-180"}`}
              />
            </button>
          </div>
          {showInstructions && (
            <TextArea
              value={formState.sectionBlock[blockIndex].topicPercentages[index]?.instructions}
              onChange={(val) => {
                const newSectionBlock = [...formState.sectionBlock];
                newSectionBlock[blockIndex].topicPercentages[index] = {
                  ...newSectionBlock[blockIndex].topicPercentages[index],
                  instructions: val,
                };

                setFormState({
                  ...formState,
                  ...{
                    sectionBlock: newSectionBlock,
                  },
                });
              }}
            />
          )}
        </div>
        {showQuestions && (
          <TopicQuestionsList
            index={index}
            topicId={topic.topicId}
            limit={maxQuestions}
            disabled={!formState.sectionBlock[blockIndex].topicPercentages[index].selected}
            blockIndex={blockIndex}
            formState={formState}
            setFormState={setFormState}
            questionsLeftToBeAssigned={questionsLeftToBeAssigned}
            checkedCount={checkedCount}
          />
        )}
      </li>
    );
  }
);

export default TopicCard;

const checkForMaxForTopic = (topic_id, qtype, index, topics, total) => {
  let max = 0;
  let num_q = 0;
  if (qtype === "essay") {
    let topic = topics[0]?.data.find((t) => String(t.topic_id) === String(topic_id));
    num_q = topic?.num_q || 0;
  } else {
    let topic = topics[1]?.data.find((t) => String(t.topic_id) === String(topic_id));
    num_q = topic?.num_q || 0;
  }
  let remQue = total;
  if (num_q > remQue) {
    max = remQue;
  } else {
    max = num_q;
  }

  return max;
};

const checkAvailableForTopic = (topic_id, qtype, index, topics, total) => {
  if (qtype === "essay") {
    let topic = topics[0]?.data.find((t) => String(t.topic_id) === String(topic_id));
    let num = topic?.num_q || 0;
    return num;
  } else {
    let topic = topics[1]?.data.find((t) => String(t.topic_id) === String(topic_id));
    let num = topic?.num_q || 0;
    return num;
  }
};

const checkForMax = (topic_id, qtype, index, topics, total, remainingQuestion) => {
  let max = 0;
  let num_q = 0;
  if (qtype === "essay") {
    let topic = topics[0]?.data.find((t) => String(t.topic_id) === String(topic_id));
    num_q = topic?.num_q || 0;
  } else {
    let topic = topics[1]?.data.find((t) => String(t.topic_id) === String(topic_id));
    num_q = topic?.num_q || 0;
  }
  let remQue = total - (remainingQuestion[index] ?? 0);
  if (num_q >= remQue) {
    max = remQue;
  } else {
    max = num_q;
  }
  return max;
};
