import React, { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import {
  FaUser,
  FaBell,
  FaLock,
  FaPalette,
  FaQuestionCircle,
  FaBars,
  FaChevronDown,
  FaSignOutAlt
} from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { updateUserSettings, getUserSettings } from "../../firebaseconfig";
import { resetPassword } from "../../services/authService";
import { getAuth, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, deleteDoc, getFirestore } from "firebase/firestore";

const ACCENT_COLORS = [
  { value: "#024a47", label: "Teal" },
  { value: "#4a6bdf", label: "Blue" },
  { value: "#d45d79", label: "Rose" },
  { value: "#5cb85c", label: "Green" },
  { value: "#f0ad4e", label: "Amber" }
];

const applyTheme = (theme) => {
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
};

const applyAccentColor = (color) => {
  document.documentElement.style.setProperty("--secondary-color", color);
  // Generate a slightly darker variant
  const darker = color.replace(/^#/, "");
  const r = Math.max(0, parseInt(darker.slice(0, 2), 16) - 25);
  const g = Math.max(0, parseInt(darker.slice(2, 4), 16) - 25);
  const b = Math.max(0, parseInt(darker.slice(4, 6), 16) - 25);
  const darkColor = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  document.documentElement.style.setProperty("--secondary-color-dark", darkColor);
};

const MySettings = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const dropdownRef = useRef(null);

  // Account fields
  const [accountInfo, setAccountInfo] = useState({
    name: "",
    email: "",
    phone: "",
    emergencyContact: ""
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    newArticles: true,
    productUpdates: false,
    supportMessages: true,
    emergencyAlerts: true
  });

  const [theme, setTheme] = useState("light");
  const [accentColor, setAccentColor] = useState("#024a47");
  const [privacySettings, setPrivacySettings] = useState({
    showInDirectory: false,
    allowMessages: true,
    showActivity: false
  });

  // Load settings from Firestore on mount
  useEffect(() => {
    if (!currentUser?.uid) return;

    const loadSettings = async () => {
      const data = await getUserSettings(currentUser.uid);
      if (data) {
        if (data.accountInfo) {
          setAccountInfo(prev => ({ ...prev, ...data.accountInfo }));
        } else {
          // Populate from Firebase Auth profile
          setAccountInfo(prev => ({
            ...prev,
            name: currentUser.displayName || "",
            email: currentUser.email || ""
          }));
        }
        if (data.notificationPrefs) {
          setNotifications(prev => ({ ...prev, ...data.notificationPrefs }));
        }
        if (data.privacySettings) {
          setPrivacySettings(prev => ({ ...prev, ...data.privacySettings }));
        }
        if (data.appearance?.theme) {
          setTheme(data.appearance.theme);
          applyTheme(data.appearance.theme);
        }
        if (data.appearance?.accentColor) {
          setAccentColor(data.appearance.accentColor);
          applyAccentColor(data.appearance.accentColor);
        }
      } else {
        // No saved settings — populate from auth profile
        setAccountInfo(prev => ({
          ...prev,
          name: currentUser.displayName || "",
          email: currentUser.email || ""
        }));
      }
      setSettingsLoaded(true);
    };

    loadSettings();
  }, [currentUser]);

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileDropdownOpen(false);
      }
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMobileDropdownOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const saveToFirestore = useCallback(async (fields) => {
    if (!currentUser?.uid) return;
    try {
      await updateUserSettings(currentUser.uid, fields);
    } catch {
      toast.error("Failed to save settings");
    }
  }, [currentUser]);

  const handleNotificationChange = async (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    try {
      await updateUserSettings(currentUser.uid, { notificationPrefs: updated });
      toast.success("Notification preference updated");
    } catch {
      setNotifications(notifications);
      toast.error("Failed to update notification preference");
    }
  };

  const handlePrivacyChange = async (key) => {
    const updated = { ...privacySettings, [key]: !privacySettings[key] };
    setPrivacySettings(updated);
    try {
      await updateUserSettings(currentUser.uid, { privacySettings: updated });
      toast.success("Privacy setting updated");
    } catch {
      setPrivacySettings(privacySettings);
      toast.error("Failed to update privacy setting");
    }
  };

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    await saveToFirestore({ appearance: { theme: newTheme, accentColor } });
  };

  const handleAccentColorChange = async (color) => {
    setAccentColor(color);
    applyAccentColor(color);
    await saveToFirestore({ appearance: { theme, accentColor: color } });
  };

  const toggleMobileDropdown = () => {
    setIsMobileDropdownOpen(!isMobileDropdownOpen);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileDropdownOpen(false);
  };

  const handleSaveAccount = async () => {
    if (!currentUser?.uid) return;
    setSaving(true);
    try {
      await updateUserSettings(currentUser.uid, { accountInfo });
      toast.success("Account info saved");
    } catch {
      toast.error("Failed to save account info");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser?.email) {
      toast.error("No email associated with this account");
      return;
    }
    try {
      const result = await resetPassword(currentUser.email);
      if (result.success) {
        toast.success("Password reset email sent. Check your inbox.");
      } else {
        toast.error(result.error || "Failed to send password reset email");
      }
    } catch {
      toast.error("Failed to send password reset email");
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setDeleting(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      // Re-authenticate if password provider
      if (currentUser.providerData?.[0]?.providerId === "password") {
        if (!deletePassword) {
          toast.error("Please enter your password to confirm");
          setDeleting(false);
          return;
        }
        const credential = EmailAuthProvider.credential(currentUser.email, deletePassword);
        await reauthenticateWithCredential(user, credential);
      }

      // Delete user doc from Firestore
      const db = getFirestore();
      await deleteDoc(doc(db, "users", currentUser.uid));

      // Delete Firebase Auth account
      await deleteUser(user);
      toast.success("Account deleted successfully");
    } catch (err) {
      if (err.code === "auth/wrong-password") {
        toast.error("Incorrect password");
      } else if (err.code === "auth/requires-recent-login") {
        toast.error("Please log out and log back in, then try again");
      } else {
        toast.error("Failed to delete account");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch {
      toast.error("Failed to log out");
    }
  };

  return (
    <SettingsContainer>
      {/* Mobile Header with Dropdown */}
      {isMobileView && (
        <MobileHeader>
          <MobileDropdown ref={dropdownRef}>
            <MobileMenuButton onClick={toggleMobileDropdown}>
              <FaBars />
              <span>
                {activeTab === "account" && "Account"}
                {activeTab === "notifications" && "Notifications"}
                {activeTab === "privacy" && "Privacy"}
                {activeTab === "appearance" && "Appearance"}
                {activeTab === "help" && "Help"}
              </span>
              <FaChevronDown className={`dropdown-chevron ${isMobileDropdownOpen ? 'open' : ''}`} />
            </MobileMenuButton>

            <DropdownMenu $isOpen={isMobileDropdownOpen}>
              <DropdownItem onClick={() => handleTabChange("account")}>
                <FaUser /> Account
              </DropdownItem>
              <DropdownItem onClick={() => handleTabChange("notifications")}>
                <FaBell /> Notifications
              </DropdownItem>
              <DropdownItem onClick={() => handleTabChange("privacy")}>
                <FaLock /> Privacy
              </DropdownItem>
              <DropdownItem onClick={() => handleTabChange("appearance")}>
                <FaPalette /> Appearance
              </DropdownItem>
              <DropdownItem onClick={() => handleTabChange("help")}>
                <FaQuestionCircle /> Help
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem onClick={handleLogout} className="logout">
                <FaSignOutAlt /> Log Out
              </DropdownItem>
            </DropdownMenu>
          </MobileDropdown>
        </MobileHeader>
      )}

      {/* Desktop Sidebar */}
      {!isMobileView && (
        <SidebarTabs>
          <TabButton
            active={activeTab === "account"}
            onClick={() => handleTabChange("account")}
          >
            <FaUser /> <span>Account</span>
          </TabButton>
          <TabButton
            active={activeTab === "notifications"}
            onClick={() => handleTabChange("notifications")}
          >
            <FaBell /> <span>Notifications</span>
          </TabButton>
          <TabButton
            active={activeTab === "privacy"}
            onClick={() => handleTabChange("privacy")}
          >
            <FaLock /> <span>Privacy</span>
          </TabButton>
          <TabButton
            active={activeTab === "appearance"}
            onClick={() => handleTabChange("appearance")}
          >
            <FaPalette /> <span>Appearance</span>
          </TabButton>
          <TabButton
            active={activeTab === "help"}
            onClick={() => handleTabChange("help")}
          >
            <FaQuestionCircle /> <span>Help</span>
          </TabButton>
          <LogoutButton onClick={handleLogout}>
            <FaSignOutAlt /> <span>Log Out</span>
          </LogoutButton>
        </SidebarTabs>
      )}

      <ContentArea>
        {activeTab === "account" && (
          <AccountSettings>
            <SectionTitle>Account Information</SectionTitle>
            {!settingsLoaded ? (
              <HelpText>Loading...</HelpText>
            ) : (
              <>
                <FormGroup>
                  <Label>Name</Label>
                  <Input
                    type="text"
                    value={accountInfo.name}
                    onChange={(e) => setAccountInfo(prev => ({ ...prev, name: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={accountInfo.email}
                    onChange={(e) => setAccountInfo(prev => ({ ...prev, email: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    value={accountInfo.phone}
                    onChange={(e) => setAccountInfo(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Emergency Contact</Label>
                  <Input
                    type="text"
                    value={accountInfo.emergencyContact}
                    placeholder="Add emergency contact"
                    onChange={(e) => setAccountInfo(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  />
                </FormGroup>
                <SaveButton onClick={handleSaveAccount} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </SaveButton>
              </>
            )}
          </AccountSettings>
        )}

        {activeTab === "notifications" && (
          <NotificationSettings>
            <SectionTitle>Notification Preferences</SectionTitle>

            <NotificationSection>
              <NotificationTitle>Notification Methods</NotificationTitle>
              <ToggleOption>
                <span>Email Notifications</span>
                <ToggleSwitch
                  checked={notifications.email}
                  onChange={() => handleNotificationChange("email")}
                />
              </ToggleOption>
              <ToggleOption>
                <span>SMS Notifications</span>
                <ToggleSwitch
                  checked={notifications.sms}
                  onChange={() => handleNotificationChange("sms")}
                />
              </ToggleOption>
              <ToggleOption>
                <span>Push Notifications</span>
                <ToggleSwitch
                  checked={notifications.push}
                  onChange={() => handleNotificationChange("push")}
                />
              </ToggleOption>
            </NotificationSection>

            <NotificationSection>
              <NotificationTitle>Content Notifications</NotificationTitle>
              <ToggleOption>
                <span>New Articles</span>
                <ToggleSwitch
                  checked={notifications.newArticles}
                  onChange={() => handleNotificationChange("newArticles")}
                />
              </ToggleOption>
              <ToggleOption>
                <span>Product Updates</span>
                <ToggleSwitch
                  checked={notifications.productUpdates}
                  onChange={() => handleNotificationChange("productUpdates")}
                />
              </ToggleOption>
            </NotificationSection>

            <NotificationSection>
              <NotificationTitle>Support Notifications</NotificationTitle>
              <ToggleOption>
                <span>Support Messages</span>
                <ToggleSwitch
                  checked={notifications.supportMessages}
                  onChange={() => handleNotificationChange("supportMessages")}
                />
              </ToggleOption>
              <ToggleOption>
                <span>Emergency Alerts</span>
                <ToggleSwitch
                  checked={notifications.emergencyAlerts}
                  onChange={() => handleNotificationChange("emergencyAlerts")}
                />
              </ToggleOption>
              <HelpText>
                Emergency alerts will always be delivered regardless of other notification settings.
              </HelpText>
            </NotificationSection>
          </NotificationSettings>
        )}

        {activeTab === "privacy" && (
          <PrivacySettings>
            <SectionTitle>Privacy & Security</SectionTitle>

            <PrivacySection>
              <PrivacyTitle>Privacy Settings</PrivacyTitle>
              <ToggleOption>
                <span>Show my profile in community directory</span>
                <ToggleSwitch
                  checked={privacySettings.showInDirectory}
                  onChange={() => handlePrivacyChange("showInDirectory")}
                />
              </ToggleOption>
              <ToggleOption>
                <span>Allow direct messages from other users</span>
                <ToggleSwitch
                  checked={privacySettings.allowMessages}
                  onChange={() => handlePrivacyChange("allowMessages")}
                />
              </ToggleOption>
              <ToggleOption>
                <span>Show my activity status</span>
                <ToggleSwitch
                  checked={privacySettings.showActivity}
                  onChange={() => handlePrivacyChange("showActivity")}
                />
              </ToggleOption>
            </PrivacySection>

            <PrivacySection>
              <PrivacyTitle>Security</PrivacyTitle>
              <SecurityOption>
                <span>Change Password</span>
                <ActionButton onClick={handleChangePassword}>
                  Send Reset Email
                </ActionButton>
              </SecurityOption>
            </PrivacySection>

            <DangerZone>
              <DangerTitle>Deleting Account</DangerTitle>
              {!showDeleteConfirm ? (
                <DangerOption>
                  <div>
                    <span>Delete Account</span>
                    <DangerHelpText>Permanently delete your account and all data. This cannot be undone.</DangerHelpText>
                  </div>
                  <DangerButton onClick={() => setShowDeleteConfirm(true)}>
                    Delete
                  </DangerButton>
                </DangerOption>
              ) : (
                <DeleteConfirmBox>
                  <DangerHelpText style={{ marginBottom: "12px", fontWeight: 500, color: "#d45d79" }}>
                    Are you sure? This action is permanent and cannot be undone.
                  </DangerHelpText>
                  {currentUser?.providerData?.[0]?.providerId === "password" && (
                    <FormGroup style={{ maxWidth: "100%" }}>
                      <Label>Enter your password to confirm</Label>
                      <Input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Your password"
                      />
                    </FormGroup>
                  )}
                  <DeleteConfirmActions>
                    <ActionButton onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); }}>
                      Cancel
                    </ActionButton>
                    <DangerButton onClick={handleDeleteAccount} disabled={deleting}>
                      {deleting ? "Deleting..." : "Yes, Delete My Account"}
                    </DangerButton>
                  </DeleteConfirmActions>
                </DeleteConfirmBox>
              )}
            </DangerZone>
          </PrivacySettings>
        )}

        {activeTab === "appearance" && (
          <AppearanceSettings>
            <SectionTitle>Appearance</SectionTitle>

            <ThemeSection>
              <ThemeTitle>Theme</ThemeTitle>
              <ThemeOptions>
                <ThemeOption
                  active={theme === "light"}
                  onClick={() => handleThemeChange("light")}
                >
                  Light
                </ThemeOption>
                <ThemeOption
                  active={theme === "dark"}
                  onClick={() => handleThemeChange("dark")}
                >
                  Dark
                </ThemeOption>
                <ThemeOption
                  active={theme === "system"}
                  onClick={() => handleThemeChange("system")}
                >
                  System
                </ThemeOption>
              </ThemeOptions>
            </ThemeSection>

            <ColorSection>
              <ColorTitle>Accent Color</ColorTitle>
              <ColorOptions>
                {ACCENT_COLORS.map((c) => (
                  <ColorSwatch
                    key={c.value}
                    color={c.value}
                    $active={accentColor === c.value}
                    onClick={() => handleAccentColorChange(c.value)}
                    title={c.label}
                  />
                ))}
              </ColorOptions>
            </ColorSection>
          </AppearanceSettings>
        )}

        {activeTab === "help" && (
          <HelpSettings>
            <SectionTitle>Help & Support</SectionTitle>

            <HelpSection>
              <HelpTitle>Resources</HelpTitle>
              <HelpLink href="/about">About Us</HelpLink>
              <HelpLink href="/hotlines">Hotlines & Resources</HelpLink>
              <HelpLink href="/privacy">Privacy Policy</HelpLink>
            </HelpSection>

            <HelpSection>
              <HelpTitle>Contact Us</HelpTitle>
              <SupportButton as="a" href="mailto:support@bgjojo.com">Email Support</SupportButton>
            </HelpSection>
          </HelpSettings>
        )}
      </ContentArea>
    </SettingsContainer>
  );
};

// Styled Components
const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: #fff;
  overflow: hidden;
  position: relative;

  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const MobileHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: var(--secondary-color);
  color: white;
  position: relative;
  z-index: 10;

  @media (min-width: 768px) {
    display: none;
  }
`;

const MobileDropdown = styled.div`
  position: relative;
  width: 100%;
`;

const MobileMenuButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  width: 100%;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 5px;
  transition: background-color 0.2s;
  min-height: 44px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  svg:first-child {
    margin-right: 10px;
    font-size: 1.2rem;
  }

  span {
    flex-grow: 1;
    text-align: left;
    font-weight: 500;
    font-size: 1.05rem;
  }

  .dropdown-chevron {
    transition: transform 0.3s ease;
    margin-left: 10px;

    &.open {
      transform: rotate(180deg);
    }
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: white;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 100;
  max-height: ${props => props.$isOpen ? '400px' : '0'};
  transition: max-height 0.3s ease, opacity 0.2s ease;
  opacity: ${props => props.$isOpen ? '1' : '0'};
  pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
`;

const DropdownItem = styled.div`
  display: flex;
  align-items: center;
  padding: 14px 16px;
  color: #555;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.95rem;
  min-height: 44px;

  &:hover {
    background-color: #f0f7f7;
  }

  svg {
    margin-right: 10px;
    color: var(--secondary-color);
  }

  &.logout {
    color: #d45d79;

    svg {
      color: #d45d79;
    }

    &:hover {
      background-color: #fdf0f3;
    }
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background-color: #eee;
  margin: 5px 0;
`;

const SidebarTabs = styled.div`
  width: 200px;
  background-color: #f8f9fa;
  border-right: 1px solid #eee;
  padding: 20px 0;
  display: flex;
  flex-direction: column;

  @media (max-width: 767px) {
    display: none;
  }
`;

const TabButton = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 20px;
  border: none;
  background: ${props => props.active ? '#e3f2fd' : 'transparent'};
  color: ${props => props.active ? 'var(--secondary-color)' : 'var(--text-light)'};
  font-weight: ${props => props.active ? '600' : 'normal'};
  cursor: pointer;
  transition: background-color 0.25s ease, color 0.25s ease, font-weight 0.25s ease;
  text-align: left;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 4px;
    top: 50%;
    transform: translateY(-50%) scaleY(${props => props.active ? '1' : '0'});
    width: 3px;
    height: 60%;
    border-radius: 3px;
    background-color: var(--secondary-color);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
    opacity: ${props => props.active ? '1' : '0'};
  }

  &:hover {
    background-color: #e3f2fd;
  }

  svg {
    margin-right: 10px;
    font-size: 1rem;
    min-width: 20px;
  }
`;

const LogoutButton = styled(TabButton)`
  margin-top: auto;
  color: #d45d79;

  &:hover {
    background-color: #fdf0f3;
  }

  svg {
    color: #d45d79;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  min-height: 0;

  @media (min-width: 768px) {
    padding: 30px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: var(--secondary-color);
  margin-bottom: 25px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;

  @media (max-width: 768px) {
    font-size: 1.2rem;
    margin-bottom: 16px;
    padding-bottom: 8px;
  }
`;

const AccountSettings = styled.div``;

const FormGroup = styled.div`
  margin-bottom: 20px;
  max-width: 500px;

  @media (max-width: 768px) {
    margin-bottom: 15px;
    max-width: 100%;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  transition: border 0.2s;

  &:focus {
    border-color: var(--secondary-color);
    outline: none;
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 10px 12px;
    font-size: 0.95rem;
  }
`;

const SaveButton = styled.button`
  background-color: var(--secondary-color);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
  margin-top: 10px;

  &:hover:not(:disabled) {
    background-color: var(--secondary-color-dark);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 12px 16px;
    font-size: 0.95rem;
    width: 100%;
  }
`;

const NotificationSettings = styled.div``;

const NotificationSection = styled.div`
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;

  @media (max-width: 768px) {
    margin-bottom: 20px;
    padding-bottom: 10px;
  }
`;

const NotificationTitle = styled.h3`
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 15px;

  @media (max-width: 768px) {
    font-size: 1.05rem;
    margin-bottom: 10px;
  }
`;

const ToggleOption = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  min-height: 44px;

  span {
    font-size: 0.95rem;
    color: #555;
    flex: 1;
    padding-right: 10px;

    @media (max-width: 768px) {
      font-size: 0.9rem;
    }
  }

  @media (max-width: 768px) {
    padding: 10px 0;
  }
`;

const ToggleSwitch = styled.input.attrs({ type: 'checkbox' })`
  position: relative;
  width: 44px;
  height: 22px;
  appearance: none;
  background: #ddd;
  border-radius: 11px;
  transition: all 0.3s;
  cursor: pointer;
  flex-shrink: 0;

  &:checked {
    background: var(--secondary-color);
  }

  &::before {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    top: 2px;
    left: 2px;
    transition: all 0.3s;
  }

  &:checked::before {
    left: calc(100% - 20px);
  }

  @media (max-width: 768px) {
    width: 40px;
    height: 20px;

    &::before {
      width: 16px;
      height: 16px;
    }

    &:checked::before {
      left: calc(100% - 18px);
    }
  }
`;

const HelpText = styled.p`
  font-size: 0.85rem;
  color: #777;
  margin-top: 10px;
  font-style: italic;

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const PrivacySettings = styled.div``;

const PrivacySection = styled(NotificationSection)``;

const PrivacyTitle = styled(NotificationTitle)``;

const SecurityOption = styled(ToggleOption)`
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
`;

const ActionButton = styled.button`
  background-color: #f0f7f7;
  color: var(--secondary-color);
  padding: 6px 12px;
  border: 1px solid var(--secondary-color);
  border-radius: 5px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background-color: var(--secondary-color);
    color: white;
  }

  @media (max-width: 768px) {
    padding: 5px 10px;
    font-size: 0.85rem;
  }
`;

const DangerZone = styled.div`
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;

  @media (max-width: 768px) {
    margin-top: 20px;
    padding-top: 16px;
  }
`;

const DangerTitle = styled.h3`
  font-size: 1rem;
  color: #999;
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 0.9rem;
    margin-bottom: 12px;
  }
`;

const DangerOption = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;

  & > div {
    flex: 1;
    padding-right: 10px;

    span {
      font-size: 0.95rem;
      color: #555;
    }
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
`;

const DangerHelpText = styled.p`
  font-size: 0.8rem;
  color: #999;
  margin-top: 2px;
`;

const DangerButton = styled.button`
  background-color: transparent;
  color: #d45d79;
  padding: 6px 12px;
  border: 1px solid #e0a0a0;
  border-radius: 5px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background-color: #d45d79;
    color: white;
    border-color: #d45d79;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DeleteConfirmBox = styled.div`
  padding: 16px 0;
`;

const DeleteConfirmActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 12px;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const AppearanceSettings = styled.div``;

const ThemeSection = styled.div`
  margin-bottom: 25px;

  @media (max-width: 768px) {
    margin-bottom: 20px;
  }
`;

const ThemeTitle = styled(NotificationTitle)``;

const ThemeOptions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
`;

const ThemeOption = styled.div`
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  background-color: ${props => props.active ? '#f0f7f7' : '#f5f5f5'};
  color: ${props => props.active ? 'var(--secondary-color)' : '#555'};
  border: 1px solid ${props => props.active ? 'var(--secondary-color)' : '#ddd'};
  font-weight: ${props => props.active ? '600' : 'normal'};
  transition: all 0.2s;
  font-size: 0.9rem;
  min-height: 44px;
  display: flex;
  align-items: center;

  &:hover {
    background-color: #f0f7f7;
  }

  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 0.9rem;
  }
`;

const ColorSection = styled(ThemeSection)``;

const ColorTitle = styled(ThemeTitle)``;

const ColorOptions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 10px;
  flex-wrap: wrap;
`;

const ColorSwatch = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background-color: ${props => props.color};
  cursor: pointer;
  border: 3px solid ${props => props.$active ? '#333' : 'transparent'};
  box-shadow: ${props => props.$active ? '0 0 0 2px #fff, 0 0 0 4px ' + props.color : '0 2px 5px rgba(0, 0, 0, 0.1)'};
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: scale(1.15);
  }

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
  }
`;

const HelpSettings = styled.div``;

const HelpSection = styled(ThemeSection)``;

const HelpTitle = styled(ThemeTitle)``;

const HelpLink = styled.a`
  display: block;
  color: var(--secondary-color);
  margin-bottom: 8px;
  text-decoration: none;
  font-size: 0.95rem;
  transition: color 0.2s;

  &:hover {
    color: var(--secondary-color-dark);
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    font-size: 0.9rem;
    padding: 4px 0;
  }
`;

const EmergencyContact = styled.div`
  background-color: #f0f7f7;
  padding: 12px;
  border-radius: 5px;
  margin: 12px 0;
  color: var(--secondary-color);
  font-weight: 500;
  font-size: 0.9rem;

  @media (max-width: 768px) {
    padding: 10px;
    font-size: 0.85rem;
  }
`;

const SupportButton = styled(ActionButton)`
  margin-right: 10px;
  margin-top: 10px;

  @media (max-width: 480px) {
    width: 100%;
    margin-right: 0;
    margin-top: 8px;
    text-align: center;
  }
`;

export default MySettings;
