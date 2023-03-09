import { ChevronDownIcon } from "@heroicons/react/outline";
import { MathJax } from "better-react-mathjax";
import { useState } from "react";

const QuestionTableRow = ({ question, disabled, maxMarks, formState, setFormState, blockIndex }) => {
  const [showSub, setShowSub] = useState(false);

  const marksValue = formState.sectionBlock[blockIndex].questionOverrides.filter((e) => e.id === question.id)[0]?.marks;
  const isChecked = formState.sectionBlock[blockIndex].questionOverrides.some((e) => e.id === question.id);
  const marksDisabled = !(formState.sectionBlock[blockIndex].questionOverrides.filter((e) => e.id === question.id).length > 0);

  const subQuestionMarksAssigned =
    formState.sectionBlock[blockIndex].questionOverrides
      .filter((e) => e.id === question.id)[0]
      ?.answerMarks?.reduce((acc, curr) => acc + Number(curr.marks), 0) || 0;

  // Increase total marks if sub-question marks exceed
  if (subQuestionMarksAssigned > marksValue) {
    const newSectionBlock = [...formState.sectionBlock];
    const pos = newSectionBlock[blockIndex].questionOverrides.map((e) => e.id).indexOf(question.id);

    newSectionBlock[blockIndex].questionOverrides[pos].marks = subQuestionMarksAssigned;

    setFormState({
      ...formState,
      sectionBlock: newSectionBlock,
    });
  }

  const subQuestionMarksLeft = marksValue - subQuestionMarksAssigned;

  return (
    <tr>
      <td className="flex flex-col items-center justify-start p-5">
        <input
          type={"checkbox"}
          checked={isChecked}
          disabled={!isChecked && disabled}
          className={`${!isChecked && disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          onChange={() => {
            const isChecked = formState.sectionBlock[blockIndex].questionOverrides.some((e) => e.id === question.id);

            const newSectionBlock = [...formState.sectionBlock];

            const item = {
              ...question,
              id: question.id,
              marks: 0,
            };

            if (isChecked) {
              // Remove from array
              newSectionBlock[blockIndex].questionOverrides = newSectionBlock[blockIndex].questionOverrides.filter(
                (e) => e.id !== question.id
              );
            } else {
              newSectionBlock[blockIndex].questionOverrides.push(item);
            }

            setFormState({
              ...formState,
              ...{
                sectionBlock: newSectionBlock,
              },
            });
          }}
        />
      </td>
      <td className="px-2 pr-4" valign="top">
        <input
          type={"number"}
          onWheel={(e) => e.target.blur()}
          min={0}
          // max={maxMarks}
          disabled={marksDisabled}
          onChange={(e) => {
            const newSectionBlock = [...formState.sectionBlock];
            const pos = newSectionBlock[blockIndex].questionOverrides.map((e) => e.id).indexOf(question.id);

            newSectionBlock[blockIndex].questionOverrides[pos].marks = e.target.value;

            setFormState({
              ...formState,
              sectionBlock: newSectionBlock,
            });
          }}
          value={marksValue || formState.sectionBlock[blockIndex]?.marksPerQuestion || 0}
          className="w-10 h-8 pl-2 mt-2 rounded-lg"
        />
      </td>
      <td className="pt-2 text-left">
        <div className="flex justify-between">
          <MathJax>
            <p className="italic line-clamp-1">{question?.resource} </p>
            <p className="font-bold line-clamp-4">{question.question_text || "Answer the following questions"}</p>
            <p className="line-clamp-4">{question?.answer}</p>
          </MathJax>
          {question?.answers?.length > 0 && (
            <button className="px-2 py-2 font-medium duration-300 hover:text-slate-blue" onClick={() => setShowSub((e) => !e)}>
              <ChevronDownIcon
                width={16}
                height={16}
                className={`transition-all duration-200 ease-in-out mt-[1px] ${showSub && "rotate-180"}`}
              />
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1" style={{ display: showSub ? "block" : "none" }}>
          <MathJax>
            {question?.answers?.map((answer) => (
              <div className="flex justify-between gap-2" key={answer.answer_id}>
                <p className="mt-2">{answer?.text}</p>
                <input
                  type={"number"}
                  onWheel={(e) => e.target.blur()}
                  className="w-10 h-8 pl-2 mt-2 rounded-lg"
                  disabled={marksDisabled}
                  max={
                    Number(
                      formState.sectionBlock[blockIndex].questionOverrides
                        .filter((e) => e.id === question.id)[0]
                        ?.answerMarks?.filter((a) => a?.answerId === answer?.answer_id)[0]?.marks
                    ) + subQuestionMarksLeft
                  }
                  min={0}
                  value={Number(
                    formState.sectionBlock[blockIndex].questionOverrides
                      .filter((e) => e.id === question.id)[0]
                      ?.answerMarks?.filter((a) => a?.answerId === answer?.answer_id)[0]?.marks
                  )}
                  onChange={(e) => {
                    const value = e.target.value;
                    const newSectionBlock = [...formState.sectionBlock];
                    const pos = newSectionBlock[blockIndex].questionOverrides.map((e) => e.id).indexOf(question.id);
                    const newAnswerMarks = newSectionBlock[blockIndex].questionOverrides[pos]?.answerMarks || [];

                    const item = {
                      answerId: answer.answer_id,
                      marks: value,
                    };

                    const index = newAnswerMarks.findIndex((obj) => obj.answerId === item.answerId);

                    if (index > -1) {
                      newAnswerMarks[index].marks = value;
                    } else {
                      newAnswerMarks.push(item);
                    }

                    newSectionBlock[blockIndex].questionOverrides[pos]["answerMarks"] = newAnswerMarks;

                    setFormState({
                      ...formState,
                      ...{
                        sectionBlock: newSectionBlock,
                      },
                    });
                  }}
                />
              </div>
            ))}
          </MathJax>
        </div>
      </td>
    </tr>
  );
};

export default QuestionTableRow;
