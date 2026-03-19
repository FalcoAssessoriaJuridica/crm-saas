import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, User, Phone, Mail, Building2, MoreVertical, X, Edit2, Trash2 } from 'lucide-react';

const Contacts = () => {
    const { organization } = useAuth();
    const orgId = organization?.id;
    const [contacts, setContacts] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ name: '', phone: '', email: '', company: '', notes: '' });
    const [saving, setSaving] = useState(false);

    const load = async () => {
        if (!orgId) return;
        setLoading(true);
        const q = supabase.from('contacts').select('*, companies(name)').eq('organization_id', orgId).order('created_at', { ascending: false });
        const { data } = await q;
        setContacts(data || []);
        setLoading(false);
    };

    useEffect(() => { load(); }, [orgId]);

    const filtered = contacts.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search)
    );

    const openNew = () => { setForm({ name: '', phone: '', email: '', company: '', notes: '' }); setEditItem(null); setShowModal(true); };
    const openEdit = (c) => { setForm({ name: c.name || '', phone: c.phone || '', email: c.email || '', company: c.company || '', notes: c.notes || '' }); setEditItem(c); setShowModal(true); };

    const save = async (e) => {
        e.preventDefault();
        if (!orgId) return;
        setSaving(true);
        try {
            if (editItem) {
                await supabase.from('contacts').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editItem.id);
            } else {
                await supabase.from('contacts').insert({ ...form, organization_id: orgId });
            }
            setShowModal(false);
            load();
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    const remove = async (id) => {
        if (!confirm('Remover contato?')) return;
        await supabase.from('contacts').delete().eq('id', id);
        load();
    };

    return (
        <div className="space-y-6 animate-fade-slide-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar contatos..."
                        className="w-full bg-surface-2 border border-panel-border rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-accent/50 text-main placeholder:text-muted-text"
                    />
                </div>
                <button onClick={openNew}
                    className="flex items-center gap-2 gold-gradient text-zinc-950 px-4 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-accent/20">
                    <Plus size={16} /> Novo Contato
                </button>
            </div>

            {/* Count */}
            <p className="text-xs text-muted-text">{filtered.length} contato{filtered.length !== 1 ? 's' : ''}</p>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-panel p-16 rounded-3xl text-center space-y-3">
                    <User size={48} className="mx-auto text-muted-text/40" />
                    <p className="font-serif text-muted-text">Nenhum contato encontrado</p>
                    <button onClick={openNew} className="text-accent text-sm hover:underline">Criar primeiro contato →</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(contact => (
                        <div key={contact.id} className="glass-panel p-5 rounded-2xl border border-panel-border hover:border-accent/30 transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                                        {contact.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-main">{contact.name}</p>
                                        {contact.companies?.name && <p className="text-[11px] text-muted-text">{contact.companies.name}</p>}
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(contact)} className="p-1.5 rounded-lg hover:bg-accent/10 text-muted-text hover:text-accent transition-all">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => remove(contact.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-text hover:text-red-400 transition-all">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                {contact.email && (
                                    <div className="flex items-center gap-2 text-xs text-muted-text">
                                        <Mail size={12} className="text-accent/60" />
                                        <span className="truncate">{contact.email}</span>
                                    </div>
                                )}
                                {contact.phone && (
                                    <div className="flex items-center gap-2 text-xs text-muted-text">
                                        <Phone size={12} className="text-accent/60" />
                                        <span>{contact.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                    <div className="relative bg-panel-bg border border-panel-border rounded-3xl p-8 w-full max-w-md shadow-2xl my-auto max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-serif text-xl text-accent">{editItem ? 'Editar Contato' : 'Novo Contato'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-muted-text hover:text-accent rounded-xl hover:bg-accent/10 transition-all"><X size={18} /></button>
                        </div>
                        <form onSubmit={save} className="space-y-4">
                            {[
                                { label: 'Nome *', key: 'name', type: 'text', required: true, placeholder: 'Nome completo' },
                                { label: 'Telefone', key: 'phone', type: 'tel', placeholder: '(11) 99999-9999' },
                                { label: 'E-mail', key: 'email', type: 'email', placeholder: 'email@exemplo.com' },
                                { label: 'Empresa', key: 'company', type: 'text', placeholder: 'Nome da empresa' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">{f.label}</label>
                                    <input
                                        type={f.type} required={f.required} placeholder={f.placeholder}
                                        value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                        className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main placeholder:text-muted-text"
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Notas</label>
                                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Observações..."
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main placeholder:text-muted-text resize-none"
                                />
                            </div>
                            <button type="submit" disabled={saving}
                                className="w-full gold-gradient text-zinc-950 py-3 rounded-xl font-black uppercase tracking-widest text-sm hover:brightness-110 transition-all disabled:opacity-50">
                                {saving ? 'Salvando...' : (editItem ? 'Salvar Alterações' : 'Criar Contato')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contacts;
