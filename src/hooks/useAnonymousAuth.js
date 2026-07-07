import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// PRD/설계서에는 로그인 화면이 없으므로, 01_architecture.md 3.2에 따라
// 앱 최초 진입 시 Supabase 익명 로그인으로 사용자를 식별한다.
export function useAnonymousAuth() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function ensureSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const { error: signInError } = await supabase.auth.signInAnonymously();
          if (signInError) throw signInError;
        }
        if (mounted) setReady(true);
      } catch (err) {
        if (mounted) setError(err);
      }
    }

    ensureSession();
    return () => {
      mounted = false;
    };
  }, []);

  return { ready, error };
}
