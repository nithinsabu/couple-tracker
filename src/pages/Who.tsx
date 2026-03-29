import { type UserType } from '../types';
import "../App.css";
import { supabase } from '../supaBaseClient';
import { useState } from 'react';
import bcrypt from "bcryptjs"
interface Props {
  setUser: (u: UserType) => void;
}

export default function Who({ setUser }: Props) {
  const [userExist, setUserExist] = useState<null | boolean>(null);
  const [password, setPassword] = useState('');
  const [existingPasswordHash, setExistingPasswordHash] = useState('');
  const selectUser = async (user: UserType) => {
    setUserExist(null);
    setPassword('');
    let { data } = await supabase.from('users').select('*').eq('username', user);
    if (!data || data.length === 0) {
      setUserExist(false);
    }
    else {
      setUserExist(true);
      setExistingPasswordHash(data[0].password);
    }
    localStorage.setItem('user', user);
  };
  const submitPassword = async (pwd: string) => {
    if (!pwd.trim()) {
      alert('Password cannot be empty');
      return;
    }
    if (pwd.length < 6) {
      alert('Password should be at least 6 characters');
      return;
    }
    if (userExist) {
      const isPasswordCorrect = await bcrypt.compare(pwd, existingPasswordHash);
      if (isPasswordCorrect) {
        localStorage.setItem('password', pwd);
        setUser(localStorage.getItem('user') as UserType);
      } else {
        alert('Incorrect password');
      }
    } else {
      if (!localStorage.getItem('user') || !pwd) {
        localStorage.removeItem('user');
        localStorage.removeItem('password');
        return;
      }
      const hashedPassword = await bcrypt.hash(pwd, 10);
      await supabase.from('users').upsert({ username: localStorage.getItem('user'), password: hashedPassword }, {onConflict: 'username'});
      localStorage.setItem('password', pwd);
      setUser(localStorage.getItem('user') as UserType);
    }
  };

  return (
    <div className="who-page">
      <p className="who-sub">who's checking in?</p>
      <h1 className="who-title">good to see you.</h1>
      <div className="who-buttons">
        <button className="who-btn nithin" onClick={() => selectUser('nithin')}>
          Nithin <span className="role">that's me</span>
        </button>
        <button className="who-btn aiswarya" onClick={() => selectUser('aiswarya')}>
          Aiswarya <span className="role">that's me</span>
        </button>
      </div>
      {userExist !== null && (
        <div className="password-container">
          <p className="section-label">
            {userExist ? "Enter Password" : "Set your password"}
          </p>
          <input
            type="password"
            className="password-input"
            placeholder="••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button className="password-submit" onClick={() => submitPassword(password)}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}