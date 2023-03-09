import { apisEndpoint } from "../utils/endpoint";
import axios from "axios";
import { useQuery } from "react-query";

const getCourses = async () => {
  let result = await axios.get(apisEndpoint + "/courses");
  return result.data.result;
};

const getCourseQuestions = async (topicID, limit, qtype) => {
  let res = await axios.get(apisEndpoint + `/fetchCourseQuestions/${topicID}`, {
    params: {
      limit,
    },
  });

  return res.data.results;
};

export const useFetchCourses = () => {
  const { data, isLoading, error } = useQuery(["courses"], getCourses);

  return { courses: data, isLoading, error };
};

export const useFetchCourseQuestions = (courseID, limit) => {
  const { data, isLoading, refetch, isRefetching, error } = useQuery(["courseQuestions", courseID, limit], () =>
    getCourseQuestions(courseID, limit)
  );

  return { data, isLoading, error, refetch, isRefetching };
};
