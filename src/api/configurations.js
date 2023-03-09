import { query, collection, where, orderBy, getDocs } from "firebase/firestore";
import { firestore } from "../firebase";
import moment from "moment";
import { useQuery } from "react-query";

export const getExamsConfig = async (userID) => {
  let examsConfigs = [];
  const q = query(collection(firestore, "examConfiguration"), orderBy("createdAt", "desc"), where("userId", "==", userID));

  const docs = await getDocs(q);
  docs.forEach((snap) => {
    const data = snap.data();
    const isErrored = !data.finalpdfUrl && data.status === "paid";
    examsConfigs.push({
      ...data,
      id: snap.id,
      isErrored,
      updatedAt: moment(data.updatedAt).fromNow(),
      status: isErrored ? "error" : data.status,
    });
  });
  let columns = [
    { field: "courseName", headerName: "Course Name", minWidth: 150, flex: 1 },
    { field: "examTitle", headerName: "Exams Title", minWidth: 150, flex: 1 },
    { field: "status", headerName: "Status", minWidth: 100, flex: 1 },
    { field: "updatedAt", headerName: "Last Update", minWidth: 100, flex: 1 },
  ];
  return { columns: columns, rows: examsConfigs };
};

export const useFetchExamConfigs = (userID) => {
  return useQuery(["examsConfigs", userID], async () => await getExamsConfig(userID));
};

export const useFetchTemplates = () => {
  return useQuery("templatesByCategory", async () => {
    try {
      // Get all documents from the templates collection
      const q = query(collection(firestore, "templates"));
      const querySnapshot = await getDocs(q);

      // Convert the query snapshot to an array of objects
      const templates = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Group templates by template category
      const templatesByCategory = {};

      templates.forEach((template) => {
        if (!templatesByCategory[template.templateCategory]) {
          templatesByCategory[template.templateCategory] = [];
        }
        templatesByCategory[template.templateCategory].push(template);
      });

      return templatesByCategory;
    } catch (error) {
      console.error(error);
      throw error;
    }
  });
};
