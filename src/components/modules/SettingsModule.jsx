import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { Save, User, Building2, Link, Bell } from 'lucide-react';

const Section = ({ icon: Icon, title, children }) => (
    <div className="glass-panel p-6 rounded-3xl">
        <h3 className="font-serif text-lg text-accent flex items-center gap-2 mb-5">
            <Icon size={18} />
            {title}
        </h3>
        {children}
    </div>
);

const SettingsModule = () => {
    const { user, organization } = useAuth();
    const [profile, setProfile] = useState({ full_name: '', phone: '' });
    const [orgData, setOrgData] = useState({ name: '', email: '', phone: '', erp_webhook_url: '' });
    const [saving, setSaving] = useState({ profile: false, org: false });
    const [success, setSuccess] = useState({ profile: false, org: false });

    useEffect(() => {
        if (!user) return;
        supabase.from('users').select('full_name, phone').eq('id', user.id).single().then(({ data }) => {
            if (data) setProfile({ full_name: data.full_name || '', phone: data.phone || '' });
        });
    }, [user]);

    useEffect(() => {
        if (!organization) return;
        setOrgData({
            name: organization.name || '',
            email: organization.email || '',
            phone: organization.phone || '',
            erp_webhook_url: organization.erp_webhook_url || '',
        });
    }, [organization]);

    const saveProfile = async (e) => {
        e.preventDefault();
        setSaving(p => ({ ...p, profile: true }));
        await supabase.from('users').update(profile).eq('id', user.id);
        setSaving(p => ({ ...p, profile: false }));
        setSuccess(p => ({ ...p, profile: true }));
        setTimeout(() => setSuccess(p => ({ ...p, profile: false })), 2000);
    };

    const saveOrg = async (e) => {
        e.preventDefault();
        setSaving(p => ({ ...p, org: true }));
        await supabase.from('organizations').update(orgData).eq('id', organization.id);
        setSaving(p => ({ ...p, org: false }));
        setSuccess(p => ({ ...p, org: true }));
        setTimeout(() => setSuccess(p => ({ ...p, org: false })), 2000);
    };

    const InputField = ({ label, value, onChange, type = 'text', placeholder }) => (
        <div>
            <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">{label}</label>
            <input type={type} value={value} onChange={onChange} placeholder={placeholder}
                className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main placeholder:text-muted-text" />
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-slide-in max-w-2xl">
            {/* Profile */}
            <Section icon={User} title="Meu Perfil">
                <form onSubmit={saveProfile} className="space-y-4">
                    <div>
                        <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">E-mail</label>
                        <input disabled value={user?.email || ''} className="w-full bg-surface-3 border border-panel-border/50 rounded-xl py-3 px-4 text-sm text-muted-text opacity-60" />
                    </div>
                    <InputField label="Nome Completo" value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="Seu nome" />
                    <InputField label="Telefone" value={profile.phone} type="tel" onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999" />
                    <button type="submit" disabled={saving.profile}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${success.profile ? 'bg-green-500/20 border border-green-500/40 text-green-400' : 'gold-gradient text-zinc-950 hover:brightness-110'}`}>
                        <Save size={16} />
                        {success.profile ? 'Salvo!' : saving.profile ? 'Salvando...' : 'Salvar Perfil'}
                    </button>
                </form>
            </Section>

            {/* Organization */}
            <Section icon={Building2} title="Organização">
                <form onSubmit={saveOrg} className="space-y-4">
                    <InputField label="Nome do Escritório" value={orgData.name} onChange={e => setOrgData(p => ({ ...p, name: e.target.value }))} placeholder="Falco Assessoria Jurídica" />
                    <InputField label="E-mail" value={orgData.email} type="email" onChange={e => setOrgData(p => ({ ...p, email: e.target.value }))} placeholder="contato@escritorio.com" />
                    <InputField label="Telefone" value={orgData.phone} type="tel" onChange={e => setOrgData(p => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999" />
                    <button type="submit" disabled={saving.org}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${success.org ? 'bg-green-500/20 border border-green-500/40 text-green-400' : 'gold-gradient text-zinc-950 hover:brightness-110'}`}>
                        <Save size={16} />
                        {success.org ? 'Salvo!' : saving.org ? 'Salvando...' : 'Salvar Organização'}
                    </button>
                </form>
            </Section>

            {/* ERP Integration */}
            <Section icon={Link} title="Integração com ERP">
                <div className="space-y-4">
                    <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 text-sm text-muted-text">
                        <strong className="text-accent">Webhook ERP:</strong> Quando um deal atingir a stage "Contrato" no Pipeline,
                        o CRM envia automaticamente os dados do contato para o ERP via webhook.
                    </div>
                    <InputField
                        label="URL do Webhook ERP"
                        value={orgData.erp_webhook_url}
                        onChange={e => setOrgData(p => ({ ...p, erp_webhook_url: e.target.value }))}
                        placeholder="https://erp.falcotech.com.br/api/client"
                    />
                    <button onClick={saveOrg} disabled={saving.org}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${success.org ? 'bg-green-500/20 border border-green-500/40 text-green-400' : 'gold-gradient text-zinc-950 hover:brightness-110'}`}>
                        <Save size={16} />
                        {success.org ? 'Salvo!' : 'Salvar Integração'}
                    </button>
                </div>
            </Section>

            {/* Info */}
            <div className="p-4 rounded-2xl border border-panel-border text-xs text-muted-text">
                <p className="font-bold mb-1">CRM SaaS v1.0 — Antigravity</p>
                <p>ID da Organização: <code className="bg-surface-2 px-1 rounded text-accent/80">{organization?.id?.slice(0, 8) || '—'}</code></p>
            </div>
        </div>
    );
};

export default SettingsModule;
