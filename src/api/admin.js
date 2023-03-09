import { useMutation, useQuery, useQueryClient } from "react-query";
import { firestore } from "../firebase";
import { collection, query, getDocs, deleteDoc, doc } from "firebase/firestore";
import toast from "react-hot-toast";

export const useFetchAllTemplates = () => {
  return useQuery(["templates"], async () => {
    try {
      // Get all documents from the templates collection
      const q = query(collection(firestore, "templates"));
      const querySnapshot = await getDocs(q);

      // Convert the query snapshot to an array of objects
      const templates = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return templates;
    } catch (error) {
      console.error(error);
      throw error;
    }
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ id }) => {
      try {
        // Delete the template from the templates collection
        await deleteDoc(doc(firestore, "templates", id));
      } catch (error) {
        console.error(error);
        throw error;
      }
    },

    {
      onSuccess: (_, variables) => {
        toast.success("Template deleted");
        queryClient.setQueryData(["templates"], (prevData) => prevData.filter((e) => e.id !== variables.id));
        queryClient.invalidateQueries(["templates", "templatesByCategory"]);
      },
    }
  );
};
