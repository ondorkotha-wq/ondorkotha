"use client";

import React, { useState } from "react";
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Eye,
  Lock,
  Mail,
  Smartphone,
  MapPin,
  ChevronRight,
  Check,
  Upload,
  LogOut,
  Save,
  X,
  AlertCircle,
  EyeOff,
  Moon,
} from "lucide-react";

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface PrivacySetting {
  id: string;
  label: string;
  description: string;
  value: boolean;
}

const Settings = () => {
  const [activeSection, setActiveSection] = useState<string>("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // User profile data
  const [profile, setProfile] = useState({
    firstName: "Alex",
    lastName: "Johnson",
    email: "alex.johnson@example.com",
    phone: "+1 (555) 123-4567",
    language: "English",
    timezone: "EST (UTC-5)",
    avatar: null as string | null,
  });

  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: "email",
      label: "Email Notifications",
      description: "Receive order updates via email",
      enabled: true,
    },
    {
      id: "promo",
      label: "Promotional Emails",
      description: "Receive special offers and promotions",
      enabled: false,
    },
    {
      id: "order",
      label: "Order Updates",
      description: "Real-time order status notifications",
      enabled: true,
    },
    {
      id: "security",
      label: "Security Alerts",
      description: "Important account security notifications",
      enabled: true,
    },
    {
      id: "newsletter",
      label: "Weekly Newsletter",
      description: "Curated furniture and design tips",
      enabled: false,
    },
  ]);

  // Privacy settings
  const [privacy, setPrivacy] = useState<PrivacySetting[]>([
    {
      id: "profile",
      label: "Public Profile",
      description: "Allow others to view your profile",
      value: false,
    },
    {
      id: "activity",
      label: "Activity Visibility",
      description: "Show your recent activity",
      value: true,
    },
    {
      id: "personalized",
      label: "Personalized Ads",
      description: "Show personalized recommendations",
      value: true,
    },
    {
      id: "data",
      label: "Data Sharing",
      description: "Share anonymous usage data",
      value: false,
    },
  ]);

  // Security preferences
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: "30 minutes",
  });

  const sections: SettingsSection[] = [
    {
      id: "profile",
      title: "Profile Information",
      description: "Update your personal details",
      icon: <User className="w-5 h-5" />,
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Manage your notification preferences",
      icon: <Bell className="w-5 h-5" />,
    },
    {
      id: "privacy",
      title: "Privacy & Security",
      description: "Control your privacy settings",
      icon: <Shield className="w-5 h-5" />,
    },
    {
      id: "preferences",
      title: "Preferences",
      description: "Customize your experience",
      icon: <Globe className="w-5 h-5" />,
    },
  ];

  const handleSave = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 800);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleNotification = (id: string) => {
    setNotifications((prev) =>
      prev?.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const togglePrivacy = (id: string) => {
    setPrivacy((prev) =>
      prev?.map((item) =>
        item.id === id ? { ...item, value: !item.value } : item
      )
    );
  };

  const handleLogout = () => {
    // Handle logout logic
    console.log("Logging out...");
  };

  const ProfileSection = () => (
    <div className="space-y-6">
      {/* Avatar Upload */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-1">
              Profile Photo
            </h3>
            <p className="text-sm text-gray-500">
              Upload a new profile picture
            </p>
          </div>
          <div className="relative">
            <div className="w-16 h-16 bg-gray-100 rounded-sm flex items-center justify-center overflow-hidden">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 cursor-pointer">
              <div className="p-1.5 bg-gray-900 rounded-sm hover:bg-gray-800 transition">
                <Upload className="w-3 h-3 text-white" />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">
          Personal Information
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={profile.firstName}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, firstName: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={profile.lastName}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, lastName: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">
          Preferences
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={profile.language}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, language: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={profile.timezone}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, timezone: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            >
              <option>EST (UTC-5)</option>
              <option>PST (UTC-8)</option>
              <option>CST (UTC-6)</option>
              <option>GMT (UTC+0)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const NotificationsSection = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">
          Notification Preferences
        </h3>
        <div className="space-y-4">
          {notifications?.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
              </div>
              <button
                onClick={() => toggleNotification(item.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  item.enabled ? "bg-gray-900" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    item.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Notification Frequency
            </h3>
            <p className="text-xs text-gray-500">
              You can adjust how often you receive notifications in your device
              settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const PrivacySection = () => (
    <div className="space-y-6">
      {/* Privacy Settings */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">
          Privacy Settings
        </h3>
        <div className="space-y-4">
          {privacy?.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
              </div>
              <button
                onClick={() => togglePrivacy(item.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  item.value ? "bg-gray-900" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    item.value ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Two-Factor Authentication
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Add an extra layer of security to your account
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() =>
                setSecurity((prev) => ({
                  ...prev,
                  twoFactorEnabled: !prev.twoFactorEnabled,
                }))
              }
              className={`px-3 py-1.5 text-xs border rounded-sm transition ${
                security.twoFactorEnabled
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {security.twoFactorEnabled ? "Enabled" : "Enable"}
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Login Alerts
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Get notified of new sign-ins
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() =>
                setSecurity((prev) => ({
                  ...prev,
                  loginAlerts: !prev.loginAlerts,
                }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                security.loginAlerts ? "bg-gray-900" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  security.loginAlerts ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Session Timeout
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Automatically log out after inactivity
                  </p>
                </div>
              </div>
              <select
                value={security.sessionTimeout}
                onChange={(e) =>
                  setSecurity((prev) => ({
                    ...prev,
                    sessionTimeout: e.target.value,
                  }))
                }
                className="text-sm border border-gray-300 rounded-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              >
                <option>15 minutes</option>
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>Never</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">
          Data Management
        </h3>
        <div className="space-y-3">
          <button className="w-full text-left p-3 border border-gray-200 rounded-sm hover:bg-gray-50 transition">
            <p className="text-sm font-medium text-gray-900">
              Download Your Data
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Request a copy of your personal data
            </p>
          </button>
          <button className="w-full text-left p-3 border border-red-200 text-red-700 rounded-sm hover:bg-red-50 transition">
            <p className="text-sm font-medium">Delete Account</p>
            <p className="text-xs text-red-500 mt-1">
              Permanently delete your account and all data
            </p>
          </button>
        </div>
      </div>
    </div>
  );

  const PreferencesSection = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">
          Display Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Dark Mode</p>
              <p className="text-xs text-gray-500 mt-1">
                Use dark theme across the application
              </p>
            </div>
            <button className="px-3 py-1.5 text-xs border border-gray-300 rounded-sm hover:bg-gray-50 transition">
              Enable
            </button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                High Contrast Mode
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Increase contrast for better visibility
              </p>
            </div>
            <button
              className={`relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition`}
            >
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Reduce Motion</p>
              <p className="text-xs text-gray-500 mt-1">
                Minimize animations and transitions
              </p>
            </div>
            <button
              className={`relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition`}
            >
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Need Help?
            </h3>
            <p className="text-xs text-gray-500">
              Contact our support team if you need assistance with your account
              settings.
            </p>
            <button className="mt-2 text-sm text-gray-700 hover:text-gray-900 transition">
              Contact Support →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">
          Account Settings
        </h1>
        <p className="text-sm text-gray-500">
          Manage your account preferences and privacy settings
        </p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-sm flex items-center gap-3">
          <Check className="w-5 h-5 text-gray-700" />
          <p className="text-sm text-gray-700">Settings saved successfully</p>
          <button onClick={() => setShowSuccess(false)} className="ml-auto">
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
            {sections?.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full px-4 py-3 flex items-center gap-3 text-left transition ${
                  activeSection === section.id
                    ? "bg-gray-50 border-l-4 border-gray-900"
                    : "hover:bg-gray-50"
                }`}
              >
                <div
                  className={`${
                    activeSection === section.id
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  {section.icon}
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      activeSection === section.id
                        ? "text-gray-900"
                        : "text-gray-700"
                    }`}
                  >
                    {section.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {section.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full mt-4 px-4 py-3 border border-gray-300 rounded-sm hover:bg-gray-50 transition flex items-center gap-3 text-left"
          >
            <LogOut className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Log Out</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Sign out of your account
              </p>
            </div>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Section Content */}
          {activeSection === "profile" && <ProfileSection />}
          {activeSection === "notifications" && <NotificationsSection />}
          {activeSection === "privacy" && <PrivacySection />}
          {activeSection === "preferences" && <PreferencesSection />}

          {/* Save Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Changes will be applied to your account
              </div>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-6 py-2.5 text-sm bg-gray-900 text-white rounded-sm hover:bg-gray-800 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
