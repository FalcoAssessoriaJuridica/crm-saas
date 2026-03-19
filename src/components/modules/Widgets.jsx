import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Code, Copy, Check, Radio, X, Eye } from 'lucide-react';

const Widgets = () => {
    const { organization } = useAuth();
    const orgId = organization?.id;
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', fields: ['name', 'phone', 'email', 'message'] });
    const [saving, setSaving] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [previewWidget, setPreviewWidget] = useState(null);
    const [recentSubmissions, setRecentSubmissions] = useState([]);

    const load = async () => {
        if (!orgId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [{ data: formsData, error: formsError }, { data: subs, error: subsError }] = await Promise.all([
                supabase.from('widget_forms').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
                supabase.from('widget_submissions').select('*, widget_forms(name)').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(10),
            ]);

            if (formsError) throw formsError;
            if (subsError) throw subsError;

            setForms(formsData || []);
            setRecentSubmissions(subs || []);
        } catch (err) {
            console.error('Error loading widgets:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [orgId]);

    const saveForm = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await supabase.from('widget_forms').insert({ ...form, organization_id: orgId, fields: JSON.stringify(form.fields) });
            setShowModal(false);
            setForm({ name: '', fields: ['name', 'phone', 'email', 'message'] });
            load();
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    const getEmbedCode = (formId) => {
        const origin = window.location.origin;
        return `<script src="${origin}/crm-widget.js" data-form-id="${formId}" data-org-id="${orgId}"></script>`;
    };

    const copyCode = async (formId) => {
        await navigator.clipboard.writeText(getEmbedCode(formId));
        setCopiedId(formId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-6 animate-fade-slide-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-serif text-lg text-accent">Formulários de Captação</h3>
                            <p className="text-xs text-muted-text mt-0.5">Embede no seu site para captar leads automaticamente</p>
                        </div>
                        <button onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 gold-gradient text-zinc-950 px-4 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-accent/20">
                            <Plus size={16} /> Novo Widget
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                        </div>
                    ) : forms.length === 0 ? (
                        <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
                            <Radio size={40} className="mx-auto text-muted-text/40" />
                            <p className="font-serif text-muted-text">Crie seu primeiro widget de captação</p>
                        </div>
                    ) : forms.map(f => (
                        <div key={f.id} className="glass-panel p-5 rounded-2xl border border-panel-border hover:border-accent/30 transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h4 className="font-semibold">{f.name}</h4>
                                    <p className="text-[11px] text-muted-text">{f.submissions_count || 0} submissões</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setPreviewWidget(f)} className="p-2 rounded-xl hover:bg-accent/10 text-muted-text hover:text-accent transition-all">
                                        <Eye size={16} />
                                    </button>
                                    <button onClick={() => copyCode(f.id)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-panel-border hover:border-accent/50 text-xs font-bold transition-all text-muted-text hover:text-accent">
                                        {copiedId === f.id ? <><Check size={14} className="text-green-400" /> Copiado!</> : <><Copy size={14} /> Copiar Código</>}
                                    </button>
                                </div>
                            </div>
                            <div className="bg-surface-3 rounded-xl p-3 font-mono text-[11px] text-muted-text overflow-x-auto">
                                <Code size={12} className="inline mr-2 text-accent/60" />
                                {getEmbedCode(f.id)}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Submissions */}
                <div className="glass-panel p-5 rounded-3xl">
                    <h4 className="font-serif text-base text-accent mb-4">Submissões Recentes</h4>
                    {recentSubmissions.length === 0 ? (
                        <div className="text-center py-8 text-muted-text/40 text-sm">
                            <p>Nenhuma submissão ainda</p>
                        </div>
                    ) : recentSubmissions.map(sub => {
                        const data = typeof sub.data === 'string' ? JSON.parse(sub.data) : (sub.data || {});
                        return (
                            <div key={sub.id} className="border-b border-panel-border/40 py-3 last:border-0">
                                <p className="text-sm font-semibold">{data.name || 'Sem nome'}</p>
                                <p className="text-[11px] text-muted-text">{data.phone || data.email || '—'}</p>
                                <p className="text-[10px] text-muted-text/60">{sub.widget_forms?.name}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Widget Preview Modal */}
            {previewWidget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setPreviewWidget(null)}>
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                    <div className="relative bg-panel-bg border border-panel-border rounded-3xl p-8 w-full max-w-sm shadow-2xl my-auto max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-serif text-lg text-accent">Preview — {previewWidget.name}</h3>
                            <button onClick={() => setPreviewWidget(null)} className="p-2 text-muted-text hover:text-accent rounded-xl hover:bg-accent/10"><X size={18} /></button>
                        </div>
                        <div className="bg-surface-2 rounded-2xl p-6 border border-panel-border">
                            <h4 className="font-bold text-center mb-1">Entre em Contato</h4>
                            <p className="text-xs text-muted-text text-center mb-4">Sua equipe responde em breve</p>
                            <div className="space-y-3">
                                {['name', 'phone', 'email', 'message'].map(field => (
                                    <div key={field} className="bg-panel-bg rounded-xl px-4 py-3 border border-panel-border text-muted-text text-sm opacity-60">
                                        {field === 'name' && 'Seu nome...'}
                                        {field === 'phone' && 'Seu telefone...'}
                                        {field === 'email' && 'Seu e-mail...'}
                                        {field === 'message' && 'Sua mensagem...'}
                                    </div>
                                ))}
                                <div className="gold-gradient text-zinc-950 py-3 rounded-xl font-black text-center text-sm">
                                    Enviar Mensagem
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Widget Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                    <div className="relative bg-panel-bg border border-panel-border rounded-3xl p-8 w-full max-w-md shadow-2xl my-auto max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-serif text-xl text-accent">Novo Widget</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-muted-text hover:text-accent rounded-xl hover:bg-accent/10"><X size={18} /></button>
                        </div>
                        <form onSubmit={saveForm} className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Nome do Formulário *</label>
                                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Formulário Site Principal"
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main placeholder:text-muted-text" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-2 block">Campos</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['name', 'phone', 'email', 'message', 'company', 'subject'].map(field => (
                                        <label key={field} className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-accent/5 transition-all">
                                            <input type="checkbox" checked={form.fields.includes(field)}
                                                onChange={e => setForm(p => ({
                                                    ...p,
                                                    fields: e.target.checked ? [...p.fields, field] : p.fields.filter(f => f !== field)
                                                }))}
                                                className="accent-amber-500" />
                                            <span className="text-sm capitalize">{field}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" disabled={saving}
                                className="w-full gold-gradient text-zinc-950 py-3 rounded-xl font-black uppercase tracking-widest text-sm hover:brightness-110 transition-all disabled:opacity-50">
                                {saving ? 'Criando...' : 'Criar Widget'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Widgets;
