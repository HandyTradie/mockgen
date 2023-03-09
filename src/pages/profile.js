import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import InputBase from "../components/FormElements/InputBase";
import UserModel from "../models/User";
import toast from "react-hot-toast";
import { observer } from "mobx-react-lite";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import ImageUploader from "react-image-upload";

const Profile = () => {
  const user = UserModel.user;
  const navigate = useNavigate();

  const [editMode, setEditMode] = React.useState(true);
  const [editFirstName, setEditFirstName] = React.useState(user?.firstName);
  const [editLastName, setEditLastName] = React.useState(user?.lastName);
  const [editSchoolName, setEditSchoolName] = React.useState(user?.schoolName);
  const [editPhone, setEditPhone] = React.useState(user?.phone);
  const [editsLoading, setEditsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [schoolLogoURL, setSchoolLogoURL] = React.useState(user?.schoolLogo);
  const [existingLogoSource, setExistingLogoSource] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);

  const handleSaveUser = async () => {
    setEditsLoading(true);
    try {
      await UserModel.updateUserFirebaseDetails({
        ...user,
        firstName: editFirstName,
        lastName: editLastName,
        schoolName: editSchoolName,
        phone: editPhone,
        schoolLogo: schoolLogoURL,
      });

      setEditMode(false);
      toast.success("Profile updated sucessfully");
      navigate("/dashboard");
    } catch (error) {
      setErrorMessage("Something went wrong, try again");
      return [];
    } finally {
      setEditsLoading(false);
    }
  };

  const cancelEdit = (_) => {
    setEditMode(false);
    navigate("/dashboard");
  };

  async function uploadAndGetImageURL(item) {
    setIsUploadingLogo(true);
    const file = item?.file;

    if (file) {
      const fileName = `${user?.uid || Math.random().toString(36).substring(3, 9)}.${`jpg`}`;

      const metadata = {
        contentType: "image/jpeg",
      };

      const storageRef = ref(storage, `logos/${fileName}`);
      await uploadBytes(storageRef, file, metadata);

      const downloadURL = await getDownloadURL(storageRef);

      setSchoolLogoURL(downloadURL);
    }

    setIsUploadingLogo(false);
  }

  async function handleRemoveImage(file) {
    setSchoolLogoURL("");
  }

  useEffect(() => {
    setExistingLogoSource(user.schoolLogo);
  }, []);

  return (
    <div className="pb-8">
      <div className="relative w-full mt-12 md:mt-0">
        <div className="mt-[70px] md:mx-6 xs:mx-2 flex flex-col gap-4">
          <div>
            <p className="mb-1 ml-2 text-lg font-bold text-left text-slate-body">School Logo</p>

            {!editMode ? (
              <div className="relative flex items-center justify-center w-40 h-40 overflow-hidden bg-gray-300 rounded-lg">
                {user?.schoolLogo ? (
                  <img src={user?.schoolLogo} alt="logo" className="object-cover w-full h-full" />
                ) : (
                  <button onClick={() => setEditMode(true)}>
                    <svg className="svg-circleplus" viewBox="0 0 100 100" style={{ height: "40px", stroke: "#000" }}>
                      <circle cx="50" cy="50" r="45" fill="none" strokeWidth="7.5"></circle>
                      <line x1="32.5" y1="50" x2="67.5" y2="50" strokeWidth="5"></line>
                      <line x1="50" y1="32.5" x2="50" y2="67.5" strokeWidth="5"></line>
                    </svg>
                  </button>
                )}
              </div>
            ) : (
              <div className="relative w-fit">
                {existingLogoSource ? (
                  <div className="img-prev">
                    <img
                      src={existingLogoSource}
                      alt="school logo"
                      style={{
                        height: 150,
                        width: 150,
                        borderRadius: 8,
                      }}
                    />
                    <i
                      className="fas fa-minus-circle"
                      onClick={() => {
                        setExistingLogoSource("");
                      }}
                    ></i>
                  </div>
                ) : (
                  <ImageUploader
                    style={{
                      height: 150,
                      width: 150,
                      borderRadius: 15,
                      background: "rgb(243 244 246)",
                    }}
                    uploadIcon={
                      <svg className="svg-circleplus" viewBox="0 0 100 100" style={{ height: "40px", stroke: "#000" }}>
                        <circle cx="50" cy="50" r="45" fill="none" strokeWidth="7.5"></circle>
                        <line x1="32.5" y1="50" x2="67.5" y2="50" strokeWidth="5"></line>
                        <line x1="50" y1="32.5" x2="50" y2="67.5" strokeWidth="5"></line>
                      </svg>
                    }
                    onFileAdded={(img) => uploadAndGetImageURL(img)}
                    onFileRemoved={(img) => handleRemoveImage(img)}
                  />
                )}
                {isUploadingLogo && (
                  <div className="absolute top-0 right-0 flex items-center justify-center w-full h-full bg-black rounded-lg opacity-40">
                    <CircularProgress style={{ color: "white" }} />
                  </div>
                )}
              </div>
            )}
          </div>

          <InputBase
            disabled={!editMode || editsLoading}
            name="editFirstName"
            ariaLabel="First Name"
            label="First Name"
            value={editFirstName}
            onChange={(val) => setEditFirstName(val)}
          />
          <InputBase
            disabled={!editMode || editsLoading}
            name="editLastName"
            ariaLabel="Last Name"
            label="Last Name"
            value={editLastName}
            onChange={(val) => setEditLastName(val)}
          />
          <InputBase
            disabled={!editMode || editsLoading}
            name="editSchoolName"
            ariaLabel="School Name"
            label="School Name"
            value={editSchoolName}
            onChange={(val) => setEditSchoolName(val)}
          />
          <InputBase
            disabled={!editMode || editsLoading}
            name="editPhone"
            ariaLabel="Phone Number"
            label="Phone Number"
            value={editPhone}
            onChange={(val) => setEditPhone(val)}
          />
          {errorMessage.length > 0 && <div className="text-3xl text-red-700">{errorMessage}</div>}
          {editsLoading && (
            <div>
              <CircularProgress size={"2em"} />
            </div>
          )}
          {editMode ? (
            <div>
              {(editMode || !editsLoading) && (
                <div className="flex flex-col justify-center mt-8 md:space-x-4 md:flex-row md:mt-10">
                  <button
                    onClick={() => {
                      if (
                        user.firstName !== editFirstName ||
                        user.lastName !== editLastName ||
                        user.schoolName !== editSchoolName ||
                        user.phone !== editPhone ||
                        !isUploadingLogo
                      ) {
                        setErrorMessage("");
                        handleSaveUser();
                      } else {
                        setErrorMessage("No changes made to profile");
                      }
                    }}
                    className="px-8 py-4 font-medium duration-300 border-2 rounded-lg text-slate-blue border-slate-blue text-desktop-paragraph filter hover:text-white hover:bg-slate-blue"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-8 py-4 mt-2 font-medium text-white transition-all duration-300 border-2 border-white rounded-lg bg-slate-blue md:mt-0 hover:text-slate-blue hover:bg-white hover:border-slate-blue text-desktop-paragraph"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col justify-center mt-8 md:space-x-4 md:flex-row md:mt-10">
              <button
                onClick={() => setEditMode(true)}
                className="px-8 py-4 font-medium duration-300 border-2 rounded-lg text-slate-blue border-slate-blue text-desktop-paragraph filter hover:text-white hover:bg-slate-blue"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default observer(Profile);
