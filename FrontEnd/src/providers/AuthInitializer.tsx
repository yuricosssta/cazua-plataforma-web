//src/providers/AuthInitializer.tsx
"use client";

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setAuthState } from '../lib/redux/slices/authSlice';
import { fetchUserProfile } from '../lib/redux/slices/userSlice';
import { AppDispatch } from '../lib/redux/store';
import { fetchMyOrganizations } from '@/lib/redux/slices/organizationSlice';
import { SessionExpiredModal } from '@/components/auth/SessionExpiredModal';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      dispatch(setAuthState({ token }));
      dispatch(fetchUserProfile()); 
      dispatch(fetchMyOrganizations());
    }
  }, [dispatch]);

  return (
    <>
      <SessionExpiredModal />
      {children}
    </>
  ); 
}