import axiosInstance from "@/lib/axios";
import { createProductUrl, getProductsUrl, updateProductUrl } from "./url";

const getAllProducts = () => axiosInstance.get(getProductsUrl);

const createProduct = (body) => axiosInstance.post(createProductUrl, body);

const updateProduct = (id, body) =>
  axiosInstance.patch(updateProductUrl(id), body);

export const publisherProductApi = {
  getAllProducts, createProduct, updateProduct
};
