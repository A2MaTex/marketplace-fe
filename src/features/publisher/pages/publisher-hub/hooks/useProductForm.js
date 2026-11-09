import { useState, useEffect, useCallback, useRef } from "react";
import { publisherProductApi } from "../api/product/api";

// ─── Slug helper ──────────────────────────────────────────────────────────────
/**
 * Generate a URL-safe slug from a Vietnamese / general string.
 * 1. Normalise to NFD (separates base chars from combining diacritics)
 * 2. Remove combining diacritic marks (U+0300–U+036F)
 * 3. Special-case the Vietnamese đ/Đ that survives NFD
 * 4. Replace non-alphanumeric sequences with "-"
 * 5. Trim leading/trailing dashes and lowercase
 */
export function generateSlug(text) {
  return (text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Default form state factory ───────────────────────────────────────────────
const DEFAULT_LICENSES = [
  {
    id: "1day",
    name: "1 Day",
    duration: { amount: 1, unit: "DAY" },
    price: "",
    status: true,
  },
  {
    id: "1week",
    name: "1 Week",
    duration: { amount: 1, unit: "WEEK" },
    price: "",
    status: true,
  },
  {
    id: "1month",
    name: "1 Month",
    duration: { amount: 1, unit: "MONTH" },
    price: "",
    status: true,
  },
  {
    id: "1year",
    name: "1 Year",
    duration: { amount: 1, unit: "YEAR" },
    price: "",
    status: true,
  },
  {
    id: "lifetime",
    name: "Lifetime",
    duration: { amount: 999, unit: "YEAR" },
    price: "",
    status: true,
  },
];

function buildDefaultForm(project, product) {
  if (product) {
    // Existing product – map API shape into form state
    const iconMedia = product.media?.find((m) => m.type === "ICON") ?? null;
    const galleryMedia = (product.media ?? [])
      .filter((m) => m.type === "GALLERY")
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      name: product.name ?? "",
      slug: product.slug ?? "",
      shortDescription: product.shortDescription ?? "",
      description: product.description ?? "",
      usageInstructions: product.usageInstructions ?? "",
      // Icon: stored as { staticId, previewUrl } – previewUrl fetched separately by IconUpload
      icon: iconMedia
        ? { staticId: iconMedia.staticId, mediaId: iconMedia.id }
        : null,
      // Gallery: array of { staticId, previewUrl, sortOrder, altText }
      gallery: galleryMedia.map((m) => ({
        staticId: m.staticId,
        mediaId: m.id,
        sortOrder: m.sortOrder,
        altText: m.altText ?? String(m.sortOrder),
        previewUrl: null, // will be fetched/shown by GalleryUpload
      })),
      licenses: DEFAULT_LICENSES.map((def) => ({ ...def })),
      customLicenses: [],
    };
  }

  // New product – pre-fill from project
  return {
    name: project?.name ?? "",
    slug: generateSlug(project?.name ?? ""),
    shortDescription: project?.description ?? "",
    description: "",
    usageInstructions: "",
    icon: null,
    gallery: [],
    licenses: DEFAULT_LICENSES.map((def) => ({ ...def })),
    customLicenses: [],
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Manages all form state for the product form.
 *
 * @param {object|null} project   - selected project
 * @param {object|null} product   - existing product (or null for new)
 * @param {function}    onSuccess - called with the saved/created product
 */
export function useProductForm({ project, product, onSuccess }) {
  const isNew = !product;

  const [form, setForm] = useState(() => buildDefaultForm(project, product));
  // Track the "saved" snapshot to detect dirty state
  const savedRef = useRef(JSON.stringify(buildDefaultForm(project, product)));
  const [isDirty, setIsDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Re-initialise form when the selected project/product changes
  useEffect(() => {
    const initial = buildDefaultForm(project, product);
    setForm(initial);
    savedRef.current = JSON.stringify(initial);
    setIsDirty(false);
    setSubmitError(null);
  }, [project?.id, product?.id]);

  // Dirty detection
  useEffect(() => {
    setIsDirty(JSON.stringify(form) !== savedRef.current);
  }, [form]);

  // ── Field setters ──────────────────────────────────────────────────────────

  const setField = useCallback((field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-update slug when name changes
      if (field === "name") {
        next.slug = generateSlug(value);
      }
      return next;
    });
  }, []);

  const setIcon = useCallback((iconData) => {
    // iconData: { staticId, previewUrl } or null
    setForm((prev) => ({ ...prev, icon: iconData }));
  }, []);

  const setGallery = useCallback((galleryItems) => {
    // galleryItems: array of { staticId, previewUrl, sortOrder, altText }
    setForm((prev) => ({ ...prev, gallery: galleryItems }));
  }, []);

  const setLicensePrice = useCallback((id, price) => {
    setForm((prev) => ({
      ...prev,
      licenses: prev.licenses.map((l) => (l.id === id ? { ...l, price } : l)),
    }));
  }, []);

  const setLicenseStatus = useCallback((id, status) => {
    setForm((prev) => ({
      ...prev,
      licenses: prev.licenses.map((l) => (l.id === id ? { ...l, status } : l)),
    }));
  }, []);

  const addCustomLicense = useCallback((license) => {
    setForm((prev) => ({
      ...prev,
      customLicenses: [
        ...prev.customLicenses,
        { ...license, id: `custom-${Date.now()}` },
      ],
    }));
  }, []);

  const removeCustomLicense = useCallback((id) => {
    setForm((prev) => ({
      ...prev,
      customLicenses: prev.customLicenses.filter((l) => l.id !== id),
    }));
  }, []);

  // ── Build API body ─────────────────────────────────────────────────────────

  const buildBody = useCallback(
    (projectId) => {
      const media = [];

      // Icon media
      if (form.icon?.staticId) {
        media.push({
          staticId: form.icon.staticId,
          type: "ICON",
          sortOrder: 0,
        });
      }

      // Gallery media – sortOrder starts at 1
      form.gallery.forEach((item, idx) => {
        media.push({
          staticId: item.staticId,
          type: "GALLERY",
          sortOrder: idx + 1,
          altText: item.altText ?? String(idx + 1),
        });
      });

      // Combine preset + custom licenses, filter only ones with a price
      const allLicenses = [...form.licenses, ...form.customLicenses]
        .filter((l) => l.price !== "" && l.price !== undefined)
        .map(({ id: _id, ...rest }) => ({
          name: rest.name,
          duration: rest.duration,
          price: parseFloat(rest.price) || 0,
          status: rest.status ? "ACTIVE" : "INACTIVE",
        }));

      const body = {
        name: form.name,
        slug: form.slug,
        shortDescription: form.shortDescription,
        description: form.description,
        usageInstructions: form.usageInstructions,
        media,
        // licenses: allLicenses,
      };

      if (isNew) {
        body.projectId = projectId;
      }

      return body;
    },
    [form, isNew],
  );

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!project) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const body = buildBody(project.id);
      let res;
      if (isNew) {
        res = await publisherProductApi.createProduct(body);
      } else {
        res = await publisherProductApi.updateProduct(product.id, body);
      }

      const afterChange = { ...body, id: isNew ? res.data?.data?.id : product?.id };
      savedRef.current = afterChange;
      setIsDirty(false);
      onSuccess?.(afterChange);
    } catch (err) {
      console.error("[useProductForm] submit error:", err);
      setSubmitError(err?.response?.data?.message ?? "Lưu thất bại, thử lại.");
    } finally {
      setSubmitting(false);
    }
  }, [project, product, form, buildBody, isNew, onSuccess]);

  return {
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
  };
}
