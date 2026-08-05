import React, { useState } from 'react';
import { Card, Input, Button, Badge, Spinner } from '../../packages/ui/src/index';
import { apiClient } from '../../packages/ui/src/lib/apiClient';
import { Send, User, Bot, AlertTriangle, HelpCircle } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const TriagePage: React.FC = () => {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [urgency, setUrgency] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  const symptomPresets = ['Fever', 'Headache', 'Cough', 'Sore Throat', 'Stomach Pain', 'Shortness of breath', 'Nausea'];

  const toggleSymptom = (symptom: string) => {
    if (symptoms.includes(symptom)) {
      setSymptoms(symptoms.filter(s => s !== symptom));
    } else {
      setSymptoms([...symptoms, symptom]);
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSymptom.trim()) return;
    if (!symptoms.includes(customSymptom.trim())) {
      setSymptoms([...symptoms, customSymptom.trim()]);
    }
    setCustomSymptom('');
  };

  const [historySessions, setHistorySessions] = useState<any[]>([]);

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

  React.useEffect(() => {
    fetchHistory();
  }, []);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const loadPastSession = (session: any) => {
    setActiveSessionId(session.sessionId);
    setUrgency(session.urgencyLevel);
    setRecommendation(session.recommendedAction);

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
          { sender: 'user', text: `[History Record] Symptoms reported: ${syms.join(', ')}`, timestamp: new Date(session.timestamp).toLocaleDateString() },
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

  const handleStartTriage = async () => {
    if (symptoms.length === 0) return;
    setLoading(true);
    setActiveSessionId(null);

    const userQuery = `I am experiencing: ${symptoms.join(', ')}.`;
    const initialMessages: ChatMessage[] = [{ sender: 'user', text: userQuery, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }];
    setMessages(initialMessages);

    try {
      const res = await apiClient.post('/triage/chat', {
        symptoms,
        additionalNotes: 'Triage session initiated from unified web patient portal.'
      });
      
      const { sessionId, response, urgencyLevel, recommendedAction } = res.data.data || res.data;
      if (sessionId) setActiveSessionId(sessionId);

      setMessages(prev => [...prev, { sender: 'ai', text: response, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setUrgency(urgencyLevel);
      setRecommendation(recommendedAction);
      fetchHistory();
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, the AI Triage Service is currently busy or unreachable. Please try again shortly.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (level: string | null) => {
    switch (level) {
      case 'LOW': return 'green';
      case 'MEDIUM': return 'yellow';
      case 'HIGH': return 'red';
      case 'EMERGENCY': return 'red';
      default: return 'blue';
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/triage/sessions/${sessionId}`);
      fetchHistory();
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
        setUrgency(null);
        setRecommendation(null);
      }
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  const [followUpText, setFollowUpText] = useState('');

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

      const { sessionId, response, urgencyLevel, recommendedAction } = res.data.data || res.data;
      if (sessionId) setActiveSessionId(sessionId);

      setMessages(prev => [...prev, { sender: 'ai', text: response, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      if (urgencyLevel) setUrgency(urgencyLevel);
      if (recommendedAction) setRecommendation(recommendedAction);
      fetchHistory();
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Failed to send follow-up response. Please try again.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '28px', height: 'calc(100vh - 140px)', minHeight: '500px' }}>
      
      {/* Symptom selector panel */}
      <Card style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', overflowY: 'auto' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Select Symptoms</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Click on the presets or add custom symptoms below to query the triage AI bot.</p>
        </div>

        {/* Preset list */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {symptomPresets.map(sym => {
            const selected = symptoms.includes(sym);
            return (
              <button
                key={sym}
                onClick={() => toggleSymptom(sym)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: selected ? 'var(--color-brand-400)' : 'var(--border-default)',
                  background: selected ? 'rgba(14,165,233,0.12)' : 'var(--bg-elevated)',
                  color: selected ? 'var(--color-brand-300)' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {sym}
              </button>
            );
          })}
        </div>

        {/* Custom entry input */}
        <form onSubmit={handleAddCustom} style={{ display: 'flex', gap: '8px' }}>
          <Input
            placeholder="Add custom symptom..."
            value={customSymptom}
            onChange={e => setCustomSymptom(e.target.value)}
            style={{ height: '36px' }}
          />
          <Button type="submit" size="sm" variant="secondary">Add</Button>
        </form>

        <div className="divider" />

        {/* Active list */}
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Active Symptom Stack:</h4>
          {symptoms.length === 0 ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No symptoms selected yet.</span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {symptoms.map(sym => (
                <Badge key={sym} variant="blue">
                  {sym}
                  <button onClick={() => toggleSymptom(sym)} style={{ background: 'none', border: 'none', color: 'inherit', marginLeft: '4px', cursor: 'pointer', fontWeight: 800 }}>&times;</button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Previous Chat History */}
        {historySessions.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Previous AI Sessions:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
              {historySessions.map((sess, idx) => (
                <div
                  key={idx}
                  onClick={() => loadPastSession(sess)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-elevated)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', marginRight: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{new Date(sess.timestamp).toLocaleDateString()}</span>
                      <Badge variant={getUrgencyColor(sess.urgencyLevel)}>{sess.urgencyLevel}</Badge>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                      {Array.isArray(sess.symptoms) ? sess.symptoms.join(', ') : sess.symptoms}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(e, sess.sessionId)}
                    title="Delete Chat Session"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-danger)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      padding: '4px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleStartTriage} disabled={symptoms.length === 0 || loading} style={{ width: '100%' }}>
          {loading ? <Spinner size={16} /> : 'Begin Triage Diagnostic'}
        </Button>
      </Card>

      {/* Main Diagnostic Chat area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {(urgency || recommendation) && (
          <div className="glass-elevated animate-fade-in" style={{ padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: urgency === 'HIGH' || urgency === 'EMERGENCY' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: urgency === 'HIGH' || urgency === 'EMERGENCY' ? 'var(--color-danger)' : 'var(--color-success)',
              flexShrink: 0
            }}>
              <AlertTriangle size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>AI Assessment Report</span>
                <Badge variant={getUrgencyColor(urgency)}>{urgency} URGENCY</Badge>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{recommendation}</p>
            </div>
          </div>
        )}

        <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-success)' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Virtual Diagnostics Bot</span>
          </div>

          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '12px' }}>
                <HelpCircle size={36} />
                <span style={{ fontSize: '0.8125rem' }}>Select symptoms on the left to start a virtual diagnosis.</span>
              </div>
            )}
            
            {messages.map((msg, index) => {
              const isAi = msg.sender === 'ai';
              return (
                <div key={index} style={{
                  display: 'flex',
                  gap: '12px',
                  alignSelf: isAi ? 'flex-start' : 'flex-end',
                  maxWidth: '80%',
                  flexDirection: isAi ? 'row' : 'row-reverse'
                }} className="animate-fade-in">
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isAi ? 'rgba(139,92,246,0.12)' : 'rgba(14,165,233,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isAi ? 'var(--color-accent-400)' : 'var(--color-brand-400)',
                    flexShrink: 0
                  }}>
                    {isAi ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  
                  <div>
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: isAi ? '0px 12px 12px 12px' : '12px 0px 12px 12px',
                      background: isAi ? 'var(--bg-elevated)' : 'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-500))',
                      border: isAi ? '1px solid var(--border-default)' : 'none',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-line'
                    }}>
                      {msg.text}
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block', textAlign: isAi ? 'left' : 'right' }}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-400)' }}>
                  <Bot size={16} />
                </div>
                <div style={{ padding: '12px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '0px 12px 12px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block' }} className="animate-pulse" />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block' }} className="animate-pulse" />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block' }} className="animate-pulse" />
                </div>
              </div>
            )}
          </div>

          {/* Interactive Follow-up Chat Input bar */}
          {messages.length > 0 && (
            <form onSubmit={handleSendFollowUp} style={{ padding: '16px 24px', borderTop: '1px solid var(--border-default)', display: 'flex', gap: '12px', alignItems: 'flex-end', background: 'var(--bg-elevated)', width: '100%' }}>
              <textarea
                placeholder="Ask follow-up questions to AI Assistant... (Press Enter to send, Shift+Enter for new line)"
                value={followUpText}
                onChange={e => setFollowUpText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (followUpText.trim() && !loading) {
                      handleSendFollowUp(e);
                    }
                  }
                }}
                disabled={loading}
                rows={3}
                style={{
                  flex: 1,
                  width: '100%',
                  minHeight: '75px',
                  maxHeight: '180px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  lineHeight: '1.4',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <Button type="submit" disabled={!followUpText.trim() || loading} icon={<Send size={16} />} style={{ height: '42px' }}>
                Send
              </Button>
            </form>
          )}
        </Card>
      </div>

    </div>
  );
};
