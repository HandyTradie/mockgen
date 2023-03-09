import { useState } from "react";

// Takes an async function and returns a react hook with utilities like loading states and error states.
const hookWrapper = (asyncFn, successCallback) => {
  return () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const doAsync = async (...args) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await asyncFn(...args);

        if (successCallback) {
          successCallback(data);
        }
      } catch (error) {
        setError(error);
      }

      setIsLoading(false);
    };

    return [doAsync, error, isLoading];
  };
};

export default hookWrapper;
