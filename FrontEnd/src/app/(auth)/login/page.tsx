//src/app/(auth)/login/page.tsx
"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { AppDispatch, RootState } from '@/lib/redux/store';
import { loginUser, selectIsAuthenticated } from '@/lib/redux/slices/authSlice';
import { fetchMyOrganizations } from '@/lib/redux/slices/organizationSlice';
import Spinner from '@/components/Spinner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // 1. Extraímos o 'user' do Redux, pois a lista de empresas está dentro dele
  const { status, error, user } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  // 2. Pegamos a organização atual
  const currentOrganization = useSelector((state: RootState) => state.organizations?.currentOrganization);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

 useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMyOrganizations())
        .unwrap()
        .then(() => {
          router.push('/dashboard');
        })
        .catch((err) => {
          console.error("Erro ao carregar organizações pós-login:", err);
          // Vai pro dashboard mesmo assim para não travar o fluxo
          router.push('/dashboard'); 
        });
    }
  }, [isAuthenticated, dispatch, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-gray-700">
      <div className="p-8 bg-white rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-black">Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white mt-1 block w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black rounded-md"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white mt-1 block w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-300 transition-colors"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? (
              <span className="flex items-center gap-2">
                Entrando... <Spinner />
              </span>
            ) : (
              'Entrar'
            )}
          </button>
          {error && <p className="mt-4 text-sm text-red-600 text-center font-medium">{error}</p>}
        </form>
      </div>
    </div>
  );
}