import { intersectionBy } from "lodash";
import Configuration from "../models/Configuration";
import User from "../models/User";

export const genRandomString = (length = 10) => {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charLen = parseInt(length);

  for (var i = 0; i < charLen; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text.toUpperCase();
};

export const localDatastore = {
  setItem: async (key, data) => {
    try {
      await localStorage.setItem(`mg-${key}`, JSON.stringify(data));
      return true;
    } catch (error) {
      return false;
    }
  },
  getItem: async (key) => {
    try {
      const dataString = await localStorage.getItem(`mg-${key}`);
      return JSON.parse(dataString);
    } catch (error) {
      return false;
    }
  },
  removeItem: async (key) => {
    try {
      await localStorage.removeItem(`mg-${key}`);
    } catch (error) {
      return false;
    }
  },
  clear: async () => {
    try {
      await localStorage.clear();
    } catch (error) {
      return false;
    }
  },
};

export const handleRefreshUser = async (userId, updateConfiguration = false) => {
  try {
    let credential = userId;

    if (!credential) {
      const localUser = await localDatastore.getItem("userDetails");
      if (localUser) credential = localUser.uid;
    }
    if (!credential) throw new Error("User data does not exist");

    const user = User;
    const userDetails = await user.getFirebaseUserDetails();
    if (userDetails.error) throw new Error(userDetails.message);

    await setLocalDatastoreUser(userDetails.data);

    if (!updateConfiguration) return true;

    // Update Configuration
    await saveLocalExamConfiguration(userDetails.data.uid, true);
  } catch (error) {
    return false;
  }
};

export const saveLocalExamConfiguration = async (userId = null, useLocal = false, data = null) => {
  try {
    let configData = data;

    if (useLocal) {
      configData = await localDatastore.getItem("configData");
    }
    if (!configData) throw new Error("There is no configuration data to save");

    const newConfig = [...configData];

    const modified = [];
    const skipped = [];

    for (let item of configData) {
      // Do not save if already saved
      if (item.isProduction) {
        skipped.push(item);
        continue;
      }

      const config = new Configuration(item.configId, userId);
      const newData = { ...item, userId };

      config.setConfiguration(newData);

      const saver = await config.createFirebaseConfiguration();
      if (saver.error) throw new Error(saver.message);
      modified.push(saver.data);
    }

    localStorage.setItem("mg-configData", JSON.stringify([...skipped, ...modified])); //save new data to localstorage
    // localStorage.setItem("mg-configData", JSON.stringify(intersectionBy(newConfig,modified, 'configId'))); //save new data to localstorage

    return true;
  } catch (error) {
    return false;
  }
};

export const setLocalDatastoreUser = async (userDetails) => {
  try {
    await localDatastore.setItem("userDetails", userDetails);

    return true;
  } catch (error) {
    return false;
  }
};

export const getLocalDatastoreUser = async () => {
  try {
    const data = await localDatastore.getItem("userDetails");

    return data;
  } catch (error) {
    return null;
  }
};
