import { useState, useEffect } from "react";
import { staticApi } from "@api/static/staticApi";

/**
 * Fetches an image blob from the static API and returns a local object URL.
 *
 * - If `staticId` is null/undefined, returns { src: null, loading: false, error: null }.
 * - Automatically revokes the object URL on cleanup (unmount or staticId/variant change).
 *
 * @param {string|null} staticId
 * @param {"small"|"medium"|"large"} variant
 * @returns {{ src: string|null, loading: boolean, error: string|null }}
 */
export function useStaticImage(staticId, variant = "medium") {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!staticId) {
      setSrc(null);
      setLoading(false);
      setError(null);
      return;
    }

    let objectUrl = null;
    let cancelled = false;

    setLoading(true);
    setError(null);
    setSrc(null);

    staticApi
      .getImageById({ imageId: staticId, variant })
      .then((res) => {
        if (cancelled) return;
        // res.data is a Blob (axios responseType: "blob")
        objectUrl = URL.createObjectURL(res.data);
        setSrc(objectUrl);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[useStaticImage] fetch error:", err);
        setError("Không thể tải ảnh.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      // Revoke the blob URL to free memory
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [staticId, variant]);

  return { src, loading, error };
}
