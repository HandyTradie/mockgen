import { useEffect } from "react";
import { CircularProgress } from "@material-ui/core";
import TopicCard from "./TopicCard";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

const RenderQuestionTopics = ({ blockIndex, topics, formState, setFormState, loadingTopics, remainingQuestion, setRemainingQuestion }) => {
  const assignedCount = formState.sectionBlock[blockIndex].topicPercentages.reduce((acc, curr) => acc + curr.value, 0);
  const questionsLeftToBeAssigned = formState.sectionBlock[blockIndex].questionTotal - (remainingQuestion[blockIndex] ?? 0);

  const checkedCount = formState.sectionBlock[blockIndex].topicPercentages.reduce(
    (acc, curr) => acc + (curr?.questionOverrides?.length || 0),
    0
  );

  useEffect(() => {
    if (assignedCount > questionsLeftToBeAssigned && formState.sectionBlock[blockIndex].topicType !== "manual") {
      // Updates default selected topic number when selected count changes
      const newSectionBlock = [...formState.sectionBlock];

      for (let i = 0; i < newSectionBlock[blockIndex].topicPercentages.length; i++) {
        if (newSectionBlock[blockIndex].topicPercentages[i].value > 0) {
          if (
            newSectionBlock[blockIndex].topicPercentages[i]?.questionOverrides &&
            newSectionBlock[blockIndex].topicPercentages[i]?.questionOverrides.length ===
              newSectionBlock[blockIndex].topicPercentages[i].value
          ) {
            continue;
          }

          newSectionBlock[blockIndex].topicPercentages[i].value = newSectionBlock[blockIndex].topicPercentages[i].value - 1;
          break;
        }
      }

      setFormState({
        ...formState,
        sectionBlock: newSectionBlock,
      });
    } else if (assignedCount < questionsLeftToBeAssigned && formState.sectionBlock[blockIndex].topicType !== "manual") {
      const newSectionBlock = [...formState.sectionBlock];

      for (let i = 0; i < newSectionBlock[blockIndex].topicPercentages.length; i++) {
        if (
          newSectionBlock[blockIndex].topicPercentages[i].value > 0 &&
          !newSectionBlock[blockIndex].topicPercentages[i]?.questionOverrides
        ) {
          newSectionBlock[blockIndex].topicPercentages[i].value = newSectionBlock[blockIndex].topicPercentages[i].value + 1;
          break;
        }
      }

      setFormState({
        ...formState,
        sectionBlock: newSectionBlock,
      });
    }
  }, [formState.sectionBlock[blockIndex].questionTotal, assignedCount, questionsLeftToBeAssigned]);

  if (!formState.sectionBlock[blockIndex] || formState.sectionBlock[blockIndex].questionType === "essay") return null;

  const handleOnDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const newSectionBlock = [...formState.sectionBlock];
    const [reorderedTopic] = newSectionBlock[blockIndex].topicPercentages.splice(result.source.index, 1);
    newSectionBlock[blockIndex].topicPercentages.splice(result.destination.index, 0, reorderedTopic);

    setFormState({
      ...formState,
      sectionBlock: newSectionBlock,
    });
  };

  return (
    <div className="flex flex-col border-2">
      <div className="p-4 bg-gray-200">
        <p>Topic Selection</p>
        <span>
          Remaining questions to be assigned:{" "}
          {questionsLeftToBeAssigned - assignedCount > 0 ? questionsLeftToBeAssigned - assignedCount : 0}
        </span>

        <p className="my-2 mt-6">Drag and drop the topic cards below to change their position on the exam sheet.</p>
      </div>
      {loadingTopics ? (
        <div className="py-2">
          <CircularProgress size={"2rem"} />
        </div>
      ) : (
        <>
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId={"mcqs"}>
              {(provided) => (
                <ul {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col justify-center">
                  {formState.sectionBlock[blockIndex].topicPercentages.map((topic, index) => (
                    <Draggable key={topic.topicId} draggableId={topic.topicId} index={index}>
                      {(provided) => (
                        <TopicCard
                          ref={provided.innerRef}
                          topic={topic}
                          topics={topics}
                          blockIndex={blockIndex}
                          index={index}
                          formState={formState}
                          setFormState={setFormState}
                          remainingQuestion={remainingQuestion}
                          setRemainingQuestion={setRemainingQuestion}
                          assignedCount={assignedCount}
                          questionsLeftToBeAssigned={
                            questionsLeftToBeAssigned - assignedCount > 0 ? questionsLeftToBeAssigned - assignedCount : 0
                          }
                          questionTotal={formState.sectionBlock[blockIndex].questionTotal}
                          checkedCount={checkedCount}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
          <div className="flex flex-row justify-center w-full mb-1 text-2xl">
            <div className="w-2/3 mt-6 font-bold">Total Number of Questions: {formState.sectionBlock[blockIndex].questionTotal}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default RenderQuestionTopics;
