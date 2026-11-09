import { useState, useMemo } from "react";
import { IoSearchOutline, IoFilterOutline, IoSwapVerticalOutline } from "react-icons/io5";
import ProjectItem from "./ProjectItem";
import styles from "./ProjectSidebar.module.css";

/**
 * Left sidebar: project list with search, active count, and expand/collapse.
 *
 * Props:
 *  - projects: array of project objects
 *  - loading: boolean
 *  - error: string | null
 *  - selectedProjectId: string | null
 *  - selectedVersion: string | null   ("draft" or a release label)
 *  - onProjectSelect: (projectId, version) => void
 */
const ProjectSidebar = ({
  projects = [],
  loading,
  error,
  selectedProjectId,
  selectedVersion,
  onProjectSelect,
}) => {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  // Count active projects
  const activeCount = useMemo(
    () => projects.filter((p) => p.status === "ACTIVE").length,
    [projects]
  );

  // Filter by search query (name, case-insensitive)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, search]);

  const handleToggleExpand = (projectId) => {
    setExpandedId((prev) => {
      const nextExpanded = prev === projectId ? null : projectId;
      // When expanding a new project, auto-select its draft
      if (nextExpanded) {
        onProjectSelect(projectId, "draft");
      }
      return nextExpanded;
    });
  };

  const handleVersionSelect = (projectId, version) => {
    onProjectSelect(projectId, version);
  };

  return (
    <aside className={styles.sidebar} aria-label="Project list">
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <span className={styles.activeBadge}>{activeCount} ACTIVE</span>
          <button type="button" className={styles.iconBtn} title="Filter" aria-label="Filter projects">
            <IoFilterOutline size={14} />
          </button>
        </div>

        <div className={styles.sectionLabel}>
          <span>YOUR PROJECT LIST</span>
          <button type="button" className={styles.iconBtn} title="Sort" aria-label="Sort projects">
            <IoSwapVerticalOutline size={14} />
          </button>
        </div>

        {/* Search */}
        <div className={styles.searchWrap}>
          <IoSearchOutline size={13} className={styles.searchIcon} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Find by name, version..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search projects"
          />
        </div>
      </div>

      {/* ── Project list ── */}
      <div className={styles.listWrap}>
        {loading && (
          <div className={styles.stateMsg}>
            <span className={styles.spinner} />
            <span>Loading projects…</span>
          </div>
        )}

        {!loading && error && (
          <div className={styles.stateMsg + " " + styles.errorMsg}>{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className={styles.stateMsg}>No projects found.</div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <ul className={styles.list} role="list" aria-label="Projects">
            {filtered.map((project) => (
              <ProjectItem
                key={project.id}
                project={project}
                isExpanded={expandedId === project.id}
                selectedVersion={
                  selectedProjectId === project.id ? selectedVersion : null
                }
                onToggleExpand={() => handleToggleExpand(project.id)}
                onVersionSelect={handleVersionSelect}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default ProjectSidebar;
