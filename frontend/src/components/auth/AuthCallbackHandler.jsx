import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import supabase from '../../lib/supabase.js';
import { Loader2 } from 'lucide-react';

/**
 * AuthCallbackHandler
 *
 * Rendered at /auth/callback — the URL Supabase redirects to after
 * the Google OAuth flow completes.
 */
export default function AuthCallbackHandler() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const portalParam = searchParams.get('portal') || sessionStorage.getItem('auth_portal');
    const targetRoute = portalParam === 'government' ? '/government' : '/dashboard';

    // Give Supabase a moment to process the URL hash/code, then check session
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        sessionStorage.removeItem('auth_portal');
        navigate(targetRoute, { replace: true });
      } else if (event === 'SIGNED_OUT') {
        navigate(portalParam === 'government' ? '/government/login' : '/login', { replace: true });
      }
    });

    // Fallback timer in case onAuthStateChange event fired before listener attached
    const fallback = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        sessionStorage.removeItem('auth_portal');
        navigate(targetRoute, { replace: true });
      } else {
        navigate(portalParam === 'government' ? '/government/login?error=callback_failed' : '/login?error=callback_failed', { replace: true });
      }
    }, 4000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[hsl(222,25%,9%)] text-slate-100">
      <Loader2 size={32} className="animate-spin text-indigo-400" />
      <p className="text-sm text-slate-400 font-medium">Securing session and authenticating…</p>
    </div>
  );
}
