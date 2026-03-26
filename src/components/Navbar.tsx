import "../App.css";

interface Props {
  setPage: (page: 'today' | 'history') => void;
  logout: () => void;
}

export default function Navbar({ setPage, logout }: Props) {
  return (
    <nav>
      <div className="nav-logo">us, daily.</div>
      <div className="nav-links">
        <button className="nav-link" onClick={() => setPage('today')}>Today</button>
        <button className="nav-link" onClick={() => setPage('history')}>History</button>
        <button className="nav-logout" onClick={logout}>logout</button>
      </div>
    </nav>
  );
}