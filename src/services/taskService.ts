import axios from "axios";

export const getPracticeTasks = async () => {
  const response = await axios.get("/api/tasks?type=practice");
  return response.data;
};

export const getExamTasks = async () => {
  const response = await axios.get("/api/tasks?type=exam");
  return response.data;
};
