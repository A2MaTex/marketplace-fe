import { IoCheckmarkCircle, IoRocketOutline } from "react-icons/io5";
import { SummernoteEditor } from "@eaeao/summernote-react";
import "@eaeao/summernote-react/styles.css";
import "@eaeao/summernote-react/icons.css";
import { useProductForm } from "../hooks/useProductForm";
import IconUpload from "./IconUpload";
import GalleryUpload from "./GalleryUpload";
import LicenseTier from "./LicenseTier";
import styles from "./ProductForm.module.css";

// Toolbar dùng chung cho cả 2 rich text field
const RICH_TEXT_TOOLBAR = [
  ["style", ["bold", "italic", "underline", "strikethrough"]],
  ["para",  ["ul", "ol"]],
  ["misc",  ["codeview", "link", "table"]],
  ["history", ["undo", "redo"]],
];

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Section = ({ icon, number, title, subtitle, badge, children, counter }) => (
  <section className={styles.section}>
    <div className={styles.sectionHeader}>
      <div className={styles.sectionIcon}>{icon}</div>
      <div className={styles.sectionMeta}>
        <div className={styles.sectionTitleRow}>
          <h2 className={styles.sectionTitle}>
            {number}. {title}
          </h2>
          {badge && <span className={styles.requiredBadge}>{badge}</span>}
          {counter !== undefined && (
            <span className={styles.counterBadge}>{counter}</span>
          )}
        </div>
        {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
      </div>
    </div>
    <div className={styles.sectionBody}>{children}</div>
  </section>
);

// ─── Field row (label + input) ────────────────────────────────────────────────
const Field = ({ label, hint, required, children }) => (
  <div className={styles.field}>
    <div className={styles.fieldLabel}>
      <span className={styles.labelText}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </span>
      {hint && <span className={styles.fieldHint}>{hint}</span>}
    </div>
    {children}
  </div>
);

// ─── Main ProductForm ─────────────────────────────────────────────────────────
/**
 * Full product form panel.
 *
 * Props:
 *  - project: selected project object (or null)
 *  - product: existing product (or null for new)
 *  - onSuccess: (savedProduct) => void  — called after successful create/update
 */
const ProductForm = ({ project, product, onSuccess }) => {
  const {
    form,
    isNew,
    isDirty,
    submitting,
    submitError,
    setField,
    setIcon,
    setGallery,
    setLicensePrice,
    setLicenseStatus,
    addCustomLicense,
    removeCustomLicense,
    handleSubmit,
  } = useProductForm({ project, product, onSuccess });

  if (!project) {
    return (
      <div className={styles.emptyState}>
        <IoRocketOutline size={48} className={styles.emptyIcon} />
        <p className={styles.emptyText}>
          Chọn một project từ danh sách bên trái để bắt đầu.
        </p>
      </div>
    );
  }

  // Current version label for the bottom bar
  const versionLabel = product?.currentReleaseId
    ? `v${product.slug ?? "?"}`
    : isNew
    ? "v0.0.1"
    : form.slug || "draft";

  return (
    <div className={styles.wrapper}>
      {/* ── Page title ── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Release Pipeline</h1>
        <span className={styles.versionTag}>{versionLabel}</span>
        {!isNew && (
          <span className={styles.safetyBadge}>
            <IoCheckmarkCircle size={12} />
            Safety check passed
          </span>
        )}
      </div>

      {/* ── Scrollable form area ── */}
      <div className={styles.formScroll}>

        {/* ── Section 1: Basic Information ── */}
        <Section
          icon={<span className={styles.sectionIconCircle}>ℹ</span>}
          number={1}
          title="Basic Information"
          subtitle="The tool's display name, identifier, and feature description on the app store."
          badge="Required"
        >
          <div className={styles.basicGrid}>
            {/* Left column: text fields */}
            <div className={styles.basicLeft}>
              <Field label="TOOL NAME" required>
                <input
                  type="text"
                  className={styles.textInput}
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="My Awesome Tool"
                />
              </Field>

              <Field label="SHORT DESCRIPTION" required>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={form.shortDescription}
                  onChange={(e) => setField("shortDescription", e.target.value)}
                  placeholder="One-line description shown in search results…"
                />
              </Field>

              <Field label="DESCRIPTION">
                <div className={styles.editorWrap}>
                  <SummernoteEditor
                    value={form.description}
                    onChange={(html) => setField("description", html)}
                    toolbar={RICH_TEXT_TOOLBAR}
                    colorScheme="dark"
                    theme="lite"
                    placeholder="Full product description…"
                    disableResize={false}
                  />
                </div>
              </Field>

              <Field label="USAGE INSTRUCTION">
                <div className={styles.editorWrap}>
                  <SummernoteEditor
                    value={form.usageInstructions}
                    onChange={(html) => setField("usageInstructions", html)}
                    toolbar={RICH_TEXT_TOOLBAR}
                    colorScheme="dark"
                    theme="lite"
                    placeholder="Describe how to use this tool…"
                    disableResize={false}
                  />
                </div>
              </Field>
            </div>

            {/* Right column: icon upload */}
            <div className={styles.basicRight}>
              <Field label="TOOL ICON">
                <IconUpload icon={form.icon} onIconChange={setIcon} />
              </Field>
            </div>
          </div>
        </Section>

        {/* ── Section 2: License Tier Configuration ── */}
        <Section
          icon={<span className={styles.sectionIconCircle}>🔖</span>}
          number={2}
          title="License Tier Configuration"
          subtitle="Set up licensing packages to offer buyers on the Marketplace. Customers can choose between recurring or lifetime payment options."
          badge={`${form.licenses.filter((l) => l.status).length + form.customLicenses.length} ACTIVE PACKAGES`}
        >
          <LicenseTier
            licenses={form.licenses}
            customLicenses={form.customLicenses}
            onPriceChange={setLicensePrice}
            onStatusChange={setLicenseStatus}
            onAddCustom={addCustomLicense}
            onRemoveCustom={removeCustomLicense}
          />
        </Section>

        {/* ── Section 3: Preview Images ── */}
        <Section
          icon={<span className={styles.sectionIconCircle}>🖼</span>}
          number={3}
          title="Preview Images"
          subtitle="Provide some images of real product to help your customers understand your tool better"
          counter={`${form.gallery.length}/10`}
        >
          <GalleryUpload gallery={form.gallery} onGalleryChange={setGallery} />
        </Section>

      </div>

      {/* ── Bottom action bar ── */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomLeft}>
          <IoCheckmarkCircle size={18} className={styles.readyIcon} />
          <div className={styles.readyText}>
            <span className={styles.readyTitle}>
              Ready to submit {versionLabel}
            </span>
            <span className={styles.readySubtitle}>
              {isNew
                ? "Create product and submit for administrator approval"
                : "Save changes and wait for administrator approval"}
            </span>
          </div>
        </div>

        <div className={styles.bottomActions}>
          {submitError && (
            <span className={styles.submitError}>{submitError}</span>
          )}
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => {/* handled by parent if needed */}}
          >
            Cancel
          </button>
          <button
            type="button"
            className={[
              styles.submitBtn,
              (!isDirty && !isNew) || submitting ? styles.submitBtnDisabled : "",
            ].join(" ")}
            onClick={handleSubmit}
            disabled={(!isDirty && !isNew) || submitting}
          >
            {submitting ? (
              <span className={styles.btnSpinner} />
            ) : isNew ? (
              "CREATE"
            ) : (
              "SAVE"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
