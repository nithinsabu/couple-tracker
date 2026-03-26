import { useEffect, useState } from 'react';
import { supabase } from '../supaBaseClient';
import { type Entry, type UserType } from '../types';
import "../App.css";

const getLocalYYYYMMDD = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type DisplayItem = 
  | { type: 'entry'; data: Entry; date: string }
  | { type: 'missed'; date: string };

type SortOption = 'date-desc' | 'score-desc' | 'score-asc';

interface Props {
  currentUser: UserType;
}

const ITEMS_PER_PAGE = 10;

export default function History({ currentUser }: Props) {
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
  const [view, setView] = useState<UserType>(currentUser);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  
  // Pagination and Sorting State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Reset to page 1 when changing user or sort method
  useEffect(() => {
    setPage(1);
  }, [view, sortBy]);

  useEffect(() => {
    load();
  }, [view, currentUser, page, sortBy]);

  const load = async () => {
    const todayStr = getLocalYYYYMMDD(new Date());

    // 1. Check if the CURRENT user has submitted today
    const { data: myTodayData } = await supabase
      .from('entries')
      .select('id')
      .eq('user_id', currentUser)
      .eq('date', todayStr);
    
    setHasSubmittedToday(!!(myTodayData && myTodayData.length > 0));

    // 2. Calculate Pagination Range
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    // 3. Build the Query
    let query = supabase
      .from('entries')
      .select('*', { count: 'exact' })
      .eq('user_id', view);

    if (sortBy === 'date-desc') {
      query = query.order('date', { ascending: false });
    } else if (sortBy === 'score-desc') {
      query = query.order('total_score', { ascending: false }).order('date', { ascending: false });
    } else if (sortBy === 'score-asc') {
      query = query.order('total_score', { ascending: true }).order('date', { ascending: false });
    }

    // Apply pagination
    const { data, count } = await query.range(from, to);

    if (count !== null) {
      setTotalPages(Math.max(1, Math.ceil(count / ITEMS_PER_PAGE)));
    }

    if (!data || data.length === 0) {
      setDisplayItems([]);
      return;
    }

    const processedList: DisplayItem[] = [];

    // 4. Process List (Only inject 'missed' days if viewing the timeline)
    if (sortBy === 'date-desc') {
      // Start from today if page 1, otherwise start from the first date of this paginated chunk
      let currDate = page === 1 ? new Date() : new Date(data[0].date);
      let currStr = getLocalYYYYMMDD(currDate);
      const oldestStr = data[data.length - 1].date;

      while (currStr >= oldestStr) {
        const foundEntry = data.find((e) => e.date === currStr);
        if (foundEntry) {
          processedList.push({ type: 'entry', data: foundEntry, date: currStr });
        } else {
          processedList.push({ type: 'missed', date: currStr });
        }
        currDate.setDate(currDate.getDate() - 1);
        currStr = getLocalYYYYMMDD(currDate);
      }
    } else {
      // If viewing Best/Worst days, just show the ranked entries
      data.forEach(e => {
        processedList.push({ type: 'entry', data: e as Entry, date: e.date });
      });
    }

    setDisplayItems(processedList);
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="page">
      <div className="date-header">
        <h1>history</h1>
      </div>

      <div className="toggle-group">
        <button 
          className={`toggle-btn ${view === 'nithin' ? 'active nithin' : ''}`} 
          onClick={() => setView('nithin')}
        >
          Nithin
        </button>
        <button 
          className={`toggle-btn ${view === 'aiswarya' ? 'active aiswarya' : ''}`} 
          onClick={() => setView('aiswarya')}
        >
          Aiswarya
        </button>
      </div>

      {/* --- Controls Row: Sort & Pagination --- */}
      <div className="controls-row">
        <select 
          className="history-select" 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value as SortOption)}
        >
          <option value="date-desc">Timeline (Newest)</option>
          <option value="score-desc">Best Days</option>
          <option value="score-asc">Worst Days</option>
        </select>

        <select 
          className="history-select" 
          value={page} 
          onChange={(e) => setPage(Number(e.target.value))}
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <option key={p} value={p}>Page {p}</option>
          ))}
        </select>
      </div>

      {displayItems.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: '40px' }}>No entries found.</p>
      )}

      {displayItems.map((item) => {
        const dateDisplay = new Date(item.date).toLocaleDateString('en-IN', { 
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
        });

        const isToday = item.date === getLocalYYYYMMDD(new Date());
        const isPartner = view !== currentUser;

        if (isToday && isPartner && !hasSubmittedToday && item.type === 'entry') {
          return (
            <div key={`locked-${item.date}`} className="history-entry missed" style={{ opacity: 0.8 }}>
              <div className="entry-date">{dateDisplay}</div>
              <p className="partner-note-text" style={{ fontStyle: 'normal', color: 'var(--text-dim)' }}>
                🔒 Write today's entry to unlock {capitalize(view)}'s.
              </p>
            </div>
          );
        }

        if (item.type === 'missed') {
          return (
            <div key={`missed-${item.date}`} className="history-entry missed">
              <div className="entry-date">{dateDisplay}</div>
              <p className="partner-note-text">nothing written today.</p>
            </div>
          );
        }

        const e = item.data;
        return (
          <div key={e.id} className="history-entry">
            <div className="entry-date">{dateDisplay}</div>
            <div className="entry-ratings">
              <div className="entry-chip">
                <span className="entry-chip-label">self</span>
                <span className="entry-chip-val" style={{color:'var(--accent-n)'}}>{e.self_rating}</span>
              </div>
              <div className="entry-chip">
                <span className="entry-chip-label">partner</span>
                <span className="entry-chip-val" style={{color:'var(--accent-a)'}}>{e.partner_rating}</span>
              </div>
              <div className="entry-chip">
                <span className="entry-chip-label">outside</span>
                <span className="entry-chip-val" style={{color:'var(--accent-ext)'}}>{e.ext_rating}</span>
              </div>
            </div>
            <p className="partner-note-text">"{e.note}"</p>
          </div>
        );
      })}
    </div>
  );
}