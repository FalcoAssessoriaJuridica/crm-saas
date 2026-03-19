import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Calendar, X, Edit2, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TYPE_OPTIONS = ['consulta', 'retorno', 'reunião'];
const STATUS_OPTIONS = ['agendada', 'confirmada', 'realizada', 'cancelada'];
const typeColors = { consulta: 'badge-blue', retorno: 'badge-gold', 'reunião': 'badge-purple' };

const CalendarModule = () => {
    const { organization } = useAuth();
    const orgId = organization?.id;
    const [appointments, setAppointments] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ contact_id: '', date: '', type: 'consulta', status: 'agendada', notes: '' });
    const [saving, setSaving] = useState(false);

    const load = async () => {
        if (!orgId) return;
        setLoading(true);
        const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');
        const [{ data: appts }, { data: conts }] = await Promise.all([
            supabase.from('appointments').select('*, contacts(name, phone)').eq('organization_id', orgId)
                .gte('date', `${startDate}T00:00:00`).lte('date', `${endDate}T23:59:59`).order('date'),
            supabase.from('contacts').select('id, name').eq('organization_id', orgId).order('name'),
        ]);
        setAppointments(appts || []);
        setContacts(conts || []);
        setLoading(false);
    };

    useEffect(() => { load(); }, [orgId, currentDate]);

    const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
    const dayAppointments = (day) => appointments.filter(a => isSameDay(new Date(a.date), day));
    const selectedDayAppts = dayAppointments(selectedDay);

    const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

    const openNew = (day) => {
        const dateStr = format(day || selectedDay, "yyyy-MM-dd'T'HH:mm");
        setForm({ contact_id: '', date: dateStr, type: 'consulta', status: 'agendada', notes: '' });
        setEditItem(null);
        setShowModal(true);
    };
    const openEdit = (a) => {
        setForm({ contact_id: a.contact_id || '', date: a.date?.slice(0, 16) || '', type: a.type || 'consulta', status: a.status || 'agendada', notes: a.notes || '' });
        setEditItem(a);
        setShowModal(true);
    };

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editItem) {
                await supabase.from('appointments').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editItem.id);
            } else {
                await supabase.from('appointments').insert({ ...form, organization_id: orgId });
            }
            setShowModal(false);
            load();
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    const remove = async (id) => {
        if (!confirm('Remover agendamento?')) return;
        await supabase.from('appointments').delete().eq('id', id);
        load();
    };

    const firstDayOfWeek = startOfMonth(currentDate).getDay();

    return (
        <div className="space-y-6 animate-fade-slide-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Grid */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-3xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-serif text-lg text-accent capitalize">
                            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                        </h3>
                        <div className="flex gap-2">
                            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-accent/10 text-muted-text hover:text-accent transition-all">‹</button>
                            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-accent/10 text-muted-text hover:text-accent transition-all">›</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                            <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-muted-text py-1">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
                        {days.map(day => {
                            const appts = dayAppointments(day);
                            const isSelected = isSameDay(day, selectedDay);
                            const todayDay = isToday(day);
                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => setSelectedDay(day)}
                                    className={`aspect-square flex flex-col items-center justify-start p-1 rounded-xl transition-all text-xs font-medium
                    ${isSelected ? 'bg-accent text-zinc-950' : todayDay ? 'border border-accent/50 text-accent' : 'hover:bg-accent/10 text-main'}`}
                                >
                                    <span className="text-xs font-bold">{format(day, 'd')}</span>
                                    {appts.length > 0 && (
                                        <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-zinc-950' : 'bg-accent'}`} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Day Panel */}
                <div className="glass-panel p-6 rounded-3xl flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="font-serif text-sm text-accent capitalize">{format(selectedDay, "EEEE", { locale: ptBR })}</p>
                            <p className="text-2xl font-black">{format(selectedDay, "dd/MM")}</p>
                        </div>
                        <button onClick={() => openNew(selectedDay)}
                            className="p-2 rounded-xl gold-gradient text-zinc-950 hover:brightness-110 transition-all">
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto">
                        {selectedDayAppts.length === 0 ? (
                            <div className="text-center py-8 text-muted-text/50 text-sm">
                                <Calendar size={28} className="mx-auto mb-2" />
                                <p>Nenhum agendamento</p>
                            </div>
                        ) : selectedDayAppts.map(a => (
                            <div key={a.id} className="bg-surface-2 p-3 rounded-xl border border-panel-border hover:border-accent/30 transition-all group">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className={`badge ${typeColors[a.type] || 'badge-gray'} mb-1.5`}>{a.type}</span>
                                        <p className="text-sm font-semibold">{a.contacts?.name || 'Sem contato'}</p>
                                        <p className="text-[11px] text-muted-text">{a.date ? format(new Date(a.date), 'HH:mm') : '--'}</p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-accent/10 text-muted-text hover:text-accent transition-all"><Edit2 size={12} /></button>
                                        <button onClick={() => remove(a.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-text hover:text-red-400 transition-all"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                    <div className="relative bg-panel-bg border border-panel-border rounded-3xl p-8 w-full max-w-md shadow-2xl my-auto max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-serif text-xl text-accent">{editItem ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-muted-text hover:text-accent rounded-xl hover:bg-accent/10 transition-all"><X size={18} /></button>
                        </div>
                        <form onSubmit={save} className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Contato</label>
                                <select value={form.contact_id} onChange={e => setForm(p => ({ ...p, contact_id: e.target.value }))}
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main">
                                    <option value="">Selecionar...</option>
                                    {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Data e Hora *</label>
                                <input type="datetime-local" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                                    className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 text-main" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Tipo</label>
                                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                                        className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent/50 text-main">
                                        {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-black text-accent/70 tracking-widest mb-1 block">Status</label>
                                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                                        className="w-full bg-surface-2 border border-panel-border rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-accent/50 text-main">
                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" disabled={saving}
                                className="w-full gold-gradient text-zinc-950 py-3 rounded-xl font-black uppercase tracking-widest text-sm hover:brightness-110 transition-all disabled:opacity-50">
                                {saving ? 'Salvando...' : (editItem ? 'Salvar' : 'Agendar')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarModule;
