import { CircularProgress } from "@material-ui/core";
import { useFetchCourseQuestions } from "../../api/courses";
import QuestionTableRow from "./QuestionTableRow";

const RenderCourseQuestions = ({ blockIndex, formState, setFormState, essayQuestionOverrides, setEssayQuestionOverrides }) => {
  const { data, isLoading, refetch, isRefetching } = useFetchCourseQuestions(formState.course, 10);

  // REturn null if there's no data
  if (!isLoading && !data) return null;

  const questionsLeftToBeAssigned =
    formState.sectionBlock[blockIndex].questionTotal - formState.sectionBlock[blockIndex].questionOverrides.length;

  // Total marks less marks already assigned
  const marksLeftoBeAssigned =
    formState.sectionBlock[blockIndex].totalMarks -
    formState.sectionBlock[blockIndex].questionOverrides.reduce((acc, curr) => acc + Number(curr.marks), 0);

  return (
    <div className="flex flex-col">
      <div className="p-4 bg-gray-200">
        <p>Topic Selection</p>
        <span>Remaining questions to be assigned: {questionsLeftToBeAssigned}</span>
        <p>Questions selected: {formState.sectionBlock[blockIndex].questionOverrides.length}</p>
      </div>
      <div className="w-full">
        <table className="w-full">
          <tbody className="w-full">
            <tr>
              <th className="">Select?</th>
              <th className="">Marks</th>
              <th className="text-left w-[84%]">Question Text</th>
            </tr>
            {formState.sectionBlock[blockIndex].questionOverrides?.map((question, index) => (
              <QuestionTableRow
                key={question.id}
                question={question}
                formState={formState}
                setFormState={setFormState}
                disabled={questionsLeftToBeAssigned < 1}
                blockIndex={blockIndex}
                maxMarks={marksLeftoBeAssigned}
              />
            ))}
            {isLoading || isRefetching ? (
              <tr className="my-2">
                <td colSpan={3}>
                  <CircularProgress size={"2rem"} />
                </td>
              </tr>
            ) : (
              <>
                {data &&
                  data?.map((question, index) => {
                    if (!question) return null;
                    // // Check if already selected
                    if (formState.sectionBlock[blockIndex].questionOverrides.some((e) => e?.id === question.id)) return null;

                    return (
                      <QuestionTableRow
                        key={question.id}
                        question={question}
                        formState={formState}
                        setFormState={setFormState}
                        disabled={questionsLeftToBeAssigned < 1}
                        blockIndex={blockIndex}
                        maxMarks={marksLeftoBeAssigned}
                      />
                    );
                  })}
              </>
            )}
          </tbody>
        </table>
        <div className="flex flex-row justify-center w-full">
          <button
            onClick={() => {
              refetch();
            }}
            className="px-12 py-2 my-8 font-medium duration-300 border-2 rounded-lg text-slate-blue border-slate-blue text-desktop-paragraph filter hover:text-white hover:bg-slate-blue"
          >
            Shuffle
          </button>
        </div>
        <div className="flex flex-row justify-center w-full mb-1 text-2xl">
          <div className="w-1/3 font-bold">Total Number of Questions: {formState.sectionBlock[blockIndex].questionTotal}</div>
        </div>
      </div>
    </div>
  );
};

export default RenderCourseQuestions;
