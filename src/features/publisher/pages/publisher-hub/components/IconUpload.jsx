import { useRef, useState, useCallback } from "react";
import { staticApi } from "@api/static/staticApi";
import StaticImage from "./StaticImage";
import styles from "./IconUpload.module.css";

/**
 * Icon upload component.
 * - Single image (PNG recommended, 512×512)
 * - Immediately calls staticApi.uploadImage on file select
 * - Calls onIconChange({ staticId, previewUrl }) on success
 * - Calls onIconChange(null) on remove
 *
 * Image display strategy:
 *   - Freshly uploaded  → use local blob URL (previewUrl) — no extra API call needed
 *   - Loaded from existing product (staticId only, no previewUrl)
 *                       → use <StaticImage> which calls staticApi.getImageById (variant "medium")
 *
 * Props:
 *  - icon: { staticId, previewUrl? } | null
 *  - onIconChange: (icon | null) => void
 */
const IconUpload = ({ icon, onIconChange }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;

      // Validate type and size
      if (!file.type.startsWith("image/")) {
        setError("Chỉ chấp nhận file ảnh.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError("Kích thước tối đa là 2MB.");
        return;
      }

      setError(null);
      setUploading(true);

      // Create a local blob URL for instant preview
      const previewUrl = URL.createObjectURL(file);

      try {
        const res = await staticApi.uploadImage({ file });
        const staticId = res.data?.data?.id || null;
        if (!staticId) throw new Error("Không nhận được staticId từ server.");
        onIconChange({ staticId, previewUrl });
      } catch (err) {
        URL.revokeObjectURL(previewUrl);
        console.error("[IconUpload] upload error:", err);
        setError(err?.response?.data?.message ?? "Upload thất bại.");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [onIconChange],
  );

  const handleInputChange = (e) => handleFile(e.target.files?.[0]);

  const handleRemove = () => {
    // Revoke local blob URL if present to free memory
    if (icon?.previewUrl) URL.revokeObjectURL(icon.previewUrl);
    onIconChange(null);
    setError(null);
  };

  return (
    <div className={styles.wrapper}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className={styles.hiddenInput}
        onChange={handleInputChange}
        aria-label="Upload tool icon"
      />

      {icon ? (
        /* ── Preview state ── */
        <div className={styles.preview}>
          {/*
           * Freshly uploaded → local blob URL available → plain <img>
           * Loaded from existing product → staticId only → <StaticImage> fetches via API
           */}
          {icon.previewUrl ? (
            <img
              src={icon.previewUrl}
              alt="Tool icon preview"
              className={styles.previewImg}
            />
          ) : (
            <StaticImage
              staticId={icon.staticId}
              variant="medium"
              alt="Tool icon preview"
              className={styles.previewImg}
            />
          )}

          <div className={styles.previewActions}>
            <button
              type="button"
              className={styles.changeBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Đang tải..." : "🖼 Change Icon"}
            </button>
            <button
              type="button"
              className={styles.removeBtn}
              onClick={handleRemove}
              aria-label="Remove icon"
              title="Remove icon"
            >
              🗑
            </button>
          </div>
          <span className={styles.uploadedBadge}>● Uploaded</span>
        </div>
      ) : (
        /* ── Drop / click zone ── */
        <button
          type="button"
          className={styles.dropZone}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label="Click to upload icon"
        >
          {uploading ? (
            <span className={styles.spinner} />
          ) : (
            <>
              <span className={styles.dropIcon}>🖼</span>
              <span className={styles.dropLabel}>Upload Icon</span>
            </>
          )}
        </button>
      )}

      {/* Hint text */}
      <p className={styles.hint}>
        Recommended: 512×512 PNG, transparent bg.
        <br />
        Max size: 2MB · 1:1 Square
      </p>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default IconUpload;
