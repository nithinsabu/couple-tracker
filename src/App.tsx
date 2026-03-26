import { useEffect, useState } from 'react';
import Who from './pages/Who';
import Today from './pages/Today';
import History from './pages/History';
import Navbar from './components/Navbar';
import { type UserType } from './types';
import "./App.css";

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [page, setPage] = useState<'today' | 'history'>('today');

  useEffect(() => {
    const saved = localStorage.getItem('user') as UserType | null;
    if (saved) setUser(saved);
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) return <Who setUser={setUser} />;

  return (
    <>
      <Navbar setPage={setPage} logout={logout} />
      {page === 'today' && <Today user={user} />}
      {page === 'history' && <History currentUser={user} />}
    </>
  );
}