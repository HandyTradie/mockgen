import { genRandomString } from "../utils";
import { createPaymentTransactionData, getPaymentTransactionData } from "../firebase/functions";
import DataResponse from "./dataResponse";

class PaymentTransaction extends DataResponse {
  constructor(
    transactionId,
    userId,
    configId,
    amountDefined,
    amountPaid,
    remainingBalance,
    transactionRef,
    transactionData,
    transactionProviderData,
    status,
    paymentDetails,
    createdAt
  ) {
    super();
    if (!userId) throw new Error("User ID must be set");
    if (!configId) throw new Error("Configuration ID must be set");
    this.transactionId = genRandomString(20);
    // this.transactionId = transactionId || genRandomString(20);
    this.userId = userId;
    this.configId = configId;
    this.amountDefined = amountDefined || 0;
    this.amountPaid = amountPaid || 0;
    this.remainingBalance = remainingBalance || 0;
    this.transactionRef = transactionRef || "";
    this.transactionData = transactionData || "";
    this.transactionProviderData = transactionProviderData || "";
    this.status = status || "PENDING";
    this.paymentDetails = paymentDetails || null;
    this.createdAt = createdAt || null;
  }

  getPaymentTransaction() {
    return {
      transactionId: this.transactionId,
      userId: this.userId,
      configId: this.configId,
      amountDefined: this.amountDefined,
      amountPaid: this.amountPaid,
      remainingBalance: this.remainingBalance,
      transactionRef: this.transactionRef,
      transactionData: this.transactionData,
      transactionProviderData: this.transactionProviderData,
      status: this.status,
      paymentDetails: this.paymentDetails,
      createdAt: this.createdAt,
    };
  }

  setPaymentTransaction(data) {
    // this.transactionId = genRandomString(20);
    this.transactionId = data.transactionId || genRandomString(20);
    this.userId = data.userId || this.userId;
    this.configId = data.configId || this.configId;
    this.amountDefined = data.amountDefined || this.amountDefined || 0;
    this.amountPaid = data.amountPaid || this.amountPaid || 0;
    this.remainingBalance = data.remainingBalance || this.remainingBalance || 0;
    this.transactionRef = data.transactionRef || this.transactionRef || "";
    this.transactionData = data.transactionData || this.transactionData || "";
    this.transactionProviderData = data.transactionProviderData || this.transactionProviderData || "";
    this.status = data.status || this.status || "PENDING";
    this.paymentDetails = data.paymentDetails || this.paymentDetails || null;
    this.createdAt = data.createdAt || this.createdAt || null;
  }

  async getFirebasePaymentTransactions() {
    try {
      const getter = await getPaymentTransactionData(this.transactionId);
      if (!getter) throw new Error("Could not get transaction details. Please try again");

      this.setPaymentTransaction(getter);
      return this.setResponse(false, "", this.getPaymentTransaction());
    } catch (error) {
      console.error(error);
      return this.setResponse(true, error.message || this.genericErrorMessage, null);
    }
  }

  async createOrUpdateFirebaseTransaction() {
    try {
      const saver = await createPaymentTransactionData(this.configId, this.getPaymentTransaction());
      if (!saver) throw new Error("Could not create transaction details");

      return this.setResponse(false, "", this.getFirebasePaymentTransactions());
    } catch (error) {
      console.error(error);
      return this.setResponse(true, error.message || this.genericErrorMessage, null);
    }
  }
}

export default PaymentTransaction;
