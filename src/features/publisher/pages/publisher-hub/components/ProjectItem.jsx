import { useState, useEffect, useCallback } from "react";
import { publisherProjectApi } from "../api/project/api";
import styles from "./ProjectItem.module.css";

// ─── Time-ago helper ──────────────────────────────────────────────────────────
/**
 * Returns a human-readable relative time string, e.g. "6 months ago".
 */
function timeAgo(dateString) {
  if (!dateString) return "";
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  const intervals = [
    { label: "year",   secs: 31536000 },
    { label: "month",  secs: 2592000  },
    { label: "week",   secs: 604800   },
    { label: "day",    secs: 86400    },
    { label: "hour",   secs: 3600     },
    { label: "minute", secs: 60       },
  ];
  for (const { label, secs } of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

// ─── Mock product releases (no API yet) ───────────────────────────────────────
const MOCK_RELEASES = [
  { label: "product release v2.5.0", status: "Active" },
  { label: "v2.4.0-rc2",             status: null     },
  { label: "v2.3.1-stable",          status: null     },
];

// ─── Draft sub-row ────────────────────────────────────────────────────────────
const DraftRow = ({ projectId, isSelected, onSelect }) => {
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    publisherProjectApi
      .getProjectDraft(projectId)
      .then((res) => setDraft(res.data?.data.draft ?? null))
      .catch(() => setDraft(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  const savedAt = draft?.savedAt ? timeAgo(draft.savedAt) : null;
  // Rough size display from version number as placeholder
  const versionLabel = draft ? `v${draft.version ?? "?"}` : null;

  return (
    <button
      type="button"
      className={[styles.subRow, isSelected ? styles.subRowSelected : ""].join(" ")}
      onClick={() => onSelect("draft")}
      aria-current={isSelected ? "true" : undefined}
    >
      <span className={styles.draftLabel}>
        <span className={styles.draftDot} />
        draft - {versionLabel}
      </span>

      <span className={styles.draftMeta}>
        {loading && <span className={styles.loadingDot} />}
        {!loading && draft && (
          <>
            <span className={styles.targetBadge}>+ TARGET</span>
            {savedAt && <span className={styles.metaText}>{savedAt}</span>}
          </>
        )}
        {!loading && !draft && (
          <span className={styles.metaText}>no draft</span>
        )}
      </span>
    </button>
  );
};

// ─── Mock release row ─────────────────────────────────────────────────────────
const ReleaseRow = ({ release, isSelected, onSelect }) => (
  <button
    type="button"
    className={[styles.subRow, isSelected ? styles.subRowSelected : ""].join(" ")}
    onClick={() => onSelect(release.label)}
    aria-current={isSelected ? "true" : undefined}
  >
    <span className={styles.releaseLabel}>
      <span className={styles.releaseDot} />
      {release.label}
    </span>
    {release.status && (
      <span className={styles.releaseBadge}>{release.status}</span>
    )}
  </button>
);

// ─── Main ProjectItem ─────────────────────────────────────────────────────────
/**
 * A single project row in the sidebar.
 * Clicking expands to show draft + mock releases.
 *
 * Props:
 *  - project: project object { id, name, description, status, createdAt }
 *  - isExpanded: boolean
 *  - selectedVersion: string | null  ("draft" or release label)
 *  - onToggleExpand: () => void
 *  - onVersionSelect: (projectId, version) => void
 */
const ProjectItem = ({
  project,
  isExpanded,
  selectedVersion,
  onToggleExpand,
  onVersionSelect,
}) => {
  const handleVersionSelect = useCallback(
    (version) => onVersionSelect(project.id, version),
    [project.id, onVersionSelect]
  );

  return (
    <li className={styles.item}>
      {/* ── Project header row ── */}
      <button
        type="button"
        className={[styles.header, isExpanded ? styles.headerExpanded : ""].join(" ")}
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
      >
        <span className={styles.chevron}>{isExpanded ? "▾" : "▸"}</span>

        <span className={styles.info}>
          <span className={styles.name}>{project.name}</span>
          <span className={styles.created}>created {timeAgo(project.createdAt)}</span>
        </span>

        <span
          className={[
            styles.statusBadge,
            project.status === "ACTIVE" ? styles.statusActive : styles.statusInactive,
          ].join(" ")}
        >
          {project.status ?? "UNKNOWN"}
        </span>
      </button>

      {/* ── Sub-list (expanded) ── */}
      {isExpanded && (
        <ul className={styles.subList} role="list">
          {/* Draft row */}
          <li>
            <DraftRow
              projectId={project.id}
              isSelected={selectedVersion === "draft"}
              onSelect={handleVersionSelect}
            />
          </li>

          {/* Mock release rows */}
          {MOCK_RELEASES.map((rel) => (
            <li key={rel.label}>
              <ReleaseRow
                release={rel}
                isSelected={selectedVersion === rel.label}
                onSelect={handleVersionSelect}
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

export default ProjectItem;
