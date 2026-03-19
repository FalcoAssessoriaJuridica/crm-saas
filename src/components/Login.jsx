import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Lock, Mail, ChevronRight, Scale } from 'lucide-react';
import logo from '../assets/logo.png';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [name, setName] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
            if (authError) throw authError;
            onLogin();
        } catch (err) {
            setError(err.message === 'Invalid login credentials'
                ? 'E-mail ou senha incorretos.'
                : 'Erro: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { error: authError } = await supabase.auth.signUp({
                email, password,
                options: { data: { full_name: name } }
            });
            if (authError) throw authError;
            setError('');
            setMode('login');
            alert('Conta criada! Faça login para continuar.');
        } catch (err) {
            setError('Erro ao criar conta: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen bg-app-bg flex flex-col items-center justify-center p-6 relative overflow-hidden text-main font-sans">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-amber-600/8 blur-[160px] rounded-full -mr-80 -mt-80 animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-amber-600/8 blur-[160px] rounded-full -ml-80 -mb-80 animate-pulse-slow" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.03)_0%,transparent_70%)]" />

            <div className="w-full max-w-md flex flex-col items-center z-10 animate-fade-slide-in">
                {/* Logo */}
                <div className="flex flex-col items-center w-full mb-10">
                    <img
                        src={logo}
                        alt="Falco CRM"
                        className="object-contain drop-shadow-[0_0_40px_rgba(245,158,11,0.3)] hover:scale-105 transition-transform duration-500"
                        style={{ width: '320px', height: 'auto' }}
                    />
                    <div className="flex items-center gap-2 mt-3 text-accent/60">
                        <Scale size={14} />
                        <span className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-text">CRM Jurídico</span>
                        <Scale size={14} />
                    </div>
                </div>

                {/* Card */}
                <div className="glass-panel p-8 rounded-[40px] border border-amber-600/20 shadow-[0_20px_60px_rgba(0,0,0,0.5)] w-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-serif font-bold mb-2 text-accent tracking-tight">
                            {mode === 'login' ? 'Acessar o CRM' : 'Criar Conta'}
                        </h2>
                        <p className="text-muted-text text-xs uppercase tracking-[0.2em] font-medium">
                            {mode === 'login' ? 'Gestão de captação jurídica' : 'Novo escritório na plataforma'}
                        </p>
                    </div>

                    <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-5">
                        {mode === 'register' && (
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-accent/80 tracking-widest ml-1">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-surface-2 border border-panel-border rounded-2xl py-4 px-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm placeholder:text-muted-text text-main"
                                    placeholder="Dr. João Silva"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-accent/80 tracking-widest ml-1">E-mail</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within/input:text-amber-500 transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-surface-2 border border-panel-border rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm placeholder:text-muted-text text-main"
                                    placeholder="contato@escritorio.adv.br"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-accent/80 tracking-widest ml-1">Senha</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within/input:text-amber-500 transition-colors" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-surface-2 border border-panel-border rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all text-sm placeholder:text-muted-text text-main"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-2xl text-red-400 text-xs text-center font-medium animate-fade-slide-in">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full gold-gradient text-zinc-950 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-2xl shadow-amber-600/20 disabled:opacity-50"
                        >
                            <span>{loading ? 'Aguarde...' : (mode === 'login' ? 'Entrar no CRM' : 'Criar Conta')}</span>
                            {!loading && <ChevronRight size={18} />}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                            className="text-xs text-muted-text hover:text-accent transition-colors font-medium"
                        >
                            {mode === 'login' ? 'Não tem conta? Criar agora' : 'Já tem conta? Entrar'}
                        </button>
                    </div>
                </div>

                <div className="mt-10 text-center pointer-events-none opacity-30">
                    <p className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-500">
                        Falco Tech © 2026 • CRM Jurídico SaaS
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
