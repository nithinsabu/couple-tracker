import { type UserType } from '../types';
import "../App.css";

interface Props {
  setUser: (u: UserType) => void;
}

export default function Who({ setUser }: Props) {
  const selectUser = (user: UserType) => {
    localStorage.setItem('user', user);
    setUser(user);
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
    </div>
  );
}