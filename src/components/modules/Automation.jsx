import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Zap, X, Play, Pause } from 'lucide-react';

const TRIGGERS = [
    { id: 'lead_created', label: 'Lead Criado' },
    { id: 'deal_stage_changed', label: 'Deal Mudou de Stage' },
    { id: 'appointment_created', label: 'Agendamento Criado' },
];
const ACTIONS = [
    { id: 'create_activity', label: 'Criar Atividade' },
    { id: 'send_webhook', label: 'Enviar Webhook' },
    { id: 'update_stage', label: 'Atualizar Stage' },
];
const triggerColors = { lead_created: 'badge-blue', deal_stage_changed: 'badge-gold', appointment_created: 'badge-purple' };

const Automation = () => {
    const { organization } = useAuth();
    const orgId = organization?.id;
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', trigger: 'lead_created', action: 'create_activity', config: '{}', active: true });
    const [saving, setSaving] = useState(false);

    const load = async () => {
        if (!orgId) return;
        setLoading(true);
        const { data } = await supabase.from('automation_rules').select('*').eq('organization_id', orgId).order('created_at', { ascending: false });
        setRules(data || []);
        setLoading(false);
    };
    useEffect(() => { load(); }, [orgId]);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await supabase.from('automation_rules').insert({ ...form, organization_id: orgId });
            setShowModal(false);
            setForm({ name: '', trigger: 'lead_created', action: 'create_activity', config: '{}', active: true });
            load();
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    const toggleActive = async (rule) => {
        await supabase.from('automation_rules').update({ active: !rule.active }).eq('id', rule.id);
        load();
    };
    const remove = async (id) => {
        if (!confirm('Remover automação?')) return;
        await supabase.from('automation_rules').delete().eq('id', id);
        load();
    };

    const getTriggerLabel = (id) => TRIGGERS.find(t => t.id === id)?.label || id;
    const getActionLabel = (id) => ACTIONS.find(a => a.id === id)?.label || id;

    return (
        <div className="space-y-6 animate-fade-slide-in">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-serif text-lg text-accent">Automações</h3>
                    <p className="text-xs text-muted-text">Automatize tarefas recorrentes no seu CRM</p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 gold-gradient text-zinc-950 px-4 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-accent/20">
                    <Plus size={16} /> Nova Automação
                </button>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-accent/20 bg-accent/5">
                <p className="text-xs font-bold text-accent mb-2 uppercase tracking-widest">Como funciona</p>
                <div className="flex items-center gap-3 text-sm text-muted-text flex-wrap">
                    <span className="badge badge-blue">Gatilho</span>
                    <span>→</span>
                    <span className="badge badge-green">Ação executada</span>
                </div>
                <p className="text-xs text-muted-text mt-2">Ex: Deal na stage "Contrato" → Webhook para ERP cria o cliente</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                </div>
            ) : rules.length === 0 ? (
                <div className="glass-panel p-16 rounded-3xl text-center space-y-3">
                    <Zap size={40} className="mx-auto text-muted-text/40" />
                    <p className="font-serif text-muted-text">Nenhuma automação configurada</p>
                    <button onClick={() => setShowModal(true)} className="text-accent text-sm hover:underline">Criar primeira automação →</button>
                </div>
            ) : (
                <div className="space-y-3">
                    {rules.map(rule => (
                        <div key={rule.id} className={`glass-panel p-5 rounded-2xl border transition-all group ${rule.active ? 'border-panel-border hover:border-accent/30' : 'border-panel-border opacity-60'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`w-2 h-2 rounded-full mt-2 ${rule.active ? 'bg-green-400' : 'bg-muted-text/30'}`} />
                                    <div>
                                        <p className="font-semibold">{rule.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`badge ${triggerColors[rule.trigger] || 'badge-gray'}`}>{getTriggerLabel(rule.trigger)}</span>
                                            <span className="text-muted-text text-xs">→</span>
                                            <span className="badge badge-green">{getActionLabel(rule.action)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => toggleActive(rule)} className={`p-2 rounded-xl transition-all ${rule.active ? 'text-green-400 hover:bg-green-500/10' : 'text-muted-text hover:bg-accent/10 hover:text-accent'}`}>
                                        {rule.active ? <Pause size={16} /> : <Play size={16} />}
                                    </button>
                                    <button onClick={() => remove(rule.id)} className="p-2 rounded-xl text-muted-text hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                                        <X size={16} />
                                    </button>
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
                            <h3 className="font-serif text-xl text-accent">Nova Automação</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-muted-text hover:text-accent rounded-xl hover:bg-accent/10"><X size={18} /></button>
                        </div>
                        <form onSubmit={save} className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Nome *</label>
                                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Notificar ERP ao fechar contrato"
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main placeholder:text-muted-text" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Gatilho</label>
                                <select value={form.trigger} onChange={e => setForm(p => ({ ...p, trigger: e.target.value }))}
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main">
                                    {TRIGGERS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Ação</label>
                                <select value={form.action} onChange={e => setForm(p => ({ ...p, action: e.target.value }))}
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main">
                                    {ACTIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                                </select>
                            </div>
                            <button type="submit" disabled={saving}
                                className="w-full gold-gradient text-zinc-950 py-3 rounded-xl font-black uppercase tracking-widest text-sm hover:brightness-110 transition-all disabled:opacity-50">
                                {saving ? 'Criando...' : 'Criar Automação'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Automation;
