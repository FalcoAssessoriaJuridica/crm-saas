import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                setUser(null);
                setUserProfile(null);
                setOrganization(null);
                setIsAuthenticated(false);
                setLoading(false);
                return;
            }

            setUser(authUser);

            // Garante que o perfil existe
            await supabase.from('users').upsert({
                id: authUser.id,
                full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
            }, { onConflict: 'id' });

            // Busca organização do usuário
            const { data: orgUser } = await supabase
                .from('organization_users')
                .select('role, organizations(id, name, plan, erp_webhook_url, email, phone)')
                .eq('user_id', authUser.id)
                .single();

            if (!orgUser) {
                // Primeiro acesso: criar organização padrão
                const orgName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Meu Escritório';
                const { data: newOrg } = await supabase
                    .from('organizations')
                    .insert({ name: orgName })
                    .select()
                    .single();

                if (newOrg) {
                    await supabase.from('organization_users').insert({
                        organization_id: newOrg.id,
                        user_id: authUser.id,
                        role: 'admin',
                    });

                    // Cria pipeline padrão jurídico
                    const { data: pipeline } = await supabase
                        .from('pipelines')
                        .insert({ organization_id: newOrg.id, name: 'Pipeline Jurídico' })
                        .select()
                        .single();

                    if (pipeline) {
                        const defaultStages = ['Lead', 'Triagem', 'Consulta', 'Proposta', 'Contrato', 'Processo'];
                        await supabase.from('stages').insert(
                            defaultStages.map((name, i) => ({ pipeline_id: pipeline.id, name, position: i }))
                        );
                    }

                    setOrganization(newOrg);
                }
            } else {
                setOrganization(orgUser?.organizations || null);
            }

            setUserProfile({
                id: authUser.id,
                email: authUser.email,
                full_name: authUser.user_metadata?.full_name || authUser.email,
                role: orgUser?.role || 'admin',
                avatar_url: authUser.user_metadata?.avatar_url,
            });
            setIsAuthenticated(true);
        } catch (err) {
            console.error('Auth fetch error:', err);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                fetchUserData();
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setUserProfile(null);
                setOrganization(null);
                setIsAuthenticated(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{
            user,
            userProfile,
            organization,
            loading,
            isAuthenticated,
            logout,
            refetch: fetchUserData,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
};
