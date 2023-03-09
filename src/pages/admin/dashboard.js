import React from "react";
import { useNavigate } from "react-router-dom";
import CreatedTemplates from "../../components/AdminDashboard/CreatedTemplates";
import UserModel from "../../models/User";

const AdminDashboard = () => {
  const navigate = useNavigate();

  if (!UserModel.isLoggedIn || !UserModel.isStaffAdmin) return null;

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="flex justify-center gap-2 mt-10">
        <button
          onClick={() => {
            navigate("/generator");
          }}
          className="px-4 py-2 my-2 font-medium text-white transition-all duration-300 border-2 border-white rounded-lg bg-slate-blue md:mt-0 hover:text-slate-blue hover:bg-white hover:border-slate-blue text-desktop-paragraph"
        >
          Create Mock Exam
        </button>
        <button
          onClick={() => {
            navigate("/admin/create-template");
          }}
          className="px-4 py-2 my-2 font-medium text-white transition-all duration-300 border-2 border-white rounded-lg bg-slate-blue md:mt-0 hover:text-slate-blue hover:bg-white hover:border-slate-blue text-desktop-paragraph"
        >
          Create Mock Template
        </button>
      </div>
      <div className="mt-10">
        <CreatedTemplates />
      </div>
    </div>
  );
};

export default AdminDashboard;
