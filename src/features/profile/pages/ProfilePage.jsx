import { useEffect, useState } from "react";
import Input from "@components/common/Input";
import Button from "@components/common/Button";
import { profileApi } from "../api/profileApi";
import AvatarUpload from "../components/AvatarUpload";
import ActivatePublisherModal from "../components/ActivatePublisherModal";
import TopUpModal from "../components/top-up/TopUpModal";
import styles from "./ProfilePage.module.css";

import {
  BsPersonBadge,
  BsShieldLock,
  BsCheckCircleFill,
  BsGlobe2,
  BsGithub,
  BsTwitterX,
  BsLinkedin,
  BsInstagram,
  BsTrash3,
  BsRocketTakeoff,
} from "react-icons/bs";
import {
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiMail,
  FiAlignLeft,
  FiRefreshCw,
  FiSave,
  FiLock,
  FiLogOut,
  FiUpload,
} from "react-icons/fi";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";
import { userApi } from "@/common/api/user/userApi";
import { staticApi } from "@/common/api/static/staticApi";
import { Avatar } from "../../../common/components/common/Avatar";
import { cacheImage } from "@/lib/cache";
import { useAuthStore } from "@/features/auth/store/authStore";
import ROLE from "@/constants/roles";
import GENDER from "@/constants/gender";
import { authApi } from "@/features/auth/api/authApi";
import { useNavigate } from "react-router-dom";
import { AiOutlineThunderbolt } from "react-icons/ai";

/* ── helpers ─────────────────────────────────────────────────── */

const SOCIAL_FIELDS = [
  {
    key: "website",
    label: "PERSONAL WEBSITE / PORTFOLIO",
    icon: <BsGlobe2 size={13} />,
  },
  {
    key: "github",
    label: "GITHUB DEVELOPER REPO",
    icon: <BsGithub size={13} />,
  },
  { key: "twitter", label: "TWITTER / X FEED", icon: <BsTwitterX size={13} /> },
  {
    key: "linkedin",
    label: "LINKEDIN NETWORK",
    icon: <BsLinkedin size={13} />,
  },
  { key: "instagram", label: "INSTAGRAM", icon: <BsInstagram size={13} /> },
];

const EMPTY_PROFILE = {
  fullName: "",
  email: "",
  phone: "",
  birthday: "",
  gender: "",
  address: "",
  bio: "",
  website: "",
  github: "",
  twitter: "",
  linkedin: "",
  instagram: "",
  avatarStaticId: null,
  balance: 0,
  createdAt: null,
  roles: [],
};

const EMPTY_PW = {
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

/* ── component ───────────────────────────────────────────────── */
const ProfilePage = () => {
  const initProfile = { ...EMPTY_PROFILE, ...useAuthStore((s) => s.user) };

  const [profile, setProfile] = useState(initProfile);
  const [avatar, setAvatar] = useState(useAuthStore((s) => s.avatarBlob));
  const [form, setForm] = useState(initProfile);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { msg, type }
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPublisherModal, setShowPublisherModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null); // local data-URL before save

  const [pwForm, setPwForm] = useState(EMPTY_PW);
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);

  const navigate = useNavigate();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* field change */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleGender = (val) => setForm((f) => ({ ...f, gender: val }));

  /* discard */
  const handleDiscard = () => {
    setForm({ ...profile });
    setAvatarPreview(null);
  };

  /* save profile */
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName || null,
        avatarStaticId: form.avatarStaticId || null,
        bio: form.bio || null,
        website: form.website || null,
        twitter: form.twitter || null,
        linkedin: form.linkedin || null,
        github: form.github || null,
        instagram: form.instagram || null,
        gender: form.gender || null,
        birthday: form.birthday ? new Date(form.birthday) : null,
        address: form.address || null,
        phone: form.phone || null,
        email: form.email || null,
      };
      await profileApi.updateMyProfile(payload);
      setProfile({ ...form });
      setAvatarPreview(null); // preview now committed — clear so server URL takes over

      if (!!payload.avatarStaticId) {
        const ava = await staticApi.getImageById({
          imageId: payload.avatarStaticId,
        });
        setAvatar(ava.data);
        cacheImage(profile.id, ava.data);
      }

      showToast("Cập nhật thông tin thành công!");
    } catch (err) {
      const msg = err?.response?.data?.message || "Cập nhật thất bại.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  /* avatar upload done */
  const handleAvatarDone = (staticId, previewUrl) => {
    setForm((f) => ({ ...f, avatarStaticId: staticId }));
    setAvatarPreview(previewUrl);
    setShowAvatarModal(false);
    showToast("Ảnh đã sẵn sàng — nhấn Save để lưu.");
  };

  /* delete avatar */
  const handleDeleteAvatar = () => {
    setForm((f) => ({ ...f, avatarStaticId: null }));
    setAvatarPreview(null);
  };

  /* bio char count */
  const bioLen = (form.bio || "").length;

  /* join date */
  const joinedDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const loadProfile = async () => {
    try {
      let myProfile = profile;
      console.log(myProfile);

      if (!myProfile) {
        console.log("xx");

        setLoading(true);
        myProfile = await userApi.getMyProfile();
      }

      const merged = { ...initProfile, ...myProfile };
      setProfile(merged);
      setForm(merged);
      setAvatar(myProfile.imgBlob);
    } catch (error) {
      console.log(error);

      showToast("Không thể tải thông tin tài khoản.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* change password */
  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm((f) => ({ ...f, [name]: value }));
    setPwErrors((e) => ({ ...e, [name]: "" }));
  };

  const validatePw = () => {
    const errs = {};
    if (!pwForm.currentPassword)
      errs.currentPassword = "Vui lòng nhập mật khẩu hiện tại.";
    if (!pwForm.newPassword || pwForm.newPassword.length < 6)
      errs.newPassword = "Mật khẩu mới tối thiểu 6 ký tự.";
    if (pwForm.newPassword !== pwForm.confirmNewPassword)
      errs.confirmNewPassword = "Mật khẩu xác nhận không khớp.";
    return errs;
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    const errs = validatePw();
    if (Object.keys(errs).length) {
      setPwErrors(errs);
      return;
    }
    setPwSaving(true);
    try {
      await profileApi.changePassword(pwForm);
      setPwForm(EMPTY_PW);
      showToast("Đổi mật khẩu thành công!");
    } catch (err) {
      const msg = err?.response?.data?.message || "Đổi mật khẩu thất bại.";
      showToast(msg, "error");
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () => {
    try {
      authApi.logout();
    } catch (error) {
      console.error(error);
    } finally {
      navigate("/");
    }
  };

  /* load */
  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <FiRefreshCw className={styles.spinIcon} size={28} />
        <span>Loading profile…</span>
      </div>
    );
  }

  return (
    <>
      <div className={styles.page}>
        {/* ── Toast ── */}
        {toast && (
          <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
            {toast.type === "success" ? (
              <BsCheckCircleFill size={14} />
            ) : (
              <FiLock size={14} />
            )}
            {toast.msg}
          </div>
        )}

        <div className={styles.inner}>
          {/* ══ Top banner ══════════════════════════════════════ */}
          <div className={styles.banner}>
            {/* Avatar */}
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="avatar"
                    className={styles.avatarImg}
                  />
                ) : form.avatarStaticId ? (
                  <Avatar blob={avatar} />
                ) : (
                  <FiUser size={36} color="#4b5268" />
                )}
              </div>
              <span className={styles.avatarOnline} />
            </div>

            {/* Info */}
            <div className={styles.bannerInfo}>
              <div className={styles.bannerNameRow}>
                <h1 className={styles.bannerName}>{profile.fullName || "—"}</h1>
                {profile.roles.map((e) => (
                  <span className={styles.roleBadge}>{e.name}</span>
                ))}
              </div>
              <p className={styles.bannerBio}>{profile.bio || "No bio set."}</p>
              <div className={styles.bannerMeta}>
                <span>
                  <FiCalendar size={12} /> Member since {joinedDate}
                </span>
                <button
                  className={styles.metaBtn}
                  onClick={() => setShowAvatarModal(true)}
                >
                  <FiUpload size={12} /> Upload New Avatar
                </button>
                <button
                  className={styles.metaBtnDanger}
                  onClick={handleDeleteAvatar}
                  disabled={!form.avatarStaticId && !avatarPreview}
                >
                  <BsTrash3 size={12} /> Delete
                </button>
              </div>
            </div>

            {/* Balance */}
            <div className={styles.balanceCard}>
              <div className={styles.balanceLabel}>
                ACCOUNT BALANCE
                <MdOutlineAccountBalanceWallet color="#05ebd0" size={18} />
              </div>
              <div className={styles.balanceAmount}>
                {(profile.balance ?? 0).toLocaleString("vi-VN")}
                <span className={styles.balanceCurrency}>VND</span>
              </div>
              <p className={styles.balanceFuel}>
                <AiOutlineThunderbolt size={16} /> Available Fuel:{" "}
                {profile.balance ?? 0} CR
              </p>
              <button
                className={styles.topUpBtn}
                onClick={() => setShowTopUpModal(true)}
              >
                ⊕ Top Up / Add Funds
              </button>
            </div>
          </div>

          {/* ══ Publisher CTA ════════════════════════════════════ */}
          {!profile.roles.some((e) => e.name === ROLE.PUBLISHER) && (
            <div className={styles.publisherBanner}>
              <div className={styles.publisherIcon}>
                <BsRocketTakeoff size={20} />
              </div>
              <div className={styles.publisherText}>
                <h3>Become an A2MaTeX Verified Publisher</h3>
                <p>
                  Publish proprietary automation tools (.exe), obfuscate
                  binaries with hardware-bound DRM Enclave, and earn an 85%
                  creator payout revenue share with real-time telemetry.
                </p>
              </div>
              <Button
                leftIcon={<BsRocketTakeoff size={14} />}
                className={styles.publisherBtn}
                onClick={() => setShowPublisherModal(true)}
              >
                Activate Publisher Role
              </Button>
            </div>
          )}

          {/* ══ Main grid ════════════════════════════════════════ */}
          <div className={styles.mainGrid}>
            {/* ── Left col ─────────────────────────────────────── */}
            <div className={styles.leftCol}>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                  <BsPersonBadge size={16} /> Personal &amp; Contact Credentials
                </h2>

                {/* Row: fullName + email */}
                <div className={styles.formRow}>
                  <Input
                    label="FULL NAME"
                    hint="REQUIRED"
                    name="fullName"
                    value={form.fullName || ""}
                    onChange={handleChange}
                    leftIcon={<FiUser size={14} />}
                    placeholder="Your full name"
                  />
                  <Input
                    label="PRIMARY EMAIL"
                    hint={
                      <span className={styles.verifiedHint}>
                        <BsCheckCircleFill size={11} /> VERIFIED
                      </span>
                    }
                    name="email"
                    type="email"
                    value={form.email || ""}
                    onChange={handleChange}
                    leftIcon={<FiMail size={14} />}
                    placeholder="your@email.com"
                  />
                </div>

                {/* Row: phone + birthday */}
                <div className={styles.formRow}>
                  <Input
                    label="PHONE NUMBER"
                    name="phone"
                    value={form.phone || ""}
                    onChange={handleChange}
                    leftIcon={<FiPhone size={14} />}
                    placeholder="+84 000 000 000"
                  />
                  <Input
                    label="DATE OF BIRTH"
                    hint="MM-DD-YYYY"
                    name="birthday"
                    type="date"
                    value={
                      form.birthday
                        ? new Date(form.birthday).toISOString().slice(0, 10)
                        : ""
                    }
                    onChange={handleChange}
                    leftIcon={<FiCalendar size={14} />}
                  />
                </div>

                {/* Gender */}
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>GENDER IDENTITY</label>
                  <div className={styles.genderRow}>
                    {Object.values(GENDER).map((g) => (
                      <label key={g} className={styles.radioLabel}>
                        <span
                          className={`${styles.radioCircle} ${form.gender === g ? styles.radioActive : ""}`}
                          onClick={() => handleGender(g)}
                          role="radio"
                          aria-checked={form.gender === g}
                          tabIndex={0}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleGender(g)
                          }
                        />
                        {g}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Address */}
                <div className={styles.formGroup}>
                  <Input
                    label="REGISTERED ADDRESS / PHYSICAL STATION"
                    name="address"
                    value={form.address || ""}
                    onChange={handleChange}
                    leftIcon={<FiMapPin size={14} />}
                    placeholder="Street, District, City, Country"
                  />
                </div>

                {/* Bio */}
                <div className={styles.formGroup}>
                  <div className={styles.bioLabelRow}>
                    <label className={styles.fieldLabel}>
                      <FiAlignLeft size={12} /> SYSTEM OPERATOR BIO
                    </label>
                    <span className={styles.bioCount}>{bioLen} / 500</span>
                  </div>
                  <textarea
                    name="bio"
                    className={styles.textarea}
                    value={form.bio || ""}
                    onChange={handleChange}
                    maxLength={500}
                    rows={4}
                    placeholder="Short bio about yourself…"
                  />
                </div>
              </div>
            </div>

            {/* ── Right col ────────────────────────────────────── */}
            <div className={styles.rightCol}>
              {/* Socials */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                  <BsGlobe2 size={15} /> External Relays &amp; Socials
                  <span className={styles.connectedBadge}>
                    {SOCIAL_FIELDS.filter((f) => form[f.key]).length} CONNECTED
                  </span>
                </h2>
                <div className={styles.socialsGrid}>
                  {SOCIAL_FIELDS.map(({ key, label, icon }) => (
                    <div key={key} className={styles.socialRow}>
                      <span className={styles.socialLabel}>
                        {icon} {label}
                      </span>
                      <input
                        type="url"
                        name={key}
                        value={form[key] || ""}
                        onChange={handleChange}
                        className={styles.socialInput}
                        placeholder="https://"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Security */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                  <BsShieldLock size={15} /> Security &amp; Passkeys
                  <span className={styles.twoFaBadge}>● 2FA: ACTIVE</span>
                </h2>

                <form onSubmit={handlePwSubmit} className={styles.pwForm}>
                  <Input
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={handlePwChange}
                    error={pwErrors.currentPassword}
                    leftIcon={<FiLock size={14} />}
                    placeholder="Enter current password"
                  />
                  <Input
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={pwForm.newPassword}
                    onChange={handlePwChange}
                    error={pwErrors.newPassword}
                    leftIcon={<FiLock size={14} />}
                    placeholder="Min. 6 characters"
                  />
                  <Input
                    label="Confirm New Password"
                    name="confirmNewPassword"
                    type="password"
                    value={pwForm.confirmNewPassword}
                    onChange={handlePwChange}
                    error={pwErrors.confirmNewPassword}
                    leftIcon={<FiLock size={14} />}
                    placeholder="Repeat new password"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    fullWidth
                    loading={pwSaving}
                    leftIcon={<FiLock size={14} />}
                  >
                    Change Password
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* ══ Footer action bar ════════════════════════════════ */}
          <div className={styles.actionBar}>
            <span onClick={handleLogout} className={styles.syncNote}>
              <FiLogOut size={18} />
              Logout
            </span>
            <div className={styles.actionBtns}>
              <Button
                variant="ghost"
                onClick={handleDiscard}
                leftIcon={<FiRefreshCw size={14} />}
              >
                Discard Changes
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                loading={saving}
                leftIcon={<FiSave size={14} />}
              >
                Save &amp; Update Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
      {showAvatarModal && (
        <AvatarUpload
          onDone={handleAvatarDone}
          onClose={() => setShowAvatarModal(false)}
        />
      )}
      {showPublisherModal && (
        <ActivatePublisherModal
          onSuccess={() => {
            setShowPublisherModal(false);
            showToast("Publisher role activated successfully!");
            setProfile((prev) => prev.roles.push({ code: ROLE.PUBLISHER }));
          }}
          onClose={() => setShowPublisherModal(false)}
        />
      )}
      {showTopUpModal && (
        <TopUpModal
          balance={profile.balance ?? 0}
          onClose={() => setShowTopUpModal(false)}
          onTopUpSuccess={(newBalance) => {
            setProfile((prev) => ({ ...prev, balance: newBalance }));
            setShowTopUpModal(false);
            showToast(
              `Đã nạp thành công ${newBalance.toLocaleString("vi-VN")} VND vào tài khoản`,
            );
          }}
        />
      )}
    </>
  );
};

export default ProfilePage;
