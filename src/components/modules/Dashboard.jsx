import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { Users, Target, Kanban, Activity, TrendingUp, Clock, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StatCard = ({ title, value, icon: Icon, trend, color = 'accent' }) => (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-accent/40 sidebar-transition border border-panel-border cursor-default">
        <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-panel-bg flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-zinc-950 sidebar-transition border border-panel-border">
                <Icon size={22} />
            </div>
            {trend && (
                <span className="flex items-center text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                    <ArrowUpRight size={10} className="mr-1" />
                    {trend}
                </span>
            )}
        </div>
        <h3 className="text-muted-text text-xs mb-1 uppercase tracking-widest font-bold">{title}</h3>
        <p className="text-4xl font-serif text-main">{value}</p>
        <div className="absolute -right-4 -bottom-4 text-accent/5 rotate-12 group-hover:text-accent/10 sidebar-transition">
            <Icon size={110} />
        </div>
    </div>
);

const Dashboard = () => {
    const { organization } = useAuth();
    const orgId = organization?.id;
    const [stats, setStats] = useState({ contacts: 0, leads: 0, deals: 0, activities: 0, conversion: '0%' });
    const [recentLeads, setRecentLeads] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) return;
        const load = async () => {
            try {
                const [
                    { count: contactCount },
                    { count: leadCount },
                    { count: dealCount },
                    { count: actCount },
                    { data: leads },
                    { data: acts },
                ] = await Promise.all([
                    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
                    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
                    supabase.from('deals').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
                    supabase.from('activities').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
                    supabase.from('leads').select('*, contacts(name, email)').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(5),
                    supabase.from('activities').select('*, deals(title)').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(5),
                ]);

                const conversion = dealCount && leadCount ? Math.round((dealCount / leadCount) * 100) : 0;
                setStats({
                    contacts: contactCount || 0,
                    leads: leadCount || 0,
                    deals: dealCount || 0,
                    activities: actCount || 0,
                    conversion: `${conversion}%`,
                });
                setRecentLeads(leads || []);
                setRecentActivities(acts || []);
            } catch (err) {
                console.error('Dashboard error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [orgId]);

    const statusColors = {
        novo: 'badge-blue',
        qualificado: 'badge-green',
        descartado: 'badge-red',
        convertido: 'badge-gold',
    };

    const activityTypeIcons = { call: '📞', meeting: '🤝', task: '✅', email: '📧' };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-slide-in">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title="Novos Leads" value={stats.leads} icon={Target} trend="+12%" />
                <StatCard title="Deals no Pipeline" value={stats.deals} icon={Kanban} trend="+5%" />
                <StatCard title="Atividades" value={stats.activities} icon={Activity} />
                <StatCard title="Taxa de Conversão" value={stats.conversion} icon={TrendingUp} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Leads */}
                <div className="glass-panel p-6 rounded-3xl">
                    <h3 className="text-lg font-serif mb-5 flex items-center gap-2">
                        <Target size={18} className="text-accent" />
                        Leads Recentes
                    </h3>
                    <div className="space-y-3">
                        {recentLeads.length > 0 ? recentLeads.map((lead) => (
                            <div key={lead.id} className="flex items-center justify-between p-3 bg-surface-2 rounded-xl border border-panel-border hover:border-accent/30 transition-all">
                                <div>
                                    <p className="text-sm font-semibold">{lead.name || lead.contacts?.name || 'Sem contato'}</p>
                                    <p className="text-[10px] text-muted-text uppercase">{lead.source || 'Orgânico'}</p>
                                </div>
                                <span className={`badge ${statusColors[lead.status] || 'badge-gray'}`}>{lead.status || 'novo'}</span>
                            </div>
                        )) : (
                            <div className="text-center py-10 opacity-40">
                                <Clock size={36} className="mx-auto mb-2 text-muted-text" />
                                <p className="text-sm font-serif italic text-muted-text">Nenhum lead ainda</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="glass-panel p-6 rounded-3xl">
                    <h3 className="text-lg font-serif mb-5 flex items-center gap-2">
                        <Activity size={18} className="text-accent" />
                        Atividades Recentes
                    </h3>
                    <div className="space-y-3">
                        {recentActivities.length > 0 ? recentActivities.map((act) => (
                            <div key={act.id} className="flex items-start gap-3 border-l-2 border-accent/20 pl-4 py-1">
                                <span className="text-base">{activityTypeIcons[act.type] || '📋'}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{act.title}</p>
                                    <p className="text-[10px] text-muted-text">{act.deals?.title || 'Deal'}</p>
                                </div>
                                <span className="text-[10px] text-muted-text/60 uppercase font-bold shrink-0">
                                    {act.created_at ? format(new Date(act.created_at), 'HH:mm') : '--'}
                                </span>
                            </div>
                        )) : (
                            <div className="text-center py-10 opacity-40">
                                <Clock size={36} className="mx-auto mb-2 text-muted-text" />
                                <p className="text-sm font-serif italic text-muted-text">Sem atividades recentes</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
