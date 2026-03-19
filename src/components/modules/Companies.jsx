import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Building2, Globe, Briefcase, Edit2, Trash2, X } from 'lucide-react';

const Companies = () => {
    const { organization } = useAuth();
    const orgId = organization?.id;
    const [companies, setCompanies] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ name: '', website: '', industry: '', notes: '' });
    const [saving, setSaving] = useState(false);

    const industries = ['Advocacia', 'Tecnologia', 'Saúde', 'Educação', 'Comércio', 'Indústria', 'Consultoria', 'Outros'];

    const load = async () => {
        if (!orgId) return;
        setLoading(true);
        const { data } = await supabase.from('companies').select('*').eq('organization_id', orgId).order('created_at', { ascending: false });
        setCompanies(data || []);
        setLoading(false);
    };

    useEffect(() => { load(); }, [orgId]);

    const filtered = companies.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.industry?.toLowerCase().includes(search.toLowerCase()));

    const openNew = () => { setForm({ name: '', website: '', industry: '', notes: '' }); setEditItem(null); setShowModal(true); };
    const openEdit = (c) => { setForm({ name: c.name || '', website: c.website || '', industry: c.industry || '', notes: c.notes || '' }); setEditItem(c); setShowModal(true); };

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editItem) {
                await supabase.from('companies').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editItem.id);
            } else {
                await supabase.from('companies').insert({ ...form, organization_id: orgId });
            }
            setShowModal(false);
            load();
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    const remove = async (id) => {
        if (!confirm('Remover empresa?')) return;
        await supabase.from('companies').delete().eq('id', id);
        load();
    };

    return (
        <div className="space-y-6 animate-fade-slide-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar empresas..."
                        className="w-full bg-surface-2 border border-panel-border rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-accent/50 text-main placeholder:text-muted-text" />
                </div>
                <button onClick={openNew}
                    className="flex items-center gap-2 gold-gradient text-zinc-950 px-4 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-accent/20">
                    <Plus size={16} /> Nova Empresa
                </button>
            </div>

            <p className="text-xs text-muted-text">{filtered.length} empresa{filtered.length !== 1 ? 's' : ''}</p>

            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-panel p-16 rounded-3xl text-center space-y-3">
                    <Building2 size={48} className="mx-auto text-muted-text/40" />
                    <p className="font-serif text-muted-text">Nenhuma empresa cadastrada</p>
                    <button onClick={openNew} className="text-accent text-sm hover:underline">Criar primeira empresa →</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(company => (
                        <div key={company.id} className="glass-panel p-5 rounded-2xl border border-panel-border hover:border-accent/30 transition-all group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold">
                                        {company.name?.charAt(0)?.toUpperCase() || 'E'}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{company.name}</p>
                                        {company.industry && <span className="badge badge-gold">{company.industry}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(company)} className="p-1.5 rounded-lg hover:bg-accent/10 text-muted-text hover:text-accent transition-all"><Edit2 size={14} /></button>
                                    <button onClick={() => remove(company.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-text hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            {company.website && (
                                <div className="flex items-center gap-2 text-xs text-muted-text">
                                    <Globe size={12} className="text-accent/60" />
                                    <a href={company.website} target="_blank" rel="noreferrer" className="hover:text-accent transition-colors truncate">{company.website}</a>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                    <div className="relative bg-panel-bg border border-panel-border rounded-3xl p-8 w-full max-w-md shadow-2xl my-auto max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-serif text-xl text-accent">{editItem ? 'Editar Empresa' : 'Nova Empresa'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-muted-text hover:text-accent rounded-xl hover:bg-accent/10 transition-all"><X size={18} /></button>
                        </div>
                        <form onSubmit={save} className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Nome *</label>
                                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome da empresa"
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main placeholder:text-muted-text" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Website</label>
                                <input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://empresa.com.br"
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main placeholder:text-muted-text" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Setor</label>
                                <select value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main">
                                    <option value="">Selecionar...</option>
                                    {industries.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                            </div>
                            <button type="submit" disabled={saving}
                                className="w-full gold-gradient text-zinc-950 py-3 rounded-xl font-black uppercase tracking-widest text-sm hover:brightness-110 transition-all disabled:opacity-50">
                                {saving ? 'Salvando...' : (editItem ? 'Salvar' : 'Criar Empresa')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Companies;
