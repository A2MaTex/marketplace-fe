import { useStaticImage } from "../hooks/useStaticImage";

/**
 * An <img> that fetches its src from the static API using a staticId.
 * Can be used directly in place of <img> wherever a staticId is available.
 *
 * Usage:
 *   <StaticImage staticId="abc-123" variant="medium" alt="icon" className={styles.img} />
 *
 * Props:
 *  - staticId  : string                     — static asset ID to fetch
 *  - variant   : "small"|"medium"|"large"   — image variant (default "medium")
 *  - fallback  : ReactNode                  — rendered while loading or on error;
 *                                             defaults to a grey placeholder div
 *  - All other props are forwarded to the underlying <img> element.
 */
const StaticImage = ({
  staticId,
  variant = "medium",
  fallback,
  alt = "",
  ...imgProps
}) => {
  const { src, loading, error } = useStaticImage(staticId, variant);

  if (loading || error || !src) {
    if (fallback !== undefined) return fallback;

    // Default placeholder — inherits className/style so it matches the img's box
    return (
      <div
        className={imgProps.className}
        style={{
          background: "#0a0e1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#2e3448",
          fontSize: 11,
          ...(imgProps.style ?? {}),
        }}
        aria-hidden="true"
      >
        {loading ? "…" : "✕"}
      </div>
    );
  }

  return <img src={src} alt={alt} {...imgProps} />;
};

export default StaticImage;
