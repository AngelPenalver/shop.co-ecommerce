import { useState } from 'react';

export const useAuthModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const open = (tab: 'login' | 'register' = 'login') => {
    setActiveTab(tab);
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  return { isOpen, open, close, activeTab, setActiveTab };
};