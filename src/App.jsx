import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import {
    BarChart3, Users, Target, Kanban, Activity,
    Calendar, Zap, Settings as SettingsIcon, LogOut,
    Bell, ChevronLeft, ChevronRight, Menu, X,
    MoreHorizontal, Building2, Radio, MessageSquare
} from 'lucide-react';
import logo from './assets/logo.png';

// ── ThemeToggle ──────────────────────────────────────────
const ThemeToggle = () => {
    const [dark, setDark] = useState(() => !document.documentElement.classList.contains('light'));
    const toggle = () => {
        const html = document.documentElement;
        if (dark) {
            html.classList.add('light');
            html.classList.remove('dark');
        } else {
            html.classList.remove('light');
            html.classList.add('dark');
        }
        setDark(!dark);
        localStorage.setItem('crm_theme', dark ? 'light' : 'dark');
    };
    return (
        <button onClick={toggle} className="p-2 rounded-xl text-muted-text hover:text-accent transition-all hover:bg-accent/10">
            {dark
                ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>
                : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
            }
        </button>
    );
};

// ── Lazy imports dos módulos ─────────────────────────────
import Dashboard from './components/modules/Dashboard';
import Contacts from './components/modules/Contacts';
import Companies from './components/modules/Companies';
import Leads from './components/modules/Leads';
import Pipeline from './components/modules/Pipeline';
import Activities from './components/modules/Activities';
import CalendarModule from './components/modules/CalendarModule';
import Widgets from './components/modules/Widgets';
import Automation from './components/modules/Automation';
import SettingsModule from './components/modules/SettingsModule';
import Chat from './components/modules/Chat';
import ErrorBoundary from './components/ErrorBoundary';

// ── Sidebar Item ─────────────────────────────────────────
const SidebarItem = ({ icon: Icon, label, active, collapsed, onClick }) => (
    <button
        onClick={onClick}
        className={`
      flex items-center w-full p-2.5 my-0.5 rounded-xl transition-all duration-300 group border border-transparent
      ${active
                ? 'bg-accent/20 text-accent border-accent/30 shadow-lg shadow-accent/10'
                : 'text-muted-text hover:bg-accent/10 hover:text-accent hover:border-accent/20'}
      ${collapsed ? 'justify-center' : 'justify-start'}
    `}
    >
        <Icon size={20} className={`flex-shrink-0 transition-all duration-300 ${active ? 'text-accent' : 'group-hover:text-accent group-hover:scale-110'}`} />
        <span className={`
      font-medium tracking-wide transition-all duration-300 overflow-hidden whitespace-nowrap
      ${collapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-4'}
    `}>
            {label}
        </span>
    </button>
);

// ── Bottom Nav Item ──────────────────────────────────────
const BottomNavItem = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center flex-1 py-2 gap-0.5 transition-all duration-200
      ${active ? 'text-accent' : 'text-muted-text'}`}
    >
        <Icon size={22} className={active ? 'text-accent' : ''} />
        <span className="text-[10px] font-semibold tracking-wide leading-tight">{label}</span>
    </button>
);

// ── Main App Shell ───────────────────────────────────────
const AppShell = () => {
    const { userProfile, organization, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [collapsed, setCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [moreSheetOpen, setMoreSheetOpen] = useState(false);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'chat', label: 'Chat WhatsApp', icon: MessageSquare },
        { id: 'contacts', label: 'Contatos', icon: Users },
        { id: 'companies', label: 'Empresas', icon: Building2 },
        { id: 'leads', label: 'Leads', icon: Target },
        { id: 'pipeline', label: 'Pipeline', icon: Kanban },
        { id: 'activities', label: 'Atividades', icon: Activity },
        { id: 'calendar', label: 'Calendário', icon: Calendar },
        { id: 'widgets', label: 'Widgets', icon: Radio },
        { id: 'automation', label: 'Automações', icon: Zap },
    ];

    const bottomNavItems = menuItems.slice(0, 4);
    const moreItems = menuItems.slice(4);

    const navigateTo = (id) => {
        setActiveTab(id);
        setMobileMenuOpen(false);
        setMoreSheetOpen(false);
    };

    const currentLabel = activeTab === 'settings'
        ? 'Configurações'
        : menuItems.find(m => m.id === activeTab)?.label || '';

    return (
        <div className="flex h-screen bg-app-bg text-main font-sans overflow-hidden">

            {/* ── Desktop Sidebar ─────────────────────────────── */}
            <aside className={`
        hidden md:flex relative bg-panel-bg/70 backdrop-blur-xl border-r border-panel-border flex-col transition-all duration-300 ease-in-out z-30
        ${collapsed ? 'w-20' : 'w-72'}
      `}>
                {/* Logo */}
                <div className={`pt-8 flex flex-col items-center justify-center transition-all duration-300 mb-4 ${collapsed ? 'px-2' : 'px-8'}`}>
                    <div className={`transition-all duration-300 overflow-visible transform rounded-2xl ${collapsed ? 'w-10 h-10' : 'w-full aspect-square mb-3 p-3 scale-125 mt-4'}`}>
                        <img
                            src={logo}
                            alt="Logo"
                            className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                        />
                    </div>
                    {!collapsed && (
                        <div className="text-center mt-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-accent/60">CRM Jurídico</p>
                            {organization && (
                                <p className="text-[11px] text-muted-text font-medium truncate max-w-[180px] mt-1">{organization.name}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 flex flex-col gap-y-0.5 overflow-y-auto scrollbar-hide">
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.id}
                            {...item}
                            active={activeTab === item.id}
                            collapsed={collapsed}
                            onClick={() => navigateTo(item.id)}
                        />
                    ))}
                </nav>

                {/* Bottom */}
                <div className="p-4 mt-auto border-t border-panel-border/30 space-y-1">
                    <SidebarItem icon={SettingsIcon} label="Configurações" active={activeTab === 'settings'} collapsed={collapsed} onClick={() => navigateTo('settings')} />
                    <SidebarItem icon={LogOut} label="Sair" collapsed={collapsed} onClick={logout} />
                </div>

                {/* Toggle collapse */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-24 w-7 h-7 bg-accent text-zinc-950 rounded-full flex items-center justify-center hover:opacity-90 shadow-lg shadow-accent/30 transition-all duration-300 z-40"
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </aside>

            {/* ── Main Content ─────────────────────────────────── */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-accent/5 blur-[120px] pointer-events-none rounded-full" />
                <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-accent/5 blur-[100px] pointer-events-none rounded-full" />

                {/* Header */}
                <header className="sticky top-0 z-20 bg-app-bg/70 backdrop-blur-xl border-b border-panel-border px-4 md:px-8 py-3 md:py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button className="md:hidden p-2 text-muted-text hover:text-accent" onClick={() => setMobileMenuOpen(true)}>
                            <Menu size={22} />
                        </button>
                        <div>
                            <h2 className="text-lg md:text-2xl font-black text-accent tracking-tighter uppercase leading-none">{currentLabel}</h2>
                            <p className="hidden md:block text-[10px] text-muted-text font-bold uppercase tracking-widest mt-1 italic">
                                Falco CRM • Captação Jurídica
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <ThemeToggle />
                        <button className="relative p-2 text-muted-text hover:text-accent transition-all">
                            <Bell size={20} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full border-2 border-app-bg" />
                        </button>
                        <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl border-2 border-accent/20 overflow-hidden hover:border-accent transition-all flex items-center justify-center bg-panel-bg">
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.full_name?.split(' ')[0] || 'U')}&background=09090b&color=f59e0b&bold=true`}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="p-4 md:p-8 pt-4 md:pt-6 relative flex-1 overflow-auto pb-24 md:pb-6">
                    <div className="max-w-7xl mx-auto">
                        <ErrorBoundary key={activeTab}>
                            {activeTab === 'dashboard' && <Dashboard />}
                            {activeTab === 'chat' && <Chat />}
                            {activeTab === 'contacts' && <Contacts />}
                            {activeTab === 'companies' && <Companies />}
                            {activeTab === 'leads' && <Leads />}
                            {activeTab === 'pipeline' && <Pipeline />}
                            {activeTab === 'activities' && <Activities />}
                            {activeTab === 'calendar' && <CalendarModule />}
                            {activeTab === 'widgets' && <Widgets />}
                            {activeTab === 'automation' && <Automation />}
                            {activeTab === 'settings' && <SettingsModule />}
                        </ErrorBoundary>
                    </div>
                </div>
            </div>

            {/* ── Mobile Bottom Nav ────────────────────────────── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-panel-bg/90 backdrop-blur-xl border-t border-panel-border flex items-stretch">
                {bottomNavItems.map((item) => (
                    <BottomNavItem key={item.id} {...item} active={activeTab === item.id} onClick={() => navigateTo(item.id)} />
                ))}
                {moreItems.length > 0 && (
                    <BottomNavItem icon={MoreHorizontal} label="Mais" active={moreItems.some(i => i.id === activeTab)} onClick={() => setMoreSheetOpen(true)} />
                )}
            </nav>

            {/* ── More Sheet ───────────────────────────────────── */}
            {moreSheetOpen && (
                <div className="md:hidden fixed inset-0 z-50" onClick={() => setMoreSheetOpen(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="absolute bottom-0 left-0 right-0 bg-panel-bg border-t border-panel-border rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
                        <div className="w-10 h-1 bg-muted-text/30 rounded-full mx-auto mb-6" />
                        <div className="grid grid-cols-3 gap-4">
                            {moreItems.map(item => (
                                <button key={item.id} onClick={() => navigateTo(item.id)}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all
                    ${activeTab === item.id ? 'bg-accent/20 border-accent/30 text-accent' : 'bg-app-bg border-panel-border text-muted-text'}`}>
                                    <item.icon size={24} />
                                    <span className="text-xs font-semibold">{item.label}</span>
                                </button>
                            ))}
                            <button onClick={() => navigateTo('settings')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all
                  ${activeTab === 'settings' ? 'bg-accent/20 border-accent/30 text-accent' : 'bg-app-bg border-panel-border text-muted-text'}`}>
                                <SettingsIcon size={24} />
                                <span className="text-xs font-semibold">Config.</span>
                            </button>
                            <button onClick={logout} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-panel-border bg-app-bg text-red-400">
                                <LogOut size={24} />
                                <span className="text-xs font-semibold">Sair</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Mobile Menu ──────────────────────────────────── */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50" onClick={() => setMobileMenuOpen(false)}>
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                    <div className="absolute top-0 left-0 bottom-0 w-72 bg-panel-bg border-r border-panel-border flex flex-col py-8 px-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-8 px-2">
                            <img src={logo} alt="Logo" className="h-10 object-contain" />
                            <button onClick={() => setMobileMenuOpen(false)} className="text-muted-text"><X size={24} /></button>
                        </div>
                        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
                            {menuItems.map(item => (
                                <button key={item.id} onClick={() => navigateTo(item.id)}
                                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all
                    ${activeTab === item.id ? 'bg-accent/20 text-accent border border-accent/30' : 'text-muted-text hover:bg-accent/10 hover:text-accent'}`}>
                                    <item.icon size={20} />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            ))}
                        </nav>
                        <div className="border-t border-panel-border/30 pt-4 space-y-1">
                            <button onClick={() => navigateTo('settings')} className="flex items-center gap-4 px-4 py-3 rounded-xl text-muted-text hover:bg-accent/10 hover:text-accent w-full">
                                <SettingsIcon size={20} /><span className="font-medium">Configurações</span>
                            </button>
                            <button onClick={logout} className="flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 w-full">
                                <LogOut size={20} /><span className="font-medium">Sair</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Root App ─────────────────────────────────────────────
const App = () => {
    const [themeInit] = useState(() => {
        const saved = localStorage.getItem('crm_theme');
        if (saved === 'light') document.documentElement.classList.add('light');
        return true;
    });

    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

const AppContent = () => {
    const { isAuthenticated, loading, refetch } = useAuth();

    if (loading) {
        return (
            <div className="h-screen bg-app-bg flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                    <p className="text-accent/50 text-xs font-black uppercase tracking-widest">Iniciando CRM...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login onLogin={refetch} />;
    }

    return <AppShell />;
};

export default App;
