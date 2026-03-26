import { useEffect, useState } from 'react';
import { supabase } from '../supaBaseClient';
import { type Entry, type UserType } from '../types';
import "../App.css";

interface Props {
  user: UserType;
}

export default function Today({ user }: Props) {
  const [self, setSelf] = useState(5);
  const [partner, setPartner] = useState(5);
  const [ext, setExt] = useState(5);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [partnerEntry, setPartnerEntry] = useState<Entry | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const other = user === 'nithin' ? 'aiswarya' : 'nithin';

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from('entries')
      .select('*')
      .eq('date', today);

    const mine = data?.find(e => e.user_id === user);
    const theirs = data?.find(e => e.user_id === other);

    if (mine) setSubmitted(true);
    if (theirs) setPartnerEntry(theirs);
  };

  const submit = async () => {
    if (!note.trim()) return;

    const { error } = await supabase.from('entries').upsert({
      date: today,
      user_id: user,
      self_rating: self,
      partner_rating: partner,
      ext_rating: ext,
      note
    }, { onConflict: 'date,user_id' });

    if (!error) {
      setSubmitted(true);
      load();
    }
  };

  return (
    <div className="page">
      <div className="date-header">
        <h1>today</h1>
        <span className={`user-badge ${user}`}>{user}</span>
      </div>

      {submitted ? (
        <div className="sliders-block" style={{textAlign: 'center'}}>
          <strong style={{color: 'var(--green)'}}>✓ you've checked in today.</strong>
          <span style={{fontSize: '12px', marginTop: '6px', display: 'block', color: 'var(--text-dim)'}}>
            come back tomorrow for another entry.
          </span>
        </div>
      ) : (
        <div id="entry-form">
          <div className="sliders-block">
            <div className="section-label">how are things, 0–10</div>
            
            <div className={`slider-row slider-${user}`}>
              <div className="slider-meta"><span>myself</span><span className="slider-value">{self}</span></div>
              <input type="range" min="0" max="10" value={self} onChange={e => setSelf(+e.target.value)} />
            </div>

            <div className={`slider-row slider-${other}`}>
               <div className="slider-meta"><span>partner</span><span className="slider-value">{partner}</span></div>
               <input type="range" min="0" max="10" value={partner} onChange={e => setPartner(+e.target.value)} />
            </div>

            <div className="slider-row" style={{color: '#89a8b4'}}>
               <div className="slider-meta"><span>the world</span><span className="slider-value">{ext}</span></div>
               <input type="range" min="0" max="10" value={ext} onChange={e => setExt(+e.target.value)} />
            </div>
          </div>

          <div className="note-block">
            <div className="section-label">how you feel</div>
            <textarea placeholder="write freely — about yourself, about them, about whatever's on your mind." value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <button className={`submit-btn ${user}`} onClick={submit}>save today's entry</button>
        </div>
      )}

      <div className="partner-status" style={{marginTop: '24px'}}>
        <div className="section-label">Partner Status</div>
        {partnerEntry && submitted ? (
          <div>
            <p className="partner-note-text">"{partnerEntry.note}"</p>
          </div>
        ) : (
          <p style={{color: 'var(--text-muted)', fontSize: '13px'}}>
            {partnerEntry ? `${other.charAt(0).toUpperCase() + other.slice(1)} has written — submit yours to read it.` : `${other.charAt(0).toUpperCase() + other.slice(1)} hasn't written yet today.`}
          </p>
        )}
      </div>
    </div>
  );
}