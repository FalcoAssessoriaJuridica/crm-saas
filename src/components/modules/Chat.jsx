import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    MessageSquare, Send, Bot, User, Cpu, Pause,
    Play, Search, MoreVertical, CheckCheck, Clock
} from 'lucide-react';

const Chat = () => {
    const { organization } = useAuth();
    const orgId = organization?.id;
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!orgId) return;

        const loadSessions = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('whatsapp_sessions')
                .select(`
                    *,
                    leads(name, phone)
                `)
                .eq('organization_id', orgId)
                .order('last_message_at', { ascending: false });

            if (!error) setSessions(data || []);
            setLoading(false);
        };

        loadSessions();

        // Real-time sessions
        const sessionSub = supabase
            .channel('whatsapp_sessions_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_sessions', filter: `organization_id=eq.${orgId}` }, () => {
                loadSessions();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(sessionSub);
        };
    }, [orgId]);

    useEffect(() => {
        if (!selectedSession) return;

        const loadMessages = async () => {
            const { data, error } = await supabase
                .from('whatsapp_messages')
                .select('*')
                .eq('session_id', selectedSession.id)
                .order('created_at', { ascending: true });

            if (!error) setMessages(data || []);
            setTimeout(scrollToBottom, 100);
        };

        loadMessages();

        // Real-time messages
        const msgSub = supabase
            .channel(`messages_${selectedSession.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages', filter: `session_id=eq.${selectedSession.id}` }, (payload) => {
                setMessages(prev => [...prev, payload.new]);
                setTimeout(scrollToBottom, 100);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(msgSub);
        };
    }, [selectedSession]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedSession) return;

        const text = newMessage;
        setNewMessage('');

        try {
            // Envia via Edge Function (isso já salva no banco e silencia a IA)
            const { error } = await supabase.functions.invoke('whatsapp-send', {
                body: {
                    phone: selectedSession.phone,
                    message: text,
                    threadId: selectedSession.metadata?.thread_id
                }
            });

            if (error) throw error;

            // Otimismo: A mensagem aparecerá via Real-time do Supabase
            console.log('Mensagem enviada via API');

        } catch (err) {
            console.error('Erro ao enviar mensagem:', err);
        }
    };

    const toggleAI = async (id, currentStatus) => {
        await supabase
            .from('whatsapp_sessions')
            .update({ is_ai_active: !currentStatus })
            .eq('id', id);
    };

    const filteredSessions = sessions.filter(s =>
        s.phone?.includes(search) ||
        s.metadata?.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.leads?.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-140px)] bg-panel-bg/40 backdrop-blur-xl border border-panel-border rounded-3xl overflow-hidden shadow-2xl animate-fade-in">
            {/* Sidebar de Conversas */}
            <div className="w-80 border-r border-panel-border flex flex-col bg-surface-1/50">
                <div className="p-4 border-b border-panel-border space-y-4">
                    <h2 className="text-accent font-serif text-xl flex items-center gap-2">
                        <MessageSquare size={20} /> Conversas
                    </h2>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar contato..."
                            className="w-full bg-surface-2/50 border border-panel-border rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-accent/40 text-main"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-1">
                    {loading ? (
                        <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" /></div>
                    ) : filteredSessions.length === 0 ? (
                        <p className="text-center py-8 text-xs text-muted-text">Nenhuma conversa encontrada</p>
                    ) : filteredSessions.map(session => (
                        <button
                            key={session.id}
                            onClick={() => setSelectedSession(session)}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border border-transparent ${selectedSession?.id === session.id ? 'bg-accent/15 border-accent/30 shadow-lg' : 'hover:bg-accent/5'}`}
                        >
                            <div className="relative">
                                <div className="w-12 h-12 rounded-xl border border-accent/20 overflow-hidden bg-panel-bg flex items-center justify-center">
                                    <User size={20} className="text-accent/40" />
                                </div>
                                {session.is_ai_active && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-panel-bg flex items-center justify-center">
                                        <Bot size={8} className="text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-left overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-sm truncate text-main">{session.leads?.name || session.metadata?.name || 'Cliente'}</p>
                                    <span className="text-[10px] text-muted-text">{session.last_message_at ? new Date(session.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                </div>
                                <p className="text-[11px] text-muted-text truncate">{session.phone}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Área do Chat */}
            <div className="flex-1 flex flex-col bg-app-bg/20">
                {selectedSession ? (
                    <>
                        {/* Header do Chat */}
                        <div className="p-4 border-b border-panel-border flex items-center justify-between bg-surface-1/30 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl border border-accent/20 bg-panel-bg flex items-center justify-center">
                                    <User size={18} className="text-accent/50" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-main">{selectedSession.leads?.name || 'Cliente WhatsApp'}</h4>
                                    <span className="text-[10px] text-green-400 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Online via WhatsApp
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${selectedSession.is_ai_active ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                                    <Bot size={14} className={selectedSession.is_ai_active ? 'animate-bounce' : ''} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{selectedSession.is_ai_active ? 'IA Ativa' : 'IA Pausada'}</span>
                                    <button
                                        onClick={() => toggleAI(selectedSession.id, selectedSession.is_ai_active)}
                                        className={`ml-2 p-1 rounded-lg hover:bg-white/10 transition-all`}
                                    >
                                        {selectedSession.is_ai_active ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                                    </button>
                                </div>
                                <button className="p-2 text-muted-text hover:text-accent rounded-xl hover:bg-accent/10 transition-all">
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Mensagens */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                            {messages.map((msg, i) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} animate-scale-in`}>
                                    <div className={`max-w-[70%] group`}>
                                        <div className={`
                                            p-4 rounded-2xl text-sm relative
                                            ${msg.role === 'user'
                                                ? 'bg-surface-2 border border-panel-border text-main rounded-tl-none'
                                                : 'gold-gradient text-zinc-950 font-medium rounded-tr-none shadow-lg shadow-accent/10'}
                                        `}>
                                            {msg.content}
                                            <div className={`flex items-center gap-1 mt-1 justify-end opacity-50 text-[9px]`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {msg.role === 'assistant' && <CheckCheck size={10} />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-panel-border bg-surface-1/30">
                            <div className="relative flex items-center gap-2">
                                <div className="flex-1 relative">
                                    <input
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Digite sua mensagem (IA será pausada ao enviar)..."
                                        className="w-full bg-surface-2/80 border border-panel-border rounded-2xl py-3.5 px-5 pr-12 text-sm focus:outline-none focus:border-accent/40 text-main placeholder:text-muted-text/50"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-text hover:text-accent"
                                    >
                                        <Bot size={18} />
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    className="p-3.5 gold-gradient text-zinc-950 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                            <p className="text-[10px] text-center text-muted-text mt-3 uppercase tracking-tighter">
                                Falco AI • Monitoramento em Tempo Real
                            </p>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                        <div className="w-24 h-24 rounded-3xl bg-accent/10 flex items-center justify-center text-accent animate-pulse">
                            <MessageSquare size={48} />
                        </div>
                        <h3 className="text-xl font-serif text-accent">Central de Mensagens</h3>
                        <p className="text-muted-text max-w-xs text-sm">Selecione uma conversa ao lado para visualizar o histórico e interagir em tempo real.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
