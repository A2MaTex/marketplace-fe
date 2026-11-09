import { useState, useEffect, useCallback } from "react";
import { publisherProjectApi } from "../api/project/api";
import { publisherProductApi } from "../api/product/api";

/**
 * Fetches all projects and products for the current publisher.
 * Builds a productMap: Map<projectId, product>
 */
export function usePublisherData() {
  const [projects, setProjects] = useState([]);
  const [productMap, setProductMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch in parallel
      const [projectsRes, productsRes] = await Promise.all([
        publisherProjectApi.getAllProjects(),
        publisherProductApi.getAllProducts(),
      ]);

      const projectList = projectsRes.data?.data?.items ?? [];
      const productList = productsRes.data?.data?.items ?? [];
      
      // Build map: projectId -> product
      const map = new Map();
      for (const product of productList) {
        if (product.project?.id) {
          map.set(product.project.id, product);
        }
      }

      setProjects(projectList);
      setProductMap(map);
    } catch (err) {
      console.error("[usePublisherData] fetch error:", err);
      setError(err?.response?.data?.message ?? "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * After creating/updating a product, refresh the product map entry.
   * @param {string} projectId
   * @param {object} product - the returned product object
   */
  const updateProductInMap = useCallback((projectId, product) => {
    setProductMap((prev) => {
      const next = new Map(prev);
      next.set(projectId, product);
      return next;
    });
  }, []);

  return { projects, productMap, loading, error, refetch: fetchData, updateProductInMap };
}
