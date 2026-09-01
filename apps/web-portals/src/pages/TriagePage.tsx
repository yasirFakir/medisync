import React, { useState, useEffect } from 'react';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { Send, User, Bot, AlertTriangle, ShieldCheck, History, Trash2, PlusCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const TriagePage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [urgency, setUrgency] = useState<string | null>(null);
  const [historySessions, setHistorySessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSessionTitle, setActiveSessionTitle] = useState<string | null>(null);
  const [followUpText, setFollowUpText] = useState('');

  const symptomPresets = ['Fever', 'Headache', 'Cough', 'Sore Throat', 'Stomach Pain', 'Shortness of breath', 'Nausea'];

  const fetchHistory = async () => {
    try {
      const res = await apiClient.get('/triage/sessions');
      if (res.data && res.data.data) {
        setHistorySessions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load past triage sessions', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const loadPastSession = (session: any) => {
    setActiveSessionId(session.sessionId);
    setUrgency(session.urgencyLevel);
    setActiveSessionTitle(session.title || (Array.isArray(session.symptoms) ? session.symptoms.join(', ') : session.symptoms) || 'Health Consultation');

    let parsedMessages: ChatMessage[] = [];
    try {
      const rawData = typeof session.symptoms === 'string' ? JSON.parse(session.symptoms) : session.symptoms;
      if (Array.isArray(rawData) && rawData.length > 0 && typeof rawData[0] === 'object' && rawData[0].role) {
        parsedMessages = rawData.map((item: any) => ({
          sender: item.role === 'user' ? 'user' : 'ai',
          text: item.content,
          timestamp: item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString()
        }));
      } else {
        const syms = Array.isArray(rawData) ? rawData : [];
        setSymptoms(syms);
        parsedMessages = [
          { sender: 'user', text: `Symptoms reported: ${syms.join(', ')}`, timestamp: new Date(session.timestamp).toLocaleDateString() },
          { sender: 'ai', text: session.response, timestamp: new Date(session.timestamp).toLocaleDateString() }
        ];
      }
    } catch (e) {
      parsedMessages = [
        { sender: 'ai', text: session.response, timestamp: new Date(session.timestamp).toLocaleDateString() }
      ];
    }
    setMessages(parsedMessages);
  };

  const handleStartNewChat = () => {
    setActiveSessionId(null);
    setActiveSessionTitle(null);
    setMessages([]);
    setSymptoms([]);
    setUrgency(null);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/triage/sessions/${sessionId}`);
      fetchHistory();
      if (activeSessionId === sessionId) {
        handleStartNewChat();
      }
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  const toggleSymptom = (symptom: string) => {
    if (symptoms.includes(symptom)) {
      setSymptoms(symptoms.filter(s => s !== symptom));
    } else {
      setSymptoms([...symptoms, symptom]);
    }
  };

  const handleStartTriage = async () => {
    if (symptoms.length === 0) return;
    setLoading(true);
    setActiveSessionId(null);

    const userQuery = `I am experiencing: ${symptoms.join(', ')}. What guidance and care steps do you recommend?`;
    const initialMessages: ChatMessage[] = [{ sender: 'user', text: userQuery, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
    setMessages(initialMessages);

    try {
      const res = await apiClient.post('/triage/chat', {
        symptoms,
        additionalNotes: 'Triage session initiated from web portal.'
      });
      
      const { sessionId, title, response, urgencyLevel } = res.data.data || res.data;
      if (sessionId) setActiveSessionId(sessionId);
      if (title) setActiveSessionTitle(title);

      setMessages(prev => [...prev, { sender: 'ai', text: response, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setUrgency(urgencyLevel);
      fetchHistory();
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, the AI Assistant is currently busy or unreachable. Please try again shortly.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim() || loading) return;

    const userText = followUpText.trim();
    setFollowUpText('');

    const newMessages = [...messages, { sender: 'user' as const, text: userText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const historyPayload = newMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
        timestamp: m.timestamp
      }));

      const res = await apiClient.post('/triage/chat', {
        sessionId: activeSessionId || undefined,
        symptoms: symptoms.length > 0 ? symptoms : ['Follow-up consultation'],
        additionalNotes: userText,
        conversationHistory: historyPayload
      });

      const { sessionId, title, response, urgencyLevel } = res.data.data || res.data;
      if (sessionId) setActiveSessionId(sessionId);
      if (title && !activeSessionTitle) setActiveSessionTitle(title);

      setMessages(prev => [...prev, { sender: 'ai', text: response, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      if (urgencyLevel) setUrgency(urgencyLevel);
      fetchHistory();
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Failed to send response. Please try again.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] max-h-[850px] w-full max-w-6xl mx-auto gap-6 font-sans">
      {/* Left Drawer: Stored Conversations & History */}
      <div className="w-80 bg-white rounded-2xl shadow-sm border border-[#bcc9c6]/30 flex flex-col p-4 flex-shrink-0">
        <button
          onClick={handleStartNewChat}
          className="w-full bg-[#00685f] hover:bg-[#008378] text-white py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer mb-4 shadow-sm"
        >
          <PlusCircle size={16} />
          <span>New Chat Consultation</span>
        </button>

        <div className="flex items-center space-x-2 px-2 mb-3 text-xs font-bold text-[#3d4947] uppercase tracking-wider">
          <History size={14} />
          <span>Previous Consultations</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {historySessions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No previous chat records found.</p>
          ) : (
            historySessions.map((session, idx) => {
              const isActive = activeSessionId === session.sessionId;
              const symText = Array.isArray(session.symptoms) ? session.symptoms.join(', ') : session.symptoms || 'General Consultation';
              const chatTitle = session.title || symText;
              return (
                <div
                  key={idx}
                  onClick={() => loadPastSession(session)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between group ${
                    isActive
                      ? 'bg-[#f0f3ff] border-[#00685f] text-[#00685f] font-semibold shadow-xs'
                      : 'bg-[#f9f9ff] border-[#bcc9c6]/30 text-[#111c2d] hover:border-[#00685f]/50'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-semibold">{chatTitle}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{new Date(session.timestamp).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(e, session.sessionId)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white rounded-2xl shadow-[0px_12px_32px_rgba(30,41,59,0.05)] border border-[#bcc9c6]/20 overflow-hidden flex flex-col h-full">
        
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-[#bcc9c6]/20 flex items-center justify-between bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#f4fffc] border border-[#00685f]/20 flex items-center justify-center text-[#00685f]">
              <span className="material-symbols-outlined text-xl">smart_toy</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#111c2d]">
                {activeSessionTitle || 'MediSync AI Assistant'}
              </h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                <span className="text-xs text-[#3d4947]">Online & Clinically Moderated</span>
              </div>
            </div>
          </div>
          {urgency && (
            <span className="px-3 py-1 bg-[#E0F2FE] text-[#004a6d] text-xs font-bold rounded-full">
              {urgency} Priority
            </span>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f9f9ff]">
          {messages.length === 0 ? (
            <div className="space-y-6 py-4 max-w-2xl mx-auto">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#f4fffc] border border-[#00685f]/20 flex-shrink-0 flex items-center justify-center text-[#00685f] mt-1">
                  <span className="material-symbols-outlined text-sm">smart_toy</span>
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-[#bcc9c6]/20 text-[#111c2d] text-sm">
                  Hello! I'm your MediSync AI Assistant. Select symptoms below or type a custom question to manage your medications and healthcare routine.
                </div>
              </div>

              {/* Symptom Selector */}
              <div className="bg-white p-5 rounded-xl border border-[#bcc9c6]/30 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-[#3d4947] uppercase tracking-wider">Quick Symptom Selector</h4>
                <div className="flex flex-wrap gap-2">
                  {symptomPresets.map(sym => {
                    const selected = symptoms.includes(sym);
                    return (
                      <button
                        key={sym}
                        onClick={() => toggleSymptom(sym)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#00685f] text-white border-[#00685f]'
                            : 'bg-[#f0f3ff] text-[#3d4947] border-[#bcc9c6]/40 hover:border-[#00685f]'
                        }`}
                      >
                        {sym}
                      </button>
                    );
                  })}
                </div>
                {symptoms.length > 0 && (
                  <button
                    onClick={handleStartTriage}
                    disabled={loading}
                    className="w-full mt-2 py-2.5 bg-[#0D9488] hover:bg-[#008378] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center space-x-2"
                  >
                    {loading ? 'Consulting AI...' : 'Ask MediSync AI About Symptoms'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isAi = msg.sender === 'ai';
              return (
                <div key={index} className={`flex gap-4 max-w-[85%] ${isAi ? '' : 'ml-auto justify-end'}`}>
                  {isAi && (
                    <div className="w-8 h-8 rounded-full bg-[#f4fffc] border border-[#00685f]/20 flex-shrink-0 flex items-center justify-center text-[#00685f] mt-1">
                      <span className="material-symbols-outlined text-sm">smart_toy</span>
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className={`p-5 rounded-2xl text-sm leading-relaxed ${
                      isAi
                        ? 'bg-white text-[#111c2d] rounded-tl-sm shadow-sm border border-[#bcc9c6]/20'
                        : 'bg-[#00685f] text-white rounded-tr-sm shadow-sm'
                    }`}>
                      {isAi && (
                        <div className="flex items-center gap-1.5 bg-[#10B981]/10 px-2.5 py-1 rounded-md text-[#047857] text-xs font-bold mb-3 w-fit">
                          <span className="material-symbols-outlined text-[14px]">verified</span>
                          Verified Medicine Information
                        </div>
                      )}
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>

                    {isAi && index === messages.length - 1 && (
                      <div className="bg-[#FEF3C7] border border-[#fde68a] p-3 rounded-xl flex items-start gap-2 text-xs text-[#B45309]">
                        <span className="material-symbols-outlined text-[16px] mt-0.5">warning</span>
                        <div>
                          <strong>Medical Disclaimer:</strong> Educational guidance only; does not replace direct clinical advice.
                        </div>
                      </div>
                    )}
                  </div>
                  {!isAi && (
                    <div className="w-8 h-8 rounded-full bg-[#cae6ff] text-[#006492] flex-shrink-0 flex items-center justify-center font-bold text-xs mt-1">
                      {user?.fullName?.substring(0, 2).toUpperCase() || 'ME'}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-[#f4fffc] border border-[#00685f]/20 flex-shrink-0 flex items-center justify-center text-[#00685f]">
                <span className="material-symbols-outlined text-sm">smart_toy</span>
              </div>
              <div className="p-4 bg-white border border-[#bcc9c6]/20 rounded-2xl rounded-tl-sm flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#00685f] animate-pulse"></span>
                <span className="w-2 h-2 rounded-full bg-[#00685f] animate-pulse delay-100"></span>
                <span className="w-2 h-2 rounded-full bg-[#00685f] animate-pulse delay-200"></span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="bg-white border-t border-[#bcc9c6]/20 p-4 space-y-3">
          <form onSubmit={handleSendFollowUp} className="relative flex items-center">
            <input
              type="text"
              placeholder="Ask about your medications or symptoms..."
              value={followUpText}
              onChange={e => setFollowUpText(e.target.value)}
              disabled={loading}
              className="w-full bg-[#f9f9ff] border border-[#bcc9c6] rounded-xl py-3 pl-4 pr-12 text-sm text-[#111c2d] placeholder-gray-400 focus:ring-2 focus:ring-[#00685f] focus:border-[#00685f]"
            />
            <button
              type="submit"
              disabled={!followUpText.trim() || loading}
              className="absolute right-2 w-9 h-9 flex items-center justify-center rounded-lg bg-[#00685f] text-white hover:bg-[#008378] disabled:opacity-50 transition-opacity cursor-pointer"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
