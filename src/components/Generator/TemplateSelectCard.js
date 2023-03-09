import React from "react";
import { BanIcon } from "@heroicons/react/outline";
import SelectInput from "../FormElements/SelectInput";

const TemplateSelectCard = ({ index, formState, setFormState, templateOptions, isSimpleMode }) => {
  return (
    <div className="mt-6">
      {isSimpleMode && <b>Exam {index + 1}</b>}

      <SelectInput
        name="Subject"
        ariaLabel="Subject"
        label="Subject"
        value={formState?.templates?.[index]?.templateID}
        onChange={(val) => {
          const newTemplates = [...formState.templates];
          newTemplates[index] = {
            ...newTemplates[index],
            templateID: val,
          };
          setFormState({
            ...formState,
            templates: newTemplates,
          });
        }}
        options={templateOptions}
      />
      {isSimpleMode && formState?.templates?.length > 1 && (
        <div className="flex justify-end pr-2">
          <button
            className="flex items-center gap-1 text-red-400"
            onClick={() => {
              // Remove template at index
              setFormState({
                ...formState,
                templates: formState.templates.filter((_, i) => i !== index),
              });
            }}
          >
            <span>
              <BanIcon width={16} height={16} />
            </span>
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default TemplateSelectCard;
