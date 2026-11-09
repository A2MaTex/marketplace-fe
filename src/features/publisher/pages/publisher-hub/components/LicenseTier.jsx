import { useState } from "react";
import styles from "./LicenseTier.module.css";

// Labels/badges shown per preset license slot
const PRESET_META = {
  "1month":   { badge: "PHỔ BIẾN",      badgeClass: "badgePopular"  },
  "1year":    { badge: "TIẾT KIỆM 50%", badgeClass: "badgeSave"     },
  "lifetime": { badge: "VĨNH VIỄN",     badgeClass: "badgeLifetime" },
};

// Currency display helper
const formatPrice = (price) => {
  const num = parseFloat(price);
  if (isNaN(num) || price === "") return null;
  return `$${num.toFixed(2)}`;
};

// VND approximation (rough display only)
const toVND = (price) => {
  const num = parseFloat(price);
  if (isNaN(num) || price === "") return null;
  return `~${Math.round(num * 24000).toLocaleString("vi-VN")} VND`;
};

// ─── Toggle switch ────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, id }) => (
  <label className={styles.toggle} htmlFor={id}>
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className={styles.toggleInput}
    />
    <span className={styles.toggleTrack}>
      <span className={styles.toggleThumb} />
    </span>
  </label>
);

// ─── Preset license card ──────────────────────────────────────────────────────
const PresetCard = ({ license, onPriceChange, onStatusChange }) => {
  const meta = PRESET_META[license.id] ?? {};

  return (
    <div className={[styles.card, license.status ? styles.cardActive : styles.cardInactive].join(" ")}>
      {/* Badge */}
      {meta.badge && (
        <span className={[styles.badge, styles[meta.badgeClass]].join(" ")}>
          {meta.badge}
        </span>
      )}

      {/* Duration label */}
      <div className={styles.cardLabel}>{license.name}</div>

      {/* Bullet indicator */}
      <span className={[styles.dot, license.status ? styles.dotActive : styles.dotInactive].join(" ")} />

      {/* Price input */}
      <div className={styles.priceWrap}>
        <span className={styles.currencySign}>$</span>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={license.price}
          onChange={(e) => onPriceChange(license.id, e.target.value)}
          className={styles.priceInput}
          aria-label={`Price for ${license.name}`}
        />
      </div>

      {/* VND approximation */}
      {license.price !== "" && !isNaN(parseFloat(license.price)) && (
        <div className={styles.vndHint}>{toVND(license.price)}</div>
      )}

      {/* Status label + toggle */}
      <div className={styles.cardFooter}>
        <span className={styles.statusLabel}>
          {license.status ? "ACTIVE" : "INACTIVE"}
        </span>
        <Toggle
          id={`toggle-${license.id}`}
          checked={license.status}
          onChange={(v) => onStatusChange(license.id, v)}
        />
      </div>
    </div>
  );
};

// ─── Custom license row ───────────────────────────────────────────────────────
const DURATION_UNITS = ["DAY", "WEEK", "MONTH", "YEAR"];

const defaultCustom = () => ({
  name: "",
  duration: { amount: 1, unit: "MONTH" },
  price: "",
  status: true,
});

/**
 * License tier section.
 *
 * Props:
 *  - licenses: Array<preset license objects from useProductForm>
 *  - customLicenses: Array<custom license objects>
 *  - onPriceChange: (id, price) => void
 *  - onStatusChange: (id, status) => void
 *  - onAddCustom: (license) => void
 *  - onRemoveCustom: (id) => void
 */
const LicenseTier = ({
  licenses = [],
  customLicenses = [],
  onPriceChange,
  onStatusChange,
  onAddCustom,
  onRemoveCustom,
}) => {
  const [custom, setCustom] = useState(defaultCustom());

  const handleAddCustom = () => {
    if (!custom.name.trim() || !custom.price) return;
    onAddCustom({ ...custom });
    setCustom(defaultCustom()); // reset
  };

  return (
    <div className={styles.wrapper}>
      {/* Preset cards row */}
      <div className={styles.cardRow}>
        {licenses.map((lic) => (
          <PresetCard
            key={lic.id}
            license={lic}
            onPriceChange={onPriceChange}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>

      {/* Existing custom licenses */}
      {customLicenses.length > 0 && (
        <div className={styles.customList}>
          {customLicenses.map((lic) => (
            <div key={lic.id} className={styles.customRow}>
              <span className={styles.customName}>{lic.name}</span>
              <span className={styles.customDuration}>
                {lic.duration.amount} {lic.duration.unit}
              </span>
              <span className={styles.customPrice}>
                {formatPrice(lic.price) ?? "—"}
              </span>
              <button
                type="button"
                className={styles.removeCustomBtn}
                onClick={() => onRemoveCustom(lic.id)}
                aria-label={`Remove ${lic.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add custom license form */}
      <div className={styles.customForm}>
        <div className={styles.customFormHeader}>Custom License Tier</div>

        <div className={styles.customFormRow}>
          {/* Package name */}
          <div className={styles.customField}>
            <label className={styles.customFieldLabel}>PACKAGE NAME</label>
            <input
              type="text"
              placeholder="Gói Chuyên Nghiệp 3 Tháng"
              value={custom.name}
              onChange={(e) => setCustom((p) => ({ ...p, name: e.target.value }))}
              className={styles.customInput}
            />
          </div>

          {/* Duration amount */}
          <div className={styles.customField} style={{ maxWidth: 80 }}>
            <label className={styles.customFieldLabel}>DURATION</label>
            <input
              type="number"
              min="1"
              value={custom.duration.amount}
              onChange={(e) =>
                setCustom((p) => ({
                  ...p,
                  duration: { ...p.duration, amount: parseInt(e.target.value) || 1 },
                }))
              }
              className={styles.customInput}
              aria-label="Duration amount"
            />
          </div>

          {/* Duration unit */}
          <div className={styles.customField} style={{ maxWidth: 110 }}>
            <label className={styles.customFieldLabel}>&nbsp;</label>
            <select
              value={custom.duration.unit}
              onChange={(e) =>
                setCustom((p) => ({
                  ...p,
                  duration: { ...p.duration, unit: e.target.value },
                }))
              }
              className={styles.customSelect}
              aria-label="Duration unit"
            >
              {DURATION_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u.charAt(0) + u.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div className={styles.customField} style={{ maxWidth: 130 }}>
            <label className={styles.customFieldLabel}>PRICE</label>
            <div className={styles.customPriceWrap}>
              <span className={styles.currencySign}>$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="129.99"
                value={custom.price}
                onChange={(e) =>
                  setCustom((p) => ({ ...p, price: e.target.value }))
                }
                className={styles.customInput}
                style={{ paddingLeft: 20 }}
                aria-label="Custom price"
              />
            </div>
          </div>

          {/* Add button */}
          <div className={styles.customField} style={{ justifyContent: "flex-end" }}>
            <label className={styles.customFieldLabel}>&nbsp;</label>
            <button
              type="button"
              className={styles.addBtn}
              onClick={handleAddCustom}
              disabled={!custom.name.trim() || !custom.price}
            >
              + Add this package
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseTier;
