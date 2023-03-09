import React from "react";
import { TrashIcon } from "@heroicons/react/outline";
import moment from "moment";
import { useDeleteTemplate, useFetchAllTemplates } from "../../api/admin";
import { CircularProgress } from "@material-ui/core";

const CreatedTemplates = () => {
  const { isLoading, data } = useFetchAllTemplates();
  const { mutateAsync } = useDeleteTemplate();

  return (
    <div>
      <h2 className="text-xl font-bold">Created Templates</h2>
      <div className="flex flex-wrap justify-center gap-8 mt-6">
        {isLoading && <CircularProgress />}
        {!isLoading &&
          data?.length > 0 &&
          data.map((template) => (
            <div key={template.id}>
              <div className="relative mb-4 overflow-hidden border border-black rounded-md max-w-[200px]">
                <img
                  className="w-[200px] aspect-[0.707] rounded-md overflow-hidden"
                  src={template?.frontpage?.path}
                  alt={"Preview of front page"}
                />

                <button
                  onClick={() => mutateAsync({ id: template?.id })}
                  className="absolute w-8 h-8 p-1 rounded-md bg-[#4353ff80] hover:opacity-100 opacity-50 text-white top-2 right-2  transition-all duration-300 ease-in-out"
                >
                  <TrashIcon className="w-6 h-6" />
                </button>
              </div>
              <b>{template.templateName}</b>
              <p>{template.templateCategory}</p>
              <p>Created {moment(template.templateCreatedAt).format("DD/MM/YYYY")}</p>
            </div>
          ))}
        {!isLoading && data?.length === 0 && (
          <div className="text-center">
            <p>No templates created yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatedTemplates;
