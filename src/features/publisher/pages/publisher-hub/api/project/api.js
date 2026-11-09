import axiosInstance from "@/lib/axios";
import { getProjectsUrl, getProjectDraftUrl } from "./url";

const getAllProjects = () => axiosInstance.get(getProjectsUrl);

const getProjectDraft = (projectId) =>
  axiosInstance.get(getProjectDraftUrl(projectId));

export const publisherProjectApi = {
  getAllProjects,
  getProjectDraft,
};
