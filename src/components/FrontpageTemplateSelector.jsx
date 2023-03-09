import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ArrowsExpandIcon } from "@heroicons/react/outline";

import FrontPageTemplates from "../utils/templates.json";

const FrontpageTemplateSelector = ({ isOpen, setIsOpen, selectedTemplate, setSelectedTemplate }) => {
  function closeModal() {
    setIsOpen(false);
  }

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-5xl p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Front Page Templates
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Select a template to be used as the frontpage of your examination document.
                      <br />
                      The school names, logos and other details used in each template are placeholders
                    </p>
                  </div>

                  <div className="flex flex-wrap flex-1 gap-8 mt-4">
                    {FrontPageTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        selectedTemplate={selectedTemplate}
                        setSelectedTemplate={setSelectedTemplate}
                      />
                    ))}
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={closeModal}
                    >
                      Done
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

const TemplateCard = ({ template, selectedTemplate, setSelectedTemplate }) => {
  const isSelected = template?.id === selectedTemplate?.id;

  return (
    <div className="relative overflow-hidden rounded-md">
      <img className="w-[300px] aspect-[0.707] rounded-md overflow-hidden" src={template?.path} alt={"Preview of front page"} />

      <button
        onClick={() => window.open(template?.path)}
        className="absolute w-8 h-8 p-1 rounded-md bg-[#4353ff80] hover:opacity-100 opacity-50 text-white top-2 right-2  transition-all duration-300 ease-in-out"
      >
        <ArrowsExpandIcon />
      </button>

      <button
        disabled={isSelected}
        className={`absolute bottom-0 left-0 w-full py-2 text-white ${
          isSelected ? "bg-slate-blue" : "bg-[#4353ff80]"
        } hover:bg-slate-blue  transition-all duration-300 ease-in-out`}
        onClick={() => setSelectedTemplate(template)}
      >
        {isSelected ? "Selected" : "Select"}
      </button>
    </div>
  );
};

export default FrontpageTemplateSelector;
