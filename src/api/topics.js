import { apisEndpoint } from "../utils/endpoint";
import axios from "axios";
import { useQuery } from "react-query";

const getTopicQuestions = async (topicID, limit, courseID) => {
  let res = await axios.get(apisEndpoint + `/fetchTopicQuestions/${topicID}`, {
    params: {
      limit,
      courseID,
    },
  });

  return res.data.results;
};

export const useFetchTopicQuestions = (topicID, limit, courseID) => {
  const { data, isLoading, error } = useQuery(["topicQuestion", topicID, limit, courseID], () =>
    getTopicQuestions(topicID, limit, courseID)
  );

  return { data, isLoading, error };
};

const getTopics = async (course) => {
  let result = await axios.get(apisEndpoint + `/fetchTopics/${course}`);
  return result.data.result;
};

export const useFetchTopics = (course, level) => {
  return useQuery(["formTopics", course, level], async () => {
    if (course) {
      return await getTopics(course);
    }
  });
};
