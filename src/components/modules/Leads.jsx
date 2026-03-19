import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Target, X, Edit2, Trash2, ArrowRight, Bot, Cpu, Pause, Play } from 'lucide-react';

const SOURCE_OPTIONS = ['Site', 'WhatsApp', 'Indicação', 'Google Ads', 'Instagram', 'Redes Sociais', 'Widget', 'Outros'];
const STATUS_OPTIONS = ['novo', 'qualificado', 'em_contato', 'proposta', 'descartado', 'convertido'];

const statusLabels = {
    novo: 'Novo', qualificado: 'Qualificado', em_contato: 'Em Contato',
    proposta: 'Proposta', descartado: 'Descartado', convertido: 'Convertido',
};
const statusColors = {
    novo: 'badge-blue', qualificado: 'badge-green', em_contato: 'badge-gold',
    proposta: 'badge-purple', descartado: 'badge-red', convertido: 'badge-green',
};

const Leads = () => {
    const { organization } = useAuth();
    const orgId = organization?.id;
    const [leads, setLeads] = useState([]);
    const [whatsappSessions, setWhatsappSessions] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ contact_id: '', name: '', phone: '', source: '', status: 'novo', notes: '' });
    const [saving, setSaving] = useState(false);
    const [isConverting, setIsConverting] = useState(false);

    const load = async () => {
        if (!orgId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [
                { data: leadsData, error: leadsError },
                { data: contactsData, error: contactsError },
                { data: sessionsData, error: sessionsError }
            ] = await Promise.all([
                supabase.from('leads').select('*, contacts(name, email, phone)').eq('organization_id', orgId).order('created_at', { ascending: false }),
                supabase.from('contacts').select('id, name').eq('organization_id', orgId).order('name'),
                supabase.from('whatsapp_sessions').select('*').eq('organization_id', orgId)
            ]);

            if (leadsError) throw leadsError;
            if (contactsError) throw contactsError;

            setLeads(leadsData || []);
            setContacts(contactsData || []);
            setWhatsappSessions(sessionsData || []);
        } catch (err) {
            console.error('Error loading leads:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [orgId]);

    const filtered = leads.filter(l => {
        const matchSearch = l.contacts?.name?.toLowerCase().includes(search.toLowerCase()) || l.source?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !filterStatus || l.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const openNew = () => { setForm({ contact_id: '', name: '', phone: '', source: '', status: 'novo', notes: '' }); setEditItem(null); setShowModal(true); };
    const openEdit = (l) => { setForm({ contact_id: l.contact_id || '', name: l.name || '', phone: l.phone || '', source: l.source || '', status: l.status || 'novo', notes: l.notes || '' }); setEditItem(l); setShowModal(true); };

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editItem) {
                await supabase.from('leads').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editItem.id);
            } else {
                await supabase.from('leads').insert({ ...form, organization_id: orgId });
            }
            setShowModal(false);
            load();
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    const remove = async (id) => {
        if (!confirm('Remover lead?')) return;
        await supabase.from('leads').delete().eq('id', id);
        load();
    };

    const updateStatus = async (id, status) => {
        await supabase.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
        load();
    };

    const toggleAI = async (phone, currentStatus) => {
        if (!phone) return;
        try {
            const { error } = await supabase
                .from('whatsapp_sessions')
                .update({ is_ai_active: !currentStatus, updated_at: new Date().toISOString() })
                .eq('phone', phone);

            if (error) throw error;
            load();
        } catch (err) {
            console.error('Error toggling AI:', err);
        }
    };

    const convertToContact = async () => {
        if (!editItem || !form.name) return;
        setIsConverting(true);
        try {
            // 1. Criar novo contato
            const { data: contact, error: contactError } = await supabase.from('contacts').insert({
                name: form.name,
                phone: form.phone,
                organization_id: orgId,
                notes: `Convertido de lead: ${form.notes || ''}`
            }).select().single();

            if (contactError) throw contactError;

            // 2. Vincular lead ao novo contato
            await supabase.from('leads').update({
                contact_id: contact.id,
                updated_at: new Date().toISOString()
            }).eq('id', editItem.id);

            alert('Lead convertido em contato com sucesso!');
            setShowModal(false);
            load();
        } catch (err) {
            console.error('Erro ao converter:', err);
            alert('Erro ao converter lead.');
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-slide-in">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar leads..."
                        className="w-full bg-surface-2 border border-panel-border rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-accent/50 text-main placeholder:text-muted-text" />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="bg-surface-2 border border-panel-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-accent/50 text-main">
                    <option value="">Todos os Status</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                </select>
                <button onClick={openNew}
                    className="flex items-center gap-2 gold-gradient text-zinc-950 px-4 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-accent/20 whitespace-nowrap">
                    <Plus size={16} /> Novo Lead
                </button>
            </div>

            {/* Status counters */}
            <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(s => {
                    const count = leads.filter(l => l.status === s).length;
                    return count > 0 ? (
                        <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
                            className={`badge ${statusColors[s]} cursor-pointer hover:opacity-80 transition-opacity ${filterStatus === s ? 'ring-2 ring-current' : ''}`}>
                            {statusLabels[s]} ({count})
                        </button>
                    ) : null;
                })}
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-panel p-16 rounded-3xl text-center space-y-3">
                    <Target size={48} className="mx-auto text-muted-text/40" />
                    <p className="font-serif text-muted-text">Nenhum lead encontrado</p>
                    <button onClick={openNew} className="text-accent text-sm hover:underline">Criar primeiro lead →</button>
                </div>
            ) : (
                <div className="glass-panel rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-panel-border">
                                <th className="text-left p-4 text-[10px] uppercase tracking-widest font-black text-muted-text">Contato</th>
                                <th className="text-left p-4 text-[10px] uppercase tracking-widest font-black text-muted-text hidden md:table-cell">Data</th>
                                <th className="text-left p-4 text-[10px] uppercase tracking-widest font-black text-muted-text hidden md:table-cell">Origem</th>
                                <th className="text-left p-4 text-[10px] uppercase tracking-widest font-black text-muted-text hidden lg:table-cell">Resumo</th>
                                <th className="text-left p-4 text-[10px] uppercase tracking-widest font-black text-muted-text">Status</th>
                                <th className="text-center p-4 text-[10px] uppercase tracking-widest font-black text-muted-text">IA</th>
                                <th className="text-right p-4 text-[10px] uppercase tracking-widest font-black text-muted-text">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((lead, i) => (
                                <tr key={lead.id} className={`border-b border-panel-border/40 hover:bg-accent/5 transition-all ${i % 2 === 0 ? '' : 'bg-surface-2/30'}`}>
                                    <td className="p-4">
                                        <div>
                                            <p className="font-semibold text-sm">{lead.name || lead.contacts?.name || 'Sem contato'}</p>
                                            <p className="text-[11px] text-muted-text">{lead.phone || lead.contacts?.phone || lead.contacts?.email || '—'}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 hidden md:table-cell">
                                        <span className="text-xs text-muted-text">
                                            {lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : '—'}
                                        </span>
                                    </td>
                                    <td className="p-4 hidden md:table-cell">
                                        <span className="text-sm text-muted-text">{lead.source || '—'}</span>
                                    </td>
                                    <td className="p-4 hidden lg:table-cell max-w-xs">
                                        <p className="text-[11px] text-muted-text line-clamp-2" title={lead.case_summary || lead.notes}>
                                            {lead.case_summary || lead.notes || '—'}
                                        </p>
                                    </td>
                                    <td className="p-4">
                                        <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)}
                                            className={`badge ${statusColors[lead.status] || 'badge-gray'} cursor-pointer bg-transparent border-0 focus:outline-none`}>
                                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-4 text-center">
                                        {(lead.source === 'WhatsApp' || lead.phone) ? (
                                            (() => {
                                                const session = whatsappSessions.find(s => s.phone === lead.phone);
                                                const isActive = session ? session.is_ai_active : false;
                                                return (
                                                    <button
                                                        onClick={() => toggleAI(lead.phone, isActive)}
                                                        className={`p-2 rounded-full transition-all ${isActive ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
                                                        title={isActive ? "Pausar Assistente Virtual" : "Ativar Assistente Virtual"}
                                                    >
                                                        {isActive ? <Cpu size={14} className="animate-pulse" /> : <Pause size={14} />}
                                                    </button>
                                                );
                                            })()
                                        ) : <span className="text-muted-text/30">—</span>}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-1 justify-end">
                                            <button onClick={() => openEdit(lead)} className="p-1.5 rounded-lg hover:bg-accent/10 text-muted-text hover:text-accent transition-all"><Edit2 size={14} /></button>
                                            <button onClick={() => remove(lead.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-text hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                    <div className="relative bg-panel-bg border border-panel-border rounded-3xl p-8 w-full max-w-md shadow-2xl my-auto max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-serif text-xl text-accent">{editItem ? 'Editar Lead' : 'Novo Lead'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-muted-text hover:text-accent rounded-xl hover:bg-accent/10 transition-all"><X size={18} /></button>
                        </div>
                        <form onSubmit={save} className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Contato Existente</label>
                                <select value={form.contact_id} onChange={e => setForm(p => ({ ...p, contact_id: e.target.value }))}
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main">
                                    <option value="">Nenhum (Criar/Usar dados abaixo)</option>
                                    {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            {!form.contact_id && (
                                <div className="grid grid-cols-2 gap-3 p-3 bg-accent/5 border border-accent/20 rounded-2xl">
                                    <div className="col-span-2">
                                        <p className="text-[9px] uppercase font-bold text-accent mb-2">Dados do Novo Contato</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Nome *</label>
                                        <input required={!form.contact_id} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                            className="w-full bg-surface-2 border border-panel-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-accent/50 text-main" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">WhatsApp</label>
                                        <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                            className="w-full bg-surface-2 border border-panel-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-accent/50 text-main" />
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Origem</label>
                                <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main">
                                    <option value="">Selecionar...</option>
                                    {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Status</label>
                                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main">
                                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Notas</label>
                                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Observações sobre o lead..."
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main placeholder:text-muted-text resize-none" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="submit" disabled={saving}
                                    className="flex-1 gold-gradient text-zinc-950 py-3 rounded-xl font-black uppercase tracking-widest text-sm hover:brightness-110 transition-all disabled:opacity-50">
                                    {saving ? 'Salvando...' : (editItem ? 'Salvar' : 'Criar Lead')}
                                </button>
                                {editItem && !editItem.contact_id && (
                                    <button type="button" onClick={convertToContact} disabled={isConverting || !form.name}
                                        className="px-4 bg-zinc-800 border border-panel-border text-accent rounded-xl text-xs font-bold hover:bg-zinc-700 transition-all disabled:opacity-50">
                                        {isConverting ? '...' : 'Virar Contato'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leads;
