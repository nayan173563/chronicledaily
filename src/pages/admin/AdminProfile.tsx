import React, { useState, useRef } from 'react';
import { useWebsite } from '../../context/WebsiteContext';
import { api } from '../../services/api';
import { UserCircle, KeyRound, Shield, Check, AlertCircle, Phone, Mail, Upload, Eye, EyeOff, Camera, Key, Copy } from 'lucide-react';

export const AdminProfile: React.FC = () => {
  const { adminUser, updateAdminUser, toast } = useWebsite();

  // Profile details
  const [name, setName] = useState(adminUser?.name || '');
  const [email, setEmail] = useState(adminUser?.email || '');
  const [phone, setPhone] = useState(adminUser?.phone || '');
  const [avatar, setAvatar] = useState(adminUser?.avatar || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unified Credentials Settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState(adminUser?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [credSaving, setCredSaving] = useState(false);
  const [credSuccess, setCredSuccess] = useState(false);
  const [credError, setCredError] = useState<string | null>(null);

  // Password visibility states (Eye / EyeOff)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle direct file upload for Avatar
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const item = await api.uploadMedia({
            title: `avatar-${adminUser?.username || 'admin'}`,
            dataUrl: base64Data,
            type: 'image'
          });
          setAvatar(item.url);
          toast.success('Avatar image uploaded successfully!');
        } catch (uploadErr: any) {
          toast.error(uploadErr.message || 'Failed to upload avatar image');
        } finally {
          setUploadingAvatar(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(false);

    try {
      const res = await api.updateProfile({ name, email, phone, avatar });
      updateAdminUser(res.user);
      setProfileSuccess(true);
      toast.success('Admin profile updated successfully');
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      toast.error(`Profile update failed: ${err.message}`);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredError(null);
    setCredSuccess(false);

    if (!currentPassword) {
      setCredError('Current password is required to verify identity');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setCredError('New password must be at least 6 characters long');
        return;
      }
      if (newPassword !== confirmPassword) {
        setCredError('New password and Confirm New Password do not match');
        return;
      }
    }

    setCredSaving(true);
    try {
      const res = await api.changeCredentials({
        currentPassword,
        newUsername: newUsername.trim() || undefined,
        newPassword: newPassword.trim() || undefined,
      });

      updateAdminUser(res.user);
      setCredSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Security credentials updated successfully!');
      setTimeout(() => setCredSuccess(false), 3000);
    } catch (err: any) {
      setCredError(err.message || 'Credentials update failed');
    } finally {
      setCredSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-5">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Admin Profile &amp; Security Authentication
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Update admin username, secure passwords, recovery contact, and profile avatar directly from the console
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: General Editorial Profile Form */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 shadow-md space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 text-white">
            <UserCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-serif font-bold text-base">Editorial Profile</h3>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Mobile Number
              </label>
              <input
                type="text"
                placeholder="+8801700000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Avatar Image URL & Direct Upload Option */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Avatar Image URL
              </label>
              
              <div className="flex items-center gap-3 mb-2">
                {/* Circular Avatar Preview */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-700 shrink-0 flex items-center justify-center text-neutral-400 font-bold text-sm">
                  {avatar ? (
                    <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    name?.charAt(0).toUpperCase() || 'A'
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-red-500" />
                    <span>{uploadingAvatar ? 'Uploading...' : 'Upload Image File'}</span>
                  </button>
                </div>
              </div>

              {/* Direct URL Input */}
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="Or paste direct image URL (https://...)"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {profileSaving ? 'Saving...' : 'Update Profile Info'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Security & Password Change */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 shadow-md space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 text-white">
            <KeyRound className="w-5 h-5 text-amber-500" />
            <h3 className="font-serif font-bold text-base">Change Username &amp; Password</h3>
          </div>

          <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-lg text-[11px] text-neutral-300 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Direct Admin Authentication</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              To keep your portal completely secure from external reset attempts, login credentials can only be modified directly from this console. Current password verification is strictly required.
            </p>
          </div>

          {credSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Credentials updated successfully!</span>
            </div>
          )}

          {credError && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{credError}</span>
            </div>
          )}

          <form onSubmit={handleChangeCredentials} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                New Username
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Current Password with Eye Show/Hide Toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Current Password * (Required for verification)
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title={showCurrentPassword ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password with Eye Show/Hide Toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password (Always visible for matching) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Confirm New Password
                </label>
                {/* Live Password Matching Indicator */}
                {newPassword && confirmPassword && (
                  <span className={`text-[11px] font-medium flex items-center gap-1 ${newPassword === confirmPassword ? 'text-emerald-400' : 'text-red-400'}`}>
                    {newPassword === confirmPassword ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Passwords match</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Passwords do not match</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat new password to confirm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-3 pr-10 py-2 bg-neutral-900 border rounded-lg text-xs text-white focus:outline-none ${
                    confirmPassword && newPassword
                      ? newPassword === confirmPassword
                        ? 'border-emerald-500 focus:border-emerald-500'
                        : 'border-red-500 focus:border-red-500'
                      : 'border-neutral-700 focus:border-red-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={credSaving}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {credSaving ? 'Updating...' : 'Save Security Credentials'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
