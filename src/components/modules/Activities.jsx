import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Phone, Users, CheckSquare, Mail, X, Edit2, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TYPE_OPTIONS = ['call', 'meeting', 'task', 'email'];
const STATUS_OPTIONS = ['pending', 'done', 'cancelled'];
const typeIcons = { call: '📞', meeting: '🤝', task: '✅', email: '📧' };
const typeLabels = { call: 'Ligação', meeting: 'Reunião', task: 'Tarefa', email: 'E-mail' };
const statusLabels = { pending: 'Pendente', done: 'Concluída', cancelled: 'Cancelada' };
const statusColors = { pending: 'badge-gold', done: 'badge-green', cancelled: 'badge-red' };

const Activities = () => {
    const { organization } = useAuth();
    const orgId = organization?.id;
    const [activities, setActivities] = useState([]);
    const [deals, setDeals] = useState([]);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ deal_id: '', type: 'task', title: '', description: '', due_date: '', status: 'pending' });
    const [saving, setSaving] = useState(false);

    const load = async () => {
        if (!orgId) return;
        setLoading(true);
        const [{ data: acts }, { data: dealsData }] = await Promise.all([
            supabase.from('activities').select('*, deals(title)').eq('organization_id', orgId).order('due_date', { ascending: true, nullsFirst: false }),
            supabase.from('deals').select('id, title').eq('organization_id', orgId).order('title'),
        ]);
        setActivities(acts || []);
        setDeals(dealsData || []);
        setLoading(false);
    };

    useEffect(() => { load(); }, [orgId]);

    const filtered = activities.filter(a => {
        const matchSearch = a.title?.toLowerCase().includes(search.toLowerCase());
        const matchType = !filterType || a.type === filterType;
        const matchStatus = !filterStatus || a.status === filterStatus;
        return matchSearch && matchType && matchStatus;
    });

    const openNew = () => { setForm({ deal_id: '', type: 'task', title: '', description: '', due_date: '', status: 'pending' }); setEditItem(null); setShowModal(true); };
    const openEdit = (a) => { setForm({ deal_id: a.deal_id || '', type: a.type || 'task', title: a.title || '', description: a.description || '', due_date: a.due_date?.slice(0, 16) || '', status: a.status || 'pending' }); setEditItem(a); setShowModal(true); };

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form, deal_id: form.deal_id || null, due_date: form.due_date || null };
            if (editItem) {
                await supabase.from('activities').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editItem.id);
            } else {
                await supabase.from('activities').insert({ ...payload, organization_id: orgId });
            }
            setShowModal(false);
            load();
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    const remove = async (id) => {
        if (!confirm('Remover atividade?')) return;
        await supabase.from('activities').delete().eq('id', id);
        load();
    };

    const toggleStatus = async (a) => {
        const newStatus = a.status === 'done' ? 'pending' : 'done';
        await supabase.from('activities').update({ status: newStatus }).eq('id', a.id);
        load();
    };

    return (
        <div className="space-y-6 animate-fade-slide-in">
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar atividades..."
                        className="w-full bg-surface-2 border border-panel-border rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-accent/50 text-main placeholder:text-muted-text" />
                </div>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                    className="bg-surface-2 border border-panel-border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-accent/50 text-main">
                    <option value="">Tipo</option>
                    {TYPE_OPTIONS.map(t => <option key={t} value={t}>{typeLabels[t]}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="bg-surface-2 border border-panel-border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-accent/50 text-main">
                    <option value="">Status</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                </select>
                <button onClick={openNew}
                    className="flex items-center gap-2 gold-gradient text-zinc-950 px-4 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-accent/20 whitespace-nowrap">
                    <Plus size={16} /> Nova Atividade
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-panel p-16 rounded-3xl text-center space-y-3">
                    <CheckSquare size={48} className="mx-auto text-muted-text/40" />
                    <p className="font-serif text-muted-text">Nenhuma atividade encontrada</p>
                    <button onClick={openNew} className="text-accent text-sm hover:underline">Criar primeira atividade →</button>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(act => (
                        <div key={act.id} className={`glass-panel p-4 rounded-xl border transition-all group flex items-start gap-4
              ${act.status === 'done' ? 'opacity-60' : 'hover:border-accent/30'}`}>
                            <button onClick={() => toggleStatus(act)} className="mt-0.5 shrink-0">
                                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all
                  ${act.status === 'done' ? 'bg-accent border-accent' : 'border-panel-border hover:border-accent'}`}>
                                    {act.status === 'done' && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
                                </div>
                            </button>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span className="text-base mr-2">{typeIcons[act.type]}</span>
                                        <span className={`text-sm font-semibold ${act.status === 'done' ? 'line-through text-muted-text' : ''}`}>{act.title}</span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <button onClick={() => openEdit(act)} className="p-1.5 rounded-lg hover:bg-accent/10 text-muted-text hover:text-accent transition-all"><Edit2 size={13} /></button>
                                        <button onClick={() => remove(act.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-text hover:text-red-400 transition-all"><Trash2 size={13} /></button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    <span className={`badge ${statusColors[act.status] || 'badge-gray'}`}>{statusLabels[act.status] || act.status}</span>
                                    {act.deals?.title && <span className="text-[11px] text-muted-text">{act.deals.title}</span>}
                                    {act.due_date && (
                                        <span className="flex items-center gap-1 text-[11px] text-muted-text">
                                            <Calendar size={10} />
                                            {format(new Date(act.due_date), "dd/MM/yy HH:mm", { locale: ptBR })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                    <div className="relative bg-panel-bg border border-panel-border rounded-3xl p-8 w-full max-w-md shadow-2xl my-auto max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-serif text-xl text-accent">{editItem ? 'Editar Atividade' : 'Nova Atividade'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-muted-text hover:text-accent rounded-xl hover:bg-accent/10 transition-all"><X size={18} /></button>
                        </div>
                        <form onSubmit={save} className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Tipo</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {TYPE_OPTIONS.map(t => (
                                        <button key={t} type="button" onClick={() => setForm(p => ({ ...p, type: t }))}
                                            className={`p-2 rounded-xl text-center text-xs font-bold transition-all border ${form.type === t ? 'bg-accent/20 border-accent/40 text-accent' : 'border-panel-border text-muted-text hover:border-accent/30'}`}>
                                            {typeIcons[t]}<br />{typeLabels[t]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Título *</label>
                                <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Descrição da atividade"
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main placeholder:text-muted-text" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Deal (opcional)</label>
                                <select value={form.deal_id} onChange={e => setForm(p => ({ ...p, deal_id: e.target.value }))}
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main">
                                    <option value="">Nenhum</option>
                                    {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Data/Hora</label>
                                <input type="datetime-local" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main" />
                            </div>
                            <button type="submit" disabled={saving}
                                className="w-full gold-gradient text-zinc-950 py-3 rounded-xl font-black uppercase tracking-widest text-sm hover:brightness-110 transition-all disabled:opacity-50">
                                {saving ? 'Salvando...' : (editItem ? 'Salvar' : 'Criar Atividade')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Activities;
