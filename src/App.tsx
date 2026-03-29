import { useEffect, useState } from 'react';
import Who from './pages/Who';
import Today from './pages/Today';
import History from './pages/History';
import Navbar from './components/Navbar';
import { type UserType } from './types';
import "./App.css";
import { supabase } from './supaBaseClient';
import bcrypt from "bcryptjs";
export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [page, setPage] = useState<'today' | 'history'>('today');

  useEffect(() => {
    const checkUser = async () => {
      const savedUser = localStorage.getItem('user') as UserType | null;
      const savedPassword = localStorage.getItem('password');
      if (!savedUser || !savedPassword) {
        localStorage.removeItem('user');
        localStorage.removeItem('password');
        return;
      }
      const { data } = await supabase.from('users').select('password').eq('username', savedUser);
      if (data && data.length > 0) {
        const existingPasswordHash = data[0].password;
        if (savedPassword && await bcrypt.compare(savedPassword, existingPasswordHash)) {
          setUser(savedUser);
        } else {
          localStorage.removeItem('user');
          localStorage.removeItem('password');
        }
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('password');
      }
    }
    checkUser();
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('password');
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