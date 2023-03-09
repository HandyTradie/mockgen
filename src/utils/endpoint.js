const apisEndpoint =
  process.env.NODE_ENV === "production"
    ? "https://us-central1-quizmine-dev.cloudfunctions.net/api"
    : "http://127.0.0.1:5001/quizmine-dev/us-central1/api";

export { apisEndpoint };
