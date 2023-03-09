import { genRandomString } from "../utils";
import { createConfigData, getConfigData } from "../firebase/functions";
import DataResponse from "./dataResponse";

class Configuration extends DataResponse {
  constructor(
    configId,
    userId,
    schoolName,
    examTitle,
    curriculum,
    level,
    course,
    sectionTotal,
    sectionValidity,
    examInstructions,
    sectionBlock,
    createdAt,
    updatedAt,
    status,
    isProduction, // Indicates whether this has been saved to firestore
    generatorPDFURL,
    generatorPDFBase64,
    schoolLogo
  ) {
    super();
    if (!userId) throw new Error("User ID must be set");
    this.configId = configId || genRandomString(20);
    this.userId = userId;
    this.schoolName = schoolName || "";
    this.examTitle = examTitle || "";
    this.curriculum = curriculum || "";
    this.level = level || "";
    this.course = course || "";
    this.sectionTotal = sectionTotal || 1;
    this.sectionValidity = sectionValidity || ["1"];
    this.examInstructions = examInstructions || "";
    this.sectionBlock = sectionBlock || [];
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
    this.status = status || "draft";
    this.isProduction = isProduction || false;
    this.generatorPDFURL = generatorPDFURL || "";
    this.generatorPDFBase64 = generatorPDFBase64 || "";
    this.schoolLogo = schoolLogo || "";
  }

  getConfiguration() {
    return {
      userId: this.userId,
      configId: this.configId,
      schoolName: this.schoolName,
      examTitle: this.examTitle,
      curriculum: this.curriculum,
      level: this.level,
      course: this.course,
      sectionTotal: this.sectionTotal,
      sectionValidity: this.sectionValidity,
      examInstructions: this.examInstructions,
      sectionBlock: this.sectionBlock,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      status: this.status,
      isProduction: this.isProduction,
      generatorPDFURL: this.generatorPDFURL,
      generatorPDFBase64: this.generatorPDFBase64,
      schoolLogo: this.schoolLogo,
    };
  }

  setConfiguration(data) {
    this.configId = data.configId || this.configId || genRandomString(20);
    this.userId = data.userId || this.userId;
    this.schoolName = data.schoolName || this.schoolName || "";
    this.examTitle = data.examTitle || this.examTitle || "";
    this.curriculum = data.curriculum || this.curriculum || "";
    this.level = data.level || this.level || "";
    this.course = data.course || this.course || "";
    this.sectionTotal = data.sectionTotal || this.sectionTotal || 1;
    this.sectionValidity = data.sectionValidity || this.sectionValidity || ["1"];
    this.examInstructions = data.examInstructions || this.examInstructions || "";
    this.sectionBlock = data.sectionBlock || this.sectionBlock || [];
    this.createdAt = data.createdAt || this.createdAt;
    this.updatedAt = data.updatedAt || this.updatedAt;
    this.status = data.status || this.status || "draft";
    this.isProduction = data.isProduction || this.isProduction || false;
    this.generatorPDFURL = data.generatorPDFURL || "";
    this.generatorPDFBase64 = data.generatorPDFBase64 || "";
    this.schoolLogo = data.schoolLogo || "";
  }

  async getFirebaseConfiguration() {
    try {
      const getter = await getConfigData(this.configId);
      if (!getter) throw new Error("Could not get config data. Please try again");

      this.setConfiguration(getter);
      return this.setResponse(false, "", this.getConfiguration());
    } catch (error) {
      console.error(error);
      return this.setResponse(true, error.message || this.genericErrorMessage, null);
    }
  }

  async createFirebaseConfiguration() {
    try {
      const toSave = {
        ...this.getConfiguration(),
        isProduction: true,
      };
      const saver = await createConfigData(this.configId, toSave);
      if (!saver) throw new Error("Could not save config data");

      return this.setResponse(false, "", toSave);
    } catch (error) {
      console.error(error);
      return this.setResponse(true, error.message || this.genericErrorMessage, null);
    }
  }
}

export default Configuration;
