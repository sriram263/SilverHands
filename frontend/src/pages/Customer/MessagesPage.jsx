import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getConversations, getConversation, sendMessage, aiDetectScam } from '../../api/client';
import { Send, ShieldAlert, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export const MessagesPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(searchParams.get('conversation') || null);
  const [activeConv, setActiveConv] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [scamWarning, setScamWarning] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    try {
      const res = await getConversations();
      setConversations(res.data || []);
      if (!activeConvId && res.data?.[0]) {
        setActiveConvId(res.data[0].id);
      }
    } catch {}
    setLoading(false);
  };

  const loadActiveConv = async () => {
    if (!activeConvId) return;
    try {
      const res = await getConversation(activeConvId);
      setActiveConv(res.data);
    } catch {}
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    loadActiveConv();
  }, [activeConvId]);

  const handleMessageChange = async (e) => {
    const text = e.target.value;
    setInputMessage(text);
    if (text.length > 8) {
      try {
        const res = await aiDetectScam(text);
        if (res.data.is_scam || res.data.risk_level === 'HIGH' || res.data.risk_level === 'MEDIUM') {
          setScamWarning(res.data);
        } else {
          setScamWarning(null);
        }
      } catch {}
    } else {
      setScamWarning(null);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConvId) return;
    const text = inputMessage;
    setInputMessage('');
    setScamWarning(null);
    try {
      await sendMessage(activeConvId, text);
      loadActiveConv();
    } catch {
      showToast('Failed to send message', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="page-title text-3xl">Direct Messaging</h1>

      <div className="card-surface grid grid-cols-1 md:grid-cols-3 h-[600px] overflow-hidden">
        
        {/* Left Col: Conversation List */}
        <div className="border-r border-warmgray-200 overflow-y-auto p-4 space-y-2 bg-cream-50/60">
          <span className="text-xs font-bold uppercase tracking-wider text-warmgray-500 px-2 block mb-2">
            Conversations
          </span>
          {conversations.length === 0 ? (
            <div className="p-4 text-xs text-warmgray-500 text-center">No active chats</div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={`w-full p-3 rounded-2xl text-left transition-all ${
                  activeConvId === c.id
                    ? 'bg-saffron text-white shadow-warm'
                    : 'bg-white hover:bg-cream-100 border border-warmgray-200/70'
                }`}
              >
                <p className="font-bold text-sm truncate">{c.other_party_name || c.customer_name || 'Artisan'}</p>
                <p className={`text-xs truncate ${activeConvId === c.id ? 'text-white/80' : 'text-warmgray-500'}`}>
                  {c.last_message || 'Start conversation...'}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Right Col: Chat Screen */}
        <div className="md:col-span-2 flex flex-col justify-between h-full bg-white">
          {activeConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-warmgray-200 flex items-center justify-between bg-cream-50">
                <div>
                  <h3 className="font-bold text-sm text-warmgray-900">{activeConv.other_party_name || 'Chat'}</h3>
                  <span className="text-[10px] text-sage-dark font-bold">● Protected Direct Message</span>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-cream-50/30">
                {(activeConv.messages || []).map((m) => {
                  const isMe = m.sender === user?.id || m.sender_name === user?.first_name || m.sender_name === user?.username;
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-saffron text-white rounded-br-none'
                          : 'bg-white text-warmgray-900 border border-warmgray-200 rounded-bl-none'
                      }`}>
                        <p>{m.text}</p>
                        <span className={`text-[9px] block mt-1 ${isMe ? 'text-white/70' : 'text-warmgray-400'}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Real-time Scam Warning Alert */}
              {scamWarning && (
                <div className="p-3 bg-red-50 border-t border-red-200 text-xs text-red-800 flex items-center gap-2 animate-pulse">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  <span><strong>AI Scam Alert:</strong> {scamWarning.explanation || 'Avoid external cash payments.'}</span>
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSend} className="p-3 border-t border-warmgray-200 flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={handleMessageChange}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-warmgray-300 text-sm bg-cream-50 focus:ring-2 focus:ring-saffron"
                />
                <button type="submit" className="btn-primary !px-4">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-warmgray-400">
              Select a conversation to start messaging
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
