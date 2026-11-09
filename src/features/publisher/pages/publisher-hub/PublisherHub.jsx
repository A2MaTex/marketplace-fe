import { useState, useCallback } from "react";
import { usePublisherData } from "./hooks/usePublisherData";
import ProjectSidebar from "./components/ProjectSidebar";
import ProductForm from "./components/ProductForm";
import styles from "./PublisherHub.module.css";

export const PublisherHub = () => {
  const {
    projects,
    productMap,
    loading,
    error,
    updateProductInMap,
  } = usePublisherData();

  // The currently-selected project id and version ("draft" or a release label)
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);

  // Derived: selected project object and its product (if any)
  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;
  const selectedProduct = selectedProjectId ? productMap.get(selectedProjectId) ?? null : null;

  /**
   * Called from ProjectSidebar when user clicks a project row or version.
   * @param {string} projectId
   * @param {string} version  — "draft" | release label string
   */
  const handleProjectSelect = useCallback((projectId, version) => {
    setSelectedProjectId(projectId);
    setSelectedVersion(version);
  }, []);

  /**
   * Called from ProductForm after a successful create or update.
   * Updates the productMap so the form switches from CREATE → SAVE mode.
   */
  const handleProductSuccess = useCallback(
    (savedProduct) => {
      if (selectedProjectId) {
        updateProductInMap(selectedProjectId, savedProduct);
      }
    },
    [selectedProjectId, updateProductInMap]
  );

  return (
    <div className={styles.page}>
      {/* ── Left: project sidebar ── */}
      <ProjectSidebar
        projects={projects}
        loading={loading}
        error={error}
        selectedProjectId={selectedProjectId}
        selectedVersion={selectedVersion}
        onProjectSelect={handleProjectSelect}
      />

      {/* ── Right: product form ── */}
      <main className={styles.main}>
        <ProductForm
          project={selectedProject}
          product={selectedProduct}
          onSuccess={handleProductSuccess}
        />
      </main>
    </div>
  );
};
