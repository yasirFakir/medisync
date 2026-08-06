import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { useAuthStore } from '../store/authStore';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();

  // Patient Dashboard States
  const [otp, setOtp] = useState<string | null>(null);
  const [loadingOtp, setLoadingOtp] = useState(false);

  const generateOtp = async () => {
    setLoadingOtp(true);
    try {
      const res = await apiClient.post('/ehr/generate-otp');
      setOtp(res.data.data.otp);
    } catch (err) {
      console.error('Failed to generate EHR access OTP', err);
    } finally {
      setLoadingOtp(false);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-[1280px] mx-auto w-full space-y-6 font-sans">
      {/* Welcome Header */}
      <div className="mb-8">
        <h2 className="text-[32px] leading-[40px] tracking-tight font-bold text-[#111c2d] mb-2">
          Good morning, {user?.fullName?.split(' ')[0] || 'Alex'}
        </h2>
        <p className="text-[18px] leading-[28px] text-[#3d4947]">
          Here's an overview of your medication today.
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Medication Timeline & Prescriptions (Span 8) */}
        <div className="md:col-span-8 flex flex-col gap-6">
          
          {/* Today's Medication Schedule */}
          <div className="bg-white rounded-xl p-6 shadow-[0px_4px_20px_rgba(30,41,59,0.05)] border border-slate-200/50 hover:shadow-lg transition-all">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[24px] leading-[32px] font-semibold text-[#111c2d] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00685f]">schedule</span>
                Today's Schedule
              </h3>
              <button 
                onClick={() => navigate('/alerts')}
                className="text-[#00685f] text-[14px] font-semibold hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="relative pl-4 border-l-2 border-[#d8e3fb] space-y-6">
              {/* Timeline Item 1 */}
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-[#00685f] rounded-full border-2 border-white ring-2 ring-[#00685f]/20"></div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#f0f3ff] p-4 rounded-lg ml-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm text-[#00685f]">
                      <span className="material-symbols-outlined text-[24px]">medication</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-[#111c2d]">Metformin</h4>
                      <p className="text-sm text-[#3d4947]">500mg • After Breakfast</p>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-0 flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <span className="text-xs font-semibold text-[#3d4947] bg-white px-3 py-1 rounded-full border border-[#bcc9c6]/30">08:00 AM</span>
                    <button className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center hover:bg-green-200 transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[20px]">check</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Timeline Item 2 */}
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-[#d8e3fb] rounded-full border-2 border-white"></div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-lg ml-2 border border-[#bcc9c6]/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#e7eeff] rounded-lg flex items-center justify-center shadow-sm text-[#006492]">
                      <span className="material-symbols-outlined text-[24px]">vaccines</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-[#111c2d]">Vitamin D</h4>
                      <p className="text-sm text-[#3d4947]">1000 IU • With Lunch</p>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-0 flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <span className="text-xs font-semibold text-[#3d4947] bg-[#f9f9ff] px-3 py-1 rounded-full border border-[#bcc9c6]/30">01:00 PM</span>
                    <button className="w-8 h-8 rounded-full border border-[#bcc9c6] text-[#3d4947] flex items-center justify-center hover:bg-[#d8e3fb] transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[20px]">check</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Timeline Item 3 */}
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-[#d8e3fb] rounded-full border-2 border-white"></div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-lg ml-2 border border-[#bcc9c6]/30 opacity-75">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#e7eeff] rounded-lg flex items-center justify-center shadow-sm text-[#00685f]">
                      <span className="material-symbols-outlined text-[24px]">medication</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-[#111c2d]">Metformin</h4>
                      <p className="text-sm text-[#3d4947]">500mg • After Dinner</p>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-0 flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <span className="text-xs font-semibold text-[#3d4947] bg-[#f9f9ff] px-3 py-1 rounded-full border border-[#bcc9c6]/30">09:00 PM</span>
                    <button className="w-8 h-8 rounded-full border border-[#bcc9c6] text-[#3d4947] flex items-center justify-center hover:bg-[#d8e3fb] transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[20px]">check</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Prescription Card */}
          <div className="bg-white rounded-xl p-6 shadow-[0px_4px_20px_rgba(30,41,59,0.05)] border border-slate-200/50 hover:shadow-lg transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-[24px] leading-[32px] font-semibold text-[#111c2d] mb-1">Active Prescription</h3>
                <p className="text-sm text-[#3d4947]">Added Oct 24, 2023</p>
              </div>
              <span className="bg-[#E0F2FE] text-[#004a6d] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-[#cae6ff]">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                Analysis Complete
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center bg-[#f0f3ff] p-4 rounded-lg border border-[#bcc9c6]/20">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0 bg-[#cae6ff] text-[#006492] font-bold text-xl flex items-center justify-center">
                SC
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-[#111c2d]">Dr. Sarah Chen</h4>
                <p className="text-sm text-[#3d4947] flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[16px]">stethoscope</span>
                  Endocrinologist • City General Hospital
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
                <span className="text-[24px] font-bold text-[#00685f]">2</span>
                <span className="text-xs font-bold text-[#3d4947] uppercase tracking-wider">Medicines</span>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              {/* Doctor OTP Key badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#3d4947]">EHR OTP:</span>
                {otp ? (
                  <span className="text-sm font-bold text-[#00685f] tracking-widest">{otp}</span>
                ) : (
                  <button onClick={generateOtp} className="text-xs font-semibold text-[#00685f] hover:underline cursor-pointer">
                    {loadingOtp ? 'Generating...' : 'Get Access OTP'}
                  </button>
                )}
              </div>
              <button 
                onClick={() => navigate('/prescriptions')}
                className="text-[#00685f] text-sm font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                View Details <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Widgets & Actions (Span 4) */}
        <div className="md:col-span-4 flex flex-col gap-6">
          
          {/* Quick Actions Widget */}
          <div className="bg-white rounded-xl p-6 shadow-[0px_4px_20px_rgba(30,41,59,0.05)] border border-slate-200/50">
            <h3 className="text-xs font-bold text-[#3d4947] uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/prescriptions')}
                className="w-full bg-[#0D9488] text-white text-sm font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#008378] transition-colors shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined">document_scanner</span>
                Upload Prescription
              </button>
              <button
                onClick={() => navigate('/alerts')}
                className="w-full bg-white border border-[#0D9488] text-[#0D9488] text-sm font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#f0f3ff] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">event_note</span>
                View Reminders
              </button>
              <button
                onClick={() => navigate('/triage')}
                className="w-full bg-[#e7eeff] text-[#006492] text-sm font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#dee8ff] transition-colors border border-[#cae6ff]/50 cursor-pointer"
              >
                <span className="material-symbols-outlined">smart_toy</span>
                Ask MediSync AI
              </button>
            </div>
          </div>

          {/* Upcoming Reminder Widget */}
          <div className="bg-gradient-to-br from-[#008378] to-[#00685f] rounded-xl p-6 shadow-md text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#89f5e7]/20 rounded-full blur-xl translate-y-1/2 -translate-x-1/4"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 opacity-90">
                <span className="material-symbols-outlined text-[20px]">notifications_active</span>
                <span className="text-xs font-bold uppercase tracking-wider">Next Upcoming</span>
              </div>
              <h4 className="text-xl font-bold mb-1">Dr. Chen Follow-up</h4>
              <p className="text-sm opacity-90 mb-4">In 2 days • Oct 28, 10:00 AM</p>
              <div className="flex items-center justify-between border-t border-white/20 pt-4 mt-2">
                <span className="text-xs opacity-80 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">location_on</span> Online Clinic
                </span>
                <button className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors backdrop-blur-sm cursor-pointer">
                  <span className="material-symbols-outlined text-[20px]">calendar_add_on</span>
                </button>
              </div>
            </div>
          </div>

          {/* Health Tip Widget */}
          <div className="bg-[#FEF3C7] rounded-xl p-4 shadow-sm border border-[#ffddb8]/30 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#B45309] mt-0.5">lightbulb</span>
            <div>
              <h4 className="text-sm font-bold text-[#B45309]">Stay Hydrated</h4>
              <p className="text-xs text-[#825100] mt-1">Remember to drink plenty of water with your Metformin prescription today.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
