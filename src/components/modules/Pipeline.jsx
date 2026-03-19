import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { Plus, DollarSign, X, ChevronRight, AlertCircle, ExternalLink } from 'lucide-react';

const ERP_WEBHOOK_URL = 'https://erp.falcotech.com.br/api/client';

const stageColors = {
    'Lead': 'bg-blue-500/20 border-blue-500/40 text-blue-400',
    'Triagem': 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
    'Consulta': 'bg-orange-500/20 border-orange-500/40 text-orange-400',
    'Proposta': 'bg-purple-500/20 border-purple-500/40 text-purple-400',
    'Contrato': 'bg-green-500/20 border-green-500/40 text-green-400',
    'Processo': 'bg-accent/20 border-accent/40 text-accent',
};

const Pipeline = () => {
    const { organization } = useAuth();
    const orgId = organization?.id;
    const [pipelines, setPipelines] = useState([]);
    const [activePipeline, setActivePipeline] = useState(null);
    const [stages, setStages] = useState([]);
    const [deals, setDeals] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDealModal, setShowDealModal] = useState(false);
    const [dealForm, setDealForm] = useState({ title: '', contact_id: '', stage_id: '', value: '', notes: '' });
    const [saving, setSaving] = useState(false);
    const [dragging, setDragging] = useState(null);
    const [dragOver, setDragOver] = useState(null);
    const [webhookSent, setWebhookSent] = useState(null);

    const load = async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            const [{ data: pips }, { data: conts }] = await Promise.all([
                supabase.from('pipelines').select('*, stages(id, name, position)').eq('organization_id', orgId).order('created_at'),
                supabase.from('contacts').select('id, name, email, phone').eq('organization_id', orgId).order('name'),
            ]);
            setPipelines(pips || []);
            setContacts(conts || []);
            if (pips?.length > 0) {
                const first = pips[0];
                setActivePipeline(first);
                const sortedStages = (first.stages || []).sort((a, b) => a.position - b.position);
                setStages(sortedStages);
                await loadDeals(first.id);
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const loadDeals = async (pipelineId) => {
        const { data } = await supabase
            .from('deals')
            .select('*, contacts(name, email, phone), stages(name)')
            .eq('pipeline_id', pipelineId)
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false });
        setDeals(data || []);
    };

    useEffect(() => { load(); }, [orgId]);

    const switchPipeline = async (pip) => {
        setActivePipeline(pip);
        const sortedStages = (pip.stages || []).sort((a, b) => a.position - b.position);
        setStages(sortedStages);
        await loadDeals(pip.id);
    };

    // Drag & Drop
    const onDragStart = (e, deal) => {
        setDragging(deal);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e, stageId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOver(stageId);
    };

    const onDrop = async (e, stageId) => {
        e.preventDefault();
        if (!dragging || dragging.stage_id === stageId) { setDragging(null); setDragOver(null); return; }

        const targetStage = stages.find(s => s.id === stageId);

        // Update in DB
        await supabase.from('deals').update({
            stage_id: stageId,
            updated_at: new Date().toISOString(),
        }).eq('id', dragging.id);

        // Trigger webhook if stage = Contrato
        if (targetStage?.name === 'Contrato') {
            const contact = contacts.find(c => c.id === dragging.contact_id) || dragging.contacts;
            if (contact) {
                triggerERPWebhook({
                    name: contact.name,
                    phone: contact.phone || '',
                    email: contact.email || '',
                    case_type: dragging.title || '',
                    source: 'CRM Pipeline',
                });
            }
        }

        setDragging(null);
        setDragOver(null);
        await loadDeals(activePipeline.id);
    };

    const triggerERPWebhook = async (payload) => {
        try {
            const res = await fetch(ERP_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(5000),
            });
            setWebhookSent({ success: res.ok, payload });
        } catch {
            setWebhookSent({ success: false, payload });
        }
        setTimeout(() => setWebhookSent(null), 6000);
    };

    const saveDeal = async (e) => {
        e.preventDefault();
        if (!activePipeline) return;
        setSaving(true);
        try {
            await supabase.from('deals').insert({
                organization_id: orgId,
                pipeline_id: activePipeline.id,
                contact_id: dealForm.contact_id || null,
                stage_id: dealForm.stage_id || stages[0]?.id,
                title: dealForm.title,
                value: parseFloat(dealForm.value) || 0,
                notes: dealForm.notes,
                status: 'open',
            });
            setShowDealModal(false);
            setDealForm({ title: '', contact_id: '', stage_id: '', value: '', notes: '' });
            await loadDeals(activePipeline.id);
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    const dealsByStage = (stageId) => deals.filter(d => d.stage_id === stageId);

    const formatValue = (v) => v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : null;

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-5 animate-fade-slide-in">
            {/* Webhook notification */}
            {webhookSent && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-2xl border shadow-2xl transition-all ${webhookSent.success ? 'bg-green-950/90 border-green-500/40 text-green-400' : 'bg-red-950/90 border-red-500/40 text-red-400'}`}>
                    <div className="flex items-center gap-3">
                        <AlertCircle size={18} />
                        <div>
                            <p className="font-bold text-sm">{webhookSent.success ? '✅ ERP Notificado!' : '⚠️ Webhook falhou'}</p>
                            <p className="text-xs opacity-70">Deal movido para Contrato → {webhookSent.payload?.name}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Pipeline selector + New Deal */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {pipelines.map(pip => (
                        <button key={pip.id} onClick={() => switchPipeline(pip)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${pip.id === activePipeline?.id ? 'bg-accent/20 border-accent/40 text-accent' : 'border-panel-border text-muted-text hover:border-accent/30 hover:text-accent bg-surface-2'}`}>
                            {pip.name}
                        </button>
                    ))}
                </div>
                <button onClick={() => setShowDealModal(true)}
                    className="flex items-center gap-2 gold-gradient text-zinc-950 px-4 py-2 rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-accent/20">
                    <Plus size={16} /> Novo Deal
                </button>
            </div>

            {/* Kanban Board */}
            {activePipeline ? (
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:-mx-8 md:px-8">
                    {stages.map(stage => {
                        const stageDeals = dealsByStage(stage.id);
                        const stageValue = stageDeals.reduce((acc, d) => acc + (parseFloat(d.value) || 0), 0);
                        const colorClass = stageColors[stage.name] || 'bg-surface-2 border-panel-border text-muted-text';

                        return (
                            <div
                                key={stage.id}
                                className={`flex-shrink-0 w-64 md:w-72 bg-kanban-col border rounded-2xl overflow-hidden transition-all ${dragOver === stage.id ? 'border-accent/60 bg-accent/5' : 'border-panel-border'}`}
                                onDragOver={e => onDragOver(e, stage.id)}
                                onDrop={e => onDrop(e, stage.id)}
                                onDragLeave={() => setDragOver(null)}
                            >
                                {/* Stage header */}
                                <div className={`p-3 border-b ${colorClass} border-opacity-40`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black uppercase tracking-widest">{stage.name}</span>
                                        <span className="text-xs font-black">{stageDeals.length}</span>
                                    </div>
                                    {stageValue > 0 && <p className="text-[10px] opacity-70 mt-0.5">{formatValue(stageValue)}</p>}
                                </div>

                                {/* Cards */}
                                <div className="p-3 space-y-2 min-h-[200px]">
                                    {stageDeals.map(deal => (
                                        <div
                                            key={deal.id}
                                            draggable
                                            onDragStart={e => onDragStart(e, deal)}
                                            className={`kanban-card ${dragging?.id === deal.id ? 'dragging' : ''}`}
                                        >
                                            <p className="font-semibold text-sm mb-1 leading-tight">{deal.title || deal.contacts?.name || 'Deal sem título'}</p>
                                            {deal.contacts?.name && deal.title && (
                                                <p className="text-[11px] text-muted-text mb-2">{deal.contacts.name}</p>
                                            )}
                                            <div className="flex items-center justify-between">
                                                {deal.value > 0 && (
                                                    <span className="flex items-center gap-1 text-[11px] text-accent font-bold">
                                                        <DollarSign size={10} />
                                                        {formatValue(deal.value)}
                                                    </span>
                                                )}
                                                <ChevronRight size={14} className="text-muted-text/40 ml-auto" />
                                            </div>
                                        </div>
                                    ))}
                                    {stageDeals.length === 0 && (
                                        <div className="text-center py-8 text-muted-text/30 text-xs">Arraste deals aqui</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass-panel p-16 rounded-3xl text-center">
                    <p className="font-serif text-muted-text">Nenhum pipeline configurado</p>
                </div>
            )}

            {/* Deal Modal */}
            {showDealModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowDealModal(false)}>
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                    <div className="relative bg-panel-bg border border-panel-border rounded-3xl p-8 w-full max-w-md shadow-2xl my-auto max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-serif text-xl text-accent">Novo Deal</h3>
                            <button onClick={() => setShowDealModal(false)} className="p-2 text-muted-text hover:text-accent rounded-xl hover:bg-accent/10 transition-all"><X size={18} /></button>
                        </div>
                        <form onSubmit={saveDeal} className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Título *</label>
                                <input required value={dealForm.title} onChange={e => setDealForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Processo Trabalhista - João"
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main placeholder:text-muted-text" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Contato</label>
                                <select value={dealForm.contact_id} onChange={e => setDealForm(p => ({ ...p, contact_id: e.target.value }))}
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main">
                                    <option value="">Sem contato</option>
                                    {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Stage Inicial</label>
                                <select value={dealForm.stage_id} onChange={e => setDealForm(p => ({ ...p, stage_id: e.target.value }))}
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main">
                                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Valor (R$)</label>
                                <input type="number" step="0.01" min="0" value={dealForm.value} onChange={e => setDealForm(p => ({ ...p, value: e.target.value }))} placeholder="0,00"
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main placeholder:text-muted-text" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Notas</label>
                                <textarea value={dealForm.notes} onChange={e => setDealForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main resize-none" />
                            </div>
                            <button type="submit" disabled={saving}
                                className="w-full gold-gradient text-zinc-950 py-3 rounded-xl font-black uppercase tracking-widest text-sm hover:brightness-110 transition-all disabled:opacity-50">
                                {saving ? 'Criando...' : 'Criar Deal'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pipeline;
