import { useRef, useState, useCallback } from "react";
import { staticApi } from "@api/static/staticApi";
import StaticImage from "./StaticImage";
import styles from "./GalleryUpload.module.css";
import { MAX_IMAGES, MAX_SIZE_BYTES } from "@/constants/static";

/**
 * Multi-image gallery upload.
 * - Max 10 images, max 2MB each
 * - On drop/select: immediately calls staticApi.uploadImage for each new file
 * - sortOrder starts at 1, incrementing per image order
 * - Thumbnails are fixed height (120px), width preserves original ratio
 *
 * Image display strategy per thumbnail:
 *   - Freshly uploaded  → local blob URL (previewUrl) — no extra API call
 *   - Loaded from existing product (staticId only, no previewUrl)
 *                       → <StaticImage> calls staticApi.getImageById (variant "medium")
 *
 * Props:
 *  - gallery: Array<{ staticId, previewUrl?, sortOrder, altText }>
 *  - onGalleryChange: (gallery) => void
 */
const GalleryUpload = ({ gallery = [], onGalleryChange }) => {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState([]);

  const remaining = MAX_IMAGES - gallery.length;

  /** Upload a batch of File objects and append to gallery */
  const uploadFiles = useCallback(
    async (files) => {
      const fileList = Array.from(files).slice(0, remaining);
      if (fileList.length === 0) return;

      const newErrors = [];
      const validFiles = fileList.filter((f) => {
        if (!f.type.startsWith("image/")) {
          newErrors.push(`"${f.name}" không phải ảnh.`);
          return false;
        }
        if (f.size > MAX_SIZE_BYTES) {
          newErrors.push(`"${f.name}" vượt quá 2MB.`);
          return false;
        }
        return true;
      });

      setErrors(newErrors);
      if (validFiles.length === 0) return;

      setUploading(true);

      // Create local blob URLs immediately for optimistic UI
      const previews = validFiles.map((f) => URL.createObjectURL(f));

      // Starting sortOrder: 1-based, continues after the last existing item
      const baseOrder = gallery.length > 0 ? gallery[gallery.length - 1].sortOrder + 1 : 1;

      // Upload all files in parallel
      const results = await Promise.allSettled(
        validFiles.map((file) => staticApi.uploadImage({ file })),
      );

      const newItems = [];
      results.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          const staticId = result.value.data?.data?.id ?? null;
          if (staticId) {
            newItems.push({
              staticId,
              previewUrl: previews[idx], // local blob URL for immediate display
              sortOrder: baseOrder + idx,
              altText: String(baseOrder + idx),
            });
          } else {
            URL.revokeObjectURL(previews[idx]);
            setErrors((prev) => [
              ...prev,
              `"${validFiles[idx].name}" upload thành công nhưng không có staticId.`,
            ]);
          }
        } else {
          URL.revokeObjectURL(previews[idx]);
          setErrors((prev) => [
            ...prev,
            `"${validFiles[idx].name}" upload thất bại.`,
          ]);
        }
      });

      if (newItems.length > 0) {
        onGalleryChange([...gallery, ...newItems]);
      }

      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [gallery, remaining, onGalleryChange],
  );

  /** Remove an image */
  const handleRemove = useCallback(
    (idx) => {
      const item = gallery[idx];
      // Revoke blob URL if it's a local preview
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      const updated = gallery.filter((_, i) => i !== idx);
      onGalleryChange(updated);
    },
    [gallery, onGalleryChange],
  );

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e) => uploadFiles(e.target.files);

  return (
    <div className={styles.wrapper}>
      {/* Counter */}
      <div className={styles.header}>
        <span className={styles.counter}>
          {gallery.length}/{MAX_IMAGES}
        </span>
        {uploading && (
          <span className={styles.uploadingText}>Đang tải ảnh...</span>
        )}
      </div>

      {/* Thumbnails + drop zone */}
      <div className={styles.row}>
        {/* Render each thumbnail */}
        {gallery.map((item, idx) => (
          <div key={item.staticId ?? idx} className={styles.thumb}>
            {/*
             * Freshly uploaded → local blob URL (previewUrl) → plain <img>
             * Loaded from existing product → staticId only → <StaticImage> fetches via API
             */}
            {item.previewUrl ? (
              <img
                src={item.previewUrl}
                alt={item.altText}
                className={styles.thumbImg}
                loading="lazy"
              />
            ) : (
              <StaticImage
                staticId={item.staticId}
                variant="medium"
                alt={item.altText}
                className={styles.thumbImg}
              />
            )}

            <button
              type="button"
              className={styles.removeThumb}
              onClick={() => handleRemove(idx)}
              aria-label={`Remove image ${idx + 1}`}
            >
              ×
            </button>
          </div>
        ))}

        {/* Add photos zone (visible when under the limit) */}
        {remaining > 0 && (
          <button
            type="button"
            className={[styles.addZone, dragOver ? styles.dragOver : ""].join(
              " ",
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            disabled={uploading}
            aria-label="Add photos"
          >
            {uploading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                <span className={styles.addIcon}>+</span>
                <span className={styles.addLabel}>Add photos</span>
                <span className={styles.addHint}>Maximum size: 2MB</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Hidden file input – multiple */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className={styles.hiddenInput}
        onChange={handleInputChange}
        aria-hidden="true"
      />

      {/* Upload errors */}
      {errors.length > 0 && (
        <ul className={styles.errorList}>
          {errors.map((e, i) => (
            <li key={i} className={styles.errorItem}>
              {e}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GalleryUpload;
