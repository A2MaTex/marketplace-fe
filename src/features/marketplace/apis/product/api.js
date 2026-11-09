import axiosInstance from "@/lib/axios";
import { getProductListUrl } from "./url";

const getAllProduct = (page, limit) => axiosInstance.get(getProductListUrl, {
    params: {page, limit}
})

export const productApi = {
    getAllProduct
}