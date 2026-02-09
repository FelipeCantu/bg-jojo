import React, { useState, useEffect, useRef } from "react";
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

const MySettings = () => {
  const [activeTab, setActiveTab] = useState("account");
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const dropdownRef = useRef(null);

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
  const [privacySettings, setPrivacySettings] = useState({
    showInDirectory: false,
    allowMessages: true,
    showActivity: false
  });

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

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePrivacyChange = (key) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleMobileDropdown = () => {
    setIsMobileDropdownOpen(!isMobileDropdownOpen);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileDropdownOpen(false);
  };

  const handleLogout = () => {
    console.log("User logged out");
    // Add your actual logout logic here
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

      <ContentArea $isMobileView={isMobileView}>
        {activeTab === "account" && (
          <AccountSettings>
            <SectionTitle>Account Information</SectionTitle>
            <FormGroup>
              <Label>Name</Label>
              <Input type="text" defaultValue="John Doe" />
            </FormGroup>
            <FormGroup>
              <Label>Email</Label>
              <Input type="email" defaultValue="john@example.com" />
            </FormGroup>
            <FormGroup>
              <Label>Phone Number</Label>
              <Input type="tel" defaultValue="+1 (555) 123-4567" />
            </FormGroup>
            <FormGroup>
              <Label>Emergency Contact</Label>
              <Input type="text" placeholder="Add emergency contact" />
            </FormGroup>
            <SaveButton>Save Changes</SaveButton>
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
                <ActionButton>Change</ActionButton>
              </SecurityOption>
              <SecurityOption>
                <span>Two-Factor Authentication</span>
                <ActionButton>Enable</ActionButton>
              </SecurityOption>
            </PrivacySection>

            <DangerZone>
              <DangerTitle>Danger Zone</DangerTitle>
              <DangerOption>
                <span>Deactivate Account</span>
                <DangerButton>Deactivate</DangerButton>
              </DangerOption>
              <DangerOption>
                <span>Delete Account</span>
                <DangerButton>Delete</DangerButton>
              </DangerOption>
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
                  onClick={() => setTheme("light")}
                >
                  Light
                </ThemeOption>
                <ThemeOption
                  active={theme === "dark"}
                  onClick={() => setTheme("dark")}
                >
                  Dark
                </ThemeOption>
                <ThemeOption
                  active={theme === "system"}
                  onClick={() => setTheme("system")}
                >
                  System
                </ThemeOption>
              </ThemeOptions>
            </ThemeSection>

            <ColorSection>
              <ColorTitle>Accent Color</ColorTitle>
              <ColorOptions>
                <ColorSwatch color="#024a47" active />
                <ColorSwatch color="#4a6bdf" />
                <ColorSwatch color="#d45d79" />
                <ColorSwatch color="#5cb85c" />
                <ColorSwatch color="#f0ad4e" />
              </ColorOptions>
            </ColorSection>
          </AppearanceSettings>
        )}

        {activeTab === "help" && (
          <HelpSettings>
            <SectionTitle>Help & Support</SectionTitle>

            <HelpSection>
              <HelpTitle>Resources</HelpTitle>
              <HelpLink href="#">Help Center</HelpLink>
              <HelpLink href="#">Community Guidelines</HelpLink>
              <HelpLink href="#">Safety Tips</HelpLink>
            </HelpSection>

            <HelpSection>
              <HelpTitle>Emergency Contact</HelpTitle>
              <EmergencyContact>
                National Suicide Prevention Lifeline: 1-800-273-TALK (8255)
              </EmergencyContact>
              <SupportButton>Email Support</SupportButton>
              <SupportButton>Live Chat</SupportButton>
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
  max-width: 100%;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  min-height: 500px;
  position: relative;

  @media (min-width: 768px) {
    flex-direction: row;
    max-width: 1000px;
  }
`;

const MobileHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 15px;
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
  padding: 8px 12px;
  border-radius: 5px;
  transition: background-color 0.2s;

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
  }

  .dropdown-chevron {
    transition: transform 0.2s;
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
  border-radius: 0 0 5px 5px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 100;
  max-height: ${props => props.$isOpen ? '400px' : '0'};
  transition: max-height 0.3s ease, opacity 0.2s ease;
  opacity: ${props => props.$isOpen ? '1' : '0'};
`;

const DropdownItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 15px;
  color: #555;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.95rem;

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
  transition: all 0.2s;
  text-align: left;
  border-left: 3px solid ${props => props.active ? 'var(--secondary-color)' : 'transparent'};

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
  padding: ${props => props.$isMobileView ? '20px 15px' : '30px'};
  overflow-y: auto;
  
  @media (min-width: 768px) {
    padding: 30px;
    max-height: 600px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: var(--secondary-color);
  margin-bottom: 25px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;

  @media (max-width: 768px) {
    font-size: 1.3rem;
    margin-bottom: 20px;
  }
`;

const AccountSettings = styled.div``;

const FormGroup = styled.div`
  margin-bottom: 20px;
  max-width: 500px;

  @media (max-width: 768px) {
    margin-bottom: 15px;
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

  @media (max-width: 768px) {
    padding: 8px 10px;
    font-size: 0.9rem;
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
  transition: background 0.2s;
  margin-top: 10px;

  &:hover {
    background-color: var(--secondary-color-dark);
  }

  @media (max-width: 768px) {
    padding: 8px 16px;
    font-size: 0.9rem;
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
    font-size: 1.1rem;
    margin-bottom: 10px;
  }
`;

const ToggleOption = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;

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
    padding: 8px 0;
  }
`;

const ToggleSwitch = styled.input.attrs({ type: 'checkbox' })`
  position: relative;
  width: 40px;
  height: 20px;
  appearance: none;
  background: #ddd;
  border-radius: 10px;
  transition: all 0.3s;
  cursor: pointer;
  flex-shrink: 0;

  &:checked {
    background: var(--secondary-color);
  }

  &::before {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    top: 2px;
    left: 2px;
    transition: all 0.3s;
  }

  &:checked::before {
    left: calc(100% - 18px);
  }

  @media (max-width: 768px) {
    width: 36px;
    height: 18px;

    &::before {
      width: 14px;
      height: 14px;
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

const SecurityOption = styled(ToggleOption)``;

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
  padding: 15px;
  border-radius: 5px;
  background-color: #fff5f5;
  border: 1px solid #ffd6d6;

  @media (max-width: 768px) {
    margin-top: 20px;
    padding: 12px;
  }
`;

const DangerTitle = styled.h3`
  font-size: 1.2rem;
  color: #d45d79;
  margin-bottom: 15px;

  @media (max-width: 768px) {
    font-size: 1.1rem;
    margin-bottom: 12px;
  }
`;

const DangerOption = styled(ToggleOption)`
  border-bottom: 1px solid #ffebeb;
`;

const DangerButton = styled(ActionButton)`
  background-color: #fff5f5;
  color: #d45d79;
  border-color: #d45d79;

  &:hover {
    background-color: #d45d79;
    color: white;
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
  color: ${props => props.active ? '#024a47' : '#555'};
  border: 1px solid ${props => props.active ? '#024a47' : '#ddd'};
  font-weight: ${props => props.active ? '600' : 'normal'};
  transition: all 0.2s;
  font-size: 0.9rem;

  &:hover {
    background-color: #f0f7f7;
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 0.85rem;
  }
`;

const ColorSection = styled(ThemeSection)``;

const ColorTitle = styled(ThemeTitle)``;

const ColorOptions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
`;

const ColorSwatch = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: ${props => props.color};
  cursor: pointer;
  border: 2px solid ${props => props.active ? '#024a47' : 'transparent'};
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
  }
`;

const HelpSettings = styled.div``;

const HelpSection = styled(ThemeSection)``;

const HelpTitle = styled(ThemeTitle)``;

const HelpLink = styled.a`
  display: block;
  color: #024a47;
  margin-bottom: 8px;
  text-decoration: none;
  font-size: 0.95rem;
  transition: color 0.2s;

  &:hover {
    color: #013634;
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const EmergencyContact = styled.div`
  background-color: #f0f7f7;
  padding: 12px;
  border-radius: 5px;
  margin: 12px 0;
  color: #024a47;
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

  @media (max-width: 768px) {
    margin-right: 8px;
    margin-top: 8px;
  }
`;

export default MySettings;