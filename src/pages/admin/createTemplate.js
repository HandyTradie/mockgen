import React from "react";
import CreateTemplateForm from "../../components/AdminDashboard/CreateTemplateForm";
import UserModel from "../../models/User";

const CreateTemplate = () => {
  if (!UserModel.isLoggedIn || !UserModel.isStaffAdmin) return null;

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold">Create Template</h1>
      <div>
        <CreateTemplateForm />
      </div>
    </div>
  );
};

export default CreateTemplate;
