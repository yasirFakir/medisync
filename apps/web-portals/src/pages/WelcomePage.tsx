import React from 'react';
import { useNavigate } from 'react-router-dom';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#f9f9ff] text-[#111c2d] antialiased min-h-screen flex flex-col items-center justify-center relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Dynamic Keyframes for Scan Animation */}
      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-line {
          animation: scan 3s ease-in-out infinite;
        }
      `}</style>

      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#89f5e7] blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#cae6ff] blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-[1280px] px-4 sm:px-6 md:px-10 py-6 sm:py-12 md:py-16 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Left: Copy & CTAs */}
        <div className="flex flex-col space-y-4 sm:space-y-6 md:space-y-8 max-w-xl">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-1 sm:mb-2">
            <span className="material-symbols-outlined text-[#00685f] text-[24px] sm:text-[28px] md:text-[32px]">health_and_safety</span>
            <span className="text-[20px] sm:text-[22px] md:text-[24px] leading-tight font-semibold text-[#00685f]">MediSync</span>
          </div>

          <h1 className="text-[24px] sm:text-[32px] md:text-[44px] leading-[30px] sm:leading-[40px] md:leading-[54px] tracking-[-0.02em] font-bold text-[#111c2d]">
            Understand your prescription.<br />
            <span className="text-[#00685f]">Manage your medication with confidence.</span>
          </h1>

          <p className="text-[14px] sm:text-[16px] md:text-[18px] leading-[22px] sm:leading-[25px] md:leading-[28px] text-[#3d4947] font-normal">
            MediSync uses secure OCR technology and moderated AI assistance to help you manage your treatment routine. Transform messy handwriting into structured, actionable health data in seconds.
          </p>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-2 sm:pt-4">
            <button
              onClick={() => navigate('/login')}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-[#0D9488] hover:bg-[#008378] text-white text-[13px] sm:text-[14px] leading-[20px] tracking-[0.01em] font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 w-full sm:w-auto cursor-pointer"
            >
              <span>Sign In</span>
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">login</span>
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-[#0D9488] text-[#0D9488] hover:bg-[#f0f3ff] text-[13px] sm:text-[14px] leading-[20px] tracking-[0.01em] font-semibold rounded-lg transition-all flex items-center justify-center w-full sm:w-auto cursor-pointer"
            >
              Create Account
            </button>
          </div>

          <div className="flex items-center space-x-4 sm:space-x-6 pt-4 sm:pt-6 text-[#3d4947] text-[11px] sm:text-[12px] leading-[16px] tracking-[0.05em] font-bold uppercase">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">lock</span>
              <span>Secure &amp; Private</span>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">verified</span>
              <span>Clinically Reviewed</span>
            </div>
          </div>
        </div>

        {/* Right: Visual Concept */}
        <div className="relative h-full min-h-[360px] sm:min-h-[420px] md:min-h-[500px] rounded-xl overflow-hidden shadow-[0px_12px_32px_rgba(30,41,59,0.12)] bg-white border border-[#bcc9c6]/30 hidden md:block">
          {/* OCR Concept Container */}
          <div className="absolute inset-0 flex flex-col">
            {/* Top Half: Handwritten Prescription */}
            <div className="flex-1 relative overflow-hidden bg-[#fdfbf7] p-4 sm:p-6 md:p-8 flex items-center justify-center border-b border-[#bcc9c6]/30">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#111c2d 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              ></div>
              
              <div className="relative w-full max-w-xs sm:max-w-sm transform rotate-[-2deg] bg-white p-4 sm:p-6 rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex justify-between items-start mb-4 sm:mb-6 border-b border-gray-300 pb-2">
                  <div className="text-[10px] sm:text-xs text-gray-500 font-serif">
                    Dr. H. Smith, MD<br />
                    123 Medical Plaza
                  </div>
                  <span className="material-symbols-outlined text-gray-400 text-[18px] sm:text-[24px]">medical_services</span>
                </div>
                
                {/* Cursive scribble representation */}
                <svg
                  className="w-full h-auto stroke-current text-blue-800 fill-none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  viewBox="0 0 200 100"
                >
                  <path d="M10,30 Q30,10 40,40 T70,30 T100,50 T130,20 T180,40"></path>
                  <path d="M20,60 Q40,40 60,70 T100,50 T150,80"></path>
                  <text className="fill-current stroke-none text-gray-800" fontFamily="serif" fontSize="14" x="10" y="20">
                    Rx:
                  </text>
                </svg>

                {/* Animated Scanning Line */}
                <div className="absolute left-0 top-0 w-full h-1 bg-[#89f5e7] opacity-90 shadow-[0_0_12px_#6bd8cb] animate-scan-line pointer-events-none"></div>
              </div>
            </div>

            {/* Bottom Half: Structured Data */}
            <div className="flex-1 bg-white p-4 sm:p-6 md:p-8 flex flex-col justify-center items-center">
              <div className="w-full max-w-xs sm:max-w-sm bg-white rounded-lg border border-[#bcc9c6]/30 shadow-sm p-4 sm:p-5 space-y-3 sm:space-y-4 transform transition-all duration-500 hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 sm:space-x-3">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#cae6ff] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#006492] text-[18px] sm:text-[24px]">medication</span>
                    </div>
                    <div>
                      <h3 className="text-[14px] sm:text-[16px] leading-[20px] sm:leading-[24px] font-semibold text-[#111c2d]">Amoxicillin</h3>
                      <p className="text-[11px] sm:text-[12px] leading-[14px] sm:leading-[16px] tracking-[0.05em] font-bold text-[#3d4947]">500mg Capsule</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 sm:py-1 bg-[#E0F2FE] text-[#004a6d] text-[9px] sm:text-[10px] font-bold rounded flex items-center space-x-1">
                    <span className="material-symbols-outlined text-[10px] sm:text-[12px]">document_scanner</span>
                    <span>Extracted</span>
                  </span>
                </div>
                <div className="h-px w-full bg-[#bcc9c6]/30"></div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-[10px] sm:text-[12px] leading-[14px] sm:leading-[16px] tracking-[0.05em] font-bold text-[#3d4947] uppercase">Dosage</p>
                    <p className="text-[13px] sm:text-[16px] leading-[18px] sm:leading-[24px] text-[#111c2d]">1 capsule, 3x daily</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-[12px] leading-[14px] sm:leading-[16px] tracking-[0.05em] font-bold text-[#3d4947] uppercase">Duration</p>
                    <p className="text-[13px] sm:text-[16px] leading-[18px] sm:leading-[24px] text-[#111c2d]">7 Days</p>
                  </div>
                </div>
                <div className="bg-[#FEF3C7] p-2.5 sm:p-3 rounded text-[#B45309] flex items-start space-x-1.5 sm:space-x-2">
                  <span className="material-symbols-outlined text-[14px] sm:text-[16px] mt-0.5">warning</span>
                  <p className="text-[11px] sm:text-[12px] leading-[15px] sm:leading-[16px] font-bold">Take with food. May cause drowsiness.</p>
                </div>
              </div>
            </div>

            {/* Central Icon */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 sm:p-2 shadow-lg border border-[#bcc9c6]/20 z-10">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-[#00685f] rounded-full flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[20px] sm:text-[24px]">sync</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
