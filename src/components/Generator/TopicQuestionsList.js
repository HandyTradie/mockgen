import { CircularProgress } from "@material-ui/core";
import { useFetchTopicQuestions } from "../../api/topics";
import CheckBox from "../FormElements/CheckBox";

const TopicQuestionsList = ({
  index,
  topicId,
  disabled,
  limit,
  blockIndex,
  formState,
  setFormState,
  questionsLeftToBeAssigned,
  checkedCount,
}) => {
  const { isLoading, data } = useFetchTopicQuestions(topicId, 40, formState.course);

  return (
    <div className="w-full p-2">
      {isLoading && <CircularProgress size={"2rem"} />}
      <div>
        {data &&
          data.map((question) => (
            <div key={question.id}>
              {question?.clean && (
                <div className="w-full">
                  <CheckBox
                    name={String(question.id)}
                    checked={formState.sectionBlock[blockIndex].topicPercentages[index].questionOverrides?.includes(question.id)}
                    disabled={disabled || questionsLeftToBeAssigned === checkedCount}
                    label={question.clean}
                    latexLabel
                    onChange={(e) => {
                      const newSectionBlock = [...formState.sectionBlock];
                      if (!newSectionBlock[blockIndex].topicPercentages[index].questionOverrides) {
                        newSectionBlock[blockIndex].topicPercentages[index].questionOverrides = [];
                      }

                      const pos = newSectionBlock[blockIndex].topicPercentages[index].questionOverrides.indexOf(question.id);

                      if (pos > -1) {
                        // Exists in array
                        newSectionBlock[blockIndex].topicPercentages[index].questionOverrides.splice(index, 1);
                        newSectionBlock[blockIndex].topicPercentages[index].value =
                          newSectionBlock[blockIndex].topicPercentages[index].value - 1;
                      } else {
                        newSectionBlock[blockIndex].topicPercentages[index].questionOverrides.push(question.id);
                        newSectionBlock[blockIndex].topicPercentages[index].value =
                          newSectionBlock[blockIndex].topicPercentages[index].value + 1;
                      }

                      setFormState({
                        ...formState,
                        ...{
                          sectionBlock: newSectionBlock,
                        },
                      });
                    }}
                  />
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default TopicQuestionsList;
