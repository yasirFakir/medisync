import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Avatar } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Save,
  CheckCircle,
  Camera,
  MapPin,
  Calendar,
  Heart,
  AlertCircle,
  Briefcase,
  GraduationCap,
  DollarSign,
  Building,
  FileText,
  Clock,
  Loader2,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const ProfilePage: React.FC = () => {
  const { user, token, setAuth } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Common Profile Fields
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [address, setAddress] = useState(user?.address || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ? user.dateOfBirth.substring(0, 10) : '');
  const [gender, setGender] = useState(user?.gender || '');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || '');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  // Doctor Specific Fields
  const [designation, setDesignation] = useState(user?.designation || '');
  const [specialty, setSpecialty] = useState(user?.specialty || '');
  const [degrees, setDegrees] = useState(user?.degrees || '');
  const [area, setArea] = useState(user?.area || '');
  const [city, setCity] = useState(user?.city || '');
  const [experienceYears, setExperienceYears] = useState<number | string>(user?.experienceYears ?? '');
  const [consultationFee, setConsultationFee] = useState<number | string>(user?.consultationFee ?? '');
  const [bio, setBio] = useState(user?.bio || '');

  // Pharmacy Specific Fields
  const [storeName, setStoreName] = useState(user?.storeName || '');
  const [streetAddress, setStreetAddress] = useState(user?.streetAddress || '');
  const [pharmacyCity, setPharmacyCity] = useState(user?.pharmacyCity || '');

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Fetch full profile from /api/users/me on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/users/me');
        if (res.data?.data) {
          const u = res.data.data;
          setFullName(u.fullName || '');
          setPhoneNumber(u.phoneNumber || '');
          setAddress(u.address || '');
          setDateOfBirth(u.dateOfBirth ? u.dateOfBirth.substring(0, 10) : '');
          setGender(u.gender || '');
          setBloodGroup(u.bloodGroup || '');
          setEmergencyContact(u.emergencyContact || '');
          setAvatarUrl(u.avatarUrl || '');

          setDesignation(u.designation || '');
          setSpecialty(u.specialty || '');
          setDegrees(u.degrees || '');
          setArea(u.area || '');
          setCity(u.city || '');
          setExperienceYears(u.experienceYears ?? '');
          setConsultationFee(u.consultationFee ?? '');
          setBio(u.bio || '');

          setStoreName(u.storeName || '');
          setStreetAddress(u.streetAddress || '');
          setPharmacyCity(u.pharmacyCity || '');

          if (token) {
            setAuth({ ...user, ...u }, token);
          }
        }
      } catch (err) {
        console.error('Failed to sync profile coordinates:', err);
      }
    };
    fetchProfile();
  }, []);

  // Handle avatar file selection & upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file must be smaller than 5MB.');
      return;
    }

    setUploadingImage(true);
    setError('');
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await apiClient.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newAvatarUrl = res.data.data.avatarUrl;
      setAvatarUrl(newAvatarUrl);

      if (user && token) {
        const updatedUser = { ...user, avatarUrl: newAvatarUrl };
        setAuth(updatedUser, token);
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setLoading(true);
    try {
      await apiClient.patch('/users/me', { avatarUrl: '' });
      setAvatarUrl('');
      if (user && token) {
        setAuth({ ...user, avatarUrl: null }, token);
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove picture.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) return;

    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      const payload: any = {
        fullName,
        phoneNumber: phoneNumber || null,
        address: address || null,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        bloodGroup: bloodGroup || null,
        emergencyContact: emergencyContact || null,
      };

      if (user?.role === 'DOCTOR') {
        payload.designation = designation || null;
        payload.specialty = specialty || null;
        payload.degrees = degrees || null;
        payload.area = area || null;
        payload.city = city || null;
        payload.experienceYears = experienceYears !== '' ? Number(experienceYears) : null;
        payload.consultationFee = consultationFee !== '' ? Number(consultationFee) : null;
        payload.bio = bio || null;
      } else if (user?.role === 'PHARMACY') {
        payload.storeName = storeName || null;
        payload.streetAddress = streetAddress || null;
        payload.pharmacyCity = pharmacyCity || null;
      }

      const res = await apiClient.patch('/users/me', payload);
      const updatedUser = res.data.data;
      if (token) {
        setAuth({ ...user, ...updatedUser }, token);
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile information.');
    } finally {
      setLoading(false);
    }
  };

  const roleBadgeColor = () => {
    switch (user?.role) {
      case 'DOCTOR': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PHARMACY': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ADMIN': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-sky-50 text-sky-700 border-sky-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#bcc9c6]/30 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#00685f]/30 shadow-md">
              <Avatar name={fullName || user?.fullName || 'User'} size={96} src={avatarUrl || undefined} />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              title="Change Profile Picture"
              className="absolute bottom-0 right-0 bg-[#00685f] hover:bg-[#00524b] text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105 cursor-pointer"
            >
              {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFileChange}
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
            />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-[#111c2d]">{fullName || user?.fullName}</h2>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${roleBadgeColor()}`}>
                {user?.role}
              </span>
            </div>
            <p className="text-sm text-[#475569] flex items-center gap-2 mt-1">
              <Mail size={14} className="text-[#64748b]" /> {user?.email}
            </p>
            {phoneNumber && (
              <p className="text-sm text-[#475569] flex items-center gap-2 mt-0.5">
                <Phone size={14} className="text-[#64748b]" /> {phoneNumber}
              </p>
            )}
          </div>
        </div>

        {avatarUrl && (
          <Button
            variant="ghost"
            onClick={handleRemoveAvatar}
            icon={<Trash2 size={15} />}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
          >
            Remove Picture
          </Button>
        )}
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-sm animate-fade-in">
          <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
          <span className="font-medium">Profile information updated and saved successfully.</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm animate-fade-in">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Main Profile Edit Form */}
      <form onSubmit={handleUpdate} className="space-y-6">
        {/* Section 1: General Personal Details */}
        <Card className="p-6 bg-white border border-[#bcc9c6]/30 shadow-sm rounded-2xl">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#bcc9c6]/20">
            <UserIcon size={20} className="text-[#00685f]" />
            <h3 className="text-base font-bold text-[#111c2d]">Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Full Name *"
              placeholder="e.g. Dr. John Doe / Sarah Connor"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">Registered Email (Read-Only)</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-[#64748b] cursor-not-allowed"
              />
            </div>

            <Input
              label="Contact Phone Number"
              placeholder="+880 1700-000000"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
            />

            <Input
              label="Residential Address"
              placeholder="Street Address, City, Postal Code"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />

            <Input
              type="date"
              label="Date of Birth"
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">Gender</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#bcc9c6] rounded-xl text-sm text-[#111c2d] focus:outline-none focus:border-[#00685f]"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={e => setBloodGroup(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#bcc9c6] rounded-xl text-sm text-[#111c2d] focus:outline-none focus:border-[#00685f]"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <Input
              label="Emergency Contact (Name & Phone)"
              placeholder="e.g. Spouse (+88017XXXXXXXX)"
              value={emergencyContact}
              onChange={e => setEmergencyContact(e.target.value)}
            />
          </div>
        </Card>

        {/* Section 2: Role-Specific Information (Doctor Profile) */}
        {user?.role === 'DOCTOR' && (
          <Card className="p-6 bg-white border border-[#bcc9c6]/30 shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#bcc9c6]/20">
              <GraduationCap size={20} className="text-[#00685f]" />
              <h3 className="text-base font-bold text-[#111c2d]">Clinical & Practice Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Designation / Title"
                placeholder="e.g. Associate Professor / Senior Consultant"
                value={designation}
                onChange={e => setDesignation(e.target.value)}
              />

              <Input
                label="Medical Specialty"
                placeholder="e.g. Cardiologist, Neurologist, General Medicine"
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
              />

              <Input
                label="Academic Degrees & Qualifications"
                placeholder="e.g. MBBS, FCPS (Medicine), MD (Cardiology)"
                value={degrees}
                onChange={e => setDegrees(e.target.value)}
              />

              <Input
                label="Years of Clinical Experience"
                type="number"
                min="0"
                placeholder="e.g. 12"
                value={experienceYears}
                onChange={e => setExperienceYears(e.target.value)}
              />

              <Input
                label="Consultation Fee (BDT)"
                type="number"
                min="0"
                placeholder="e.g. 1000"
                value={consultationFee}
                onChange={e => setConsultationFee(e.target.value)}
              />

              <Input
                label="Clinic / Chamber Area"
                placeholder="e.g. Dhanmondi / Gulshan"
                value={area}
                onChange={e => setArea(e.target.value)}
              />

              <Input
                label="City"
                placeholder="e.g. Dhaka"
                value={city}
                onChange={e => setCity(e.target.value)}
              />

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">Doctor Bio / Clinical Summary</label>
                <textarea
                  rows={3}
                  placeholder="Share a short bio regarding your clinical focus, chamber timings, and areas of expertise..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#bcc9c6] rounded-xl text-sm text-[#111c2d] focus:outline-none focus:border-[#00685f]"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Section 3: Role-Specific Information (Pharmacy Profile) */}
        {user?.role === 'PHARMACY' && (
          <Card className="p-6 bg-white border border-[#bcc9c6]/30 shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#bcc9c6]/20">
              <Building size={20} className="text-[#00685f]" />
              <h3 className="text-base font-bold text-[#111c2d]">Pharmacy Store Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Store Name"
                placeholder="e.g. MedPlus Pharmacy"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
              />

              <Input
                label="Store City"
                placeholder="e.g. Dhaka"
                value={pharmacyCity}
                onChange={e => setPharmacyCity(e.target.value)}
              />

              <div className="md:col-span-2">
                <Input
                  label="Street Address / Location"
                  placeholder="e.g. House 12, Road 4, Sector 7, Uttara"
                  value={streetAddress}
                  onChange={e => setStreetAddress(e.target.value)}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Button
            type="submit"
            loading={loading}
            icon={<Save size={18} />}
            className="bg-[#00685f] hover:bg-[#00524b] text-white px-8 py-3 rounded-xl shadow-md font-semibold cursor-pointer"
          >
            Save All Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

