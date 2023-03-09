import { createUserDetails, getUserDetails } from "../firebase/functions";
import { autorun, makeAutoObservable, set, toJS } from "mobx";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { firestore, storage } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

class UserModel {
  _user = null;

  genericErrorMessage = "Something went wrong. Please try again";

  constructor() {
    makeAutoObservable(this);

    // Persist store to local storage
    saveStore(this);

    // // Register auth state change listener
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        this.clearUser();
      }
    });
  }

  setUser(data) {
    this._user = data;
  }

  clearUser() {
    this._user = null;
  }

  get user() {
    return toJS(this._user);
  }

  get isLoggedIn() {
    return Boolean(this.user);
  }

  get isStaffAdmin() {
    return this.user?.roles?.includes("STAFF_ADMIN");
  }

  async getFirebaseUserDetails() {
    try {
      const getter = await getUserDetails(this.user.uid);
      if (!getter) throw new Error("Could not get user details. Please try again");

      this.setUser(getter);
      return this.setResponse(false, "", this.user);
    } catch (error) {
      console.error(error);
      return this.setResponse(true, error.message || this.genericErrorMessage, null);
    }
  }

  async createFirebaseUserDetails(userID, userData) {
    try {
      const user = await getUserDetails(userID || this.user?.uid);
      if (user) {
        return this.setUser(user);
      }

      const data = {
        uid: userID,
        firstName: userData?.firstName || "",
        lastName: userData?.lastName || "",
        fullName: userData?.fullName || userData?.email,
        schoolName: userData?.schoolName || "",
        email: userData?.email || "",
        emailVerified: userData?.emailVerified || false,
        phone: userData?.phone || "",
        schoolLogo: userData?.schoolLogo || "",
      };

      const saved = await createUserDetails(userID, data);
      if (!saved) throw new Error("Could not create user details");

      this.setUser(saved);

      return this.setResponse(false, "", this.user);
    } catch (error) {
      console.error(error);
      return this.setResponse(true, error.message || this.genericErrorMessage, null);
    }
  }

  async refreshUserDetails() {
    try {
      const updatedUserDetails = await getUserDetails(this.user?.uid);

      if (updatedUserDetails) {
        this.setUser({ ...this.user, ...updatedUserDetails });
      }
    } catch (error) {
      throw error;
    }
  }

  async updateUserFirebaseDetails(newData) {
    try {
      const usersRef = doc(firestore, "users", this.user?.uid);
      await updateDoc(usersRef, newData);
      await this.refreshUserDetails();
    } catch (error) {
      throw error;
    }
  }

  setResponse(isError, message, data) {
    return {
      error: isError,
      message,
      data,
    };
  }
}

const saveStore = (_this) => {
  const storedJson = localStorage.getItem("new_user");
  if (storedJson) {
    set(_this, JSON.parse(storedJson));
  }

  autorun(() => {
    const value = toJS(_this);
    localStorage.setItem("new_user", JSON.stringify(value));
  });
};

export default new UserModel();
