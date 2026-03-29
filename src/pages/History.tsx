import { useEffect, useState } from 'react';
import { supabase } from '../supaBaseClient';
import { type Entry, type UserType } from '../types';
import "../App.css";

const getYYYYMMDD = (d: Date) => {
  return d.toISOString().split('T')[0]
};

type DisplayItem =
  | { type: 'entry'; data: Entry; date: string }
  | { type: 'missed'; date: string };

type SortOption = 'date-desc' | 'score-desc' | 'score-asc';

interface Props {
  currentUser: UserType;
}

const ITEMS_PER_PAGE = 10;
const firstEntryDate = new Date('2026-03-26'); // Set this to the date of the first ever entry in your database
const todayDate = new Date();
todayDate.setUTCHours(1, 0, 0, 0);
export default function History({ currentUser }: Props) {
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
  const [view, setView] = useState<UserType>(currentUser);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [totalPages, setTotalPages] = useState(Math.ceil((todayDate.getTime() - firstEntryDate.getTime()) / (1000 * 60 * 60 * 24) / ITEMS_PER_PAGE));
  // Pagination and Sorting State
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Reset to page 1 when changing user or sort method
  useEffect(() => {
    setPage(1);
  }, [view, sortBy]);

  useEffect(() => {
    load();
  }, [view, currentUser, page, sortBy]);

  const load = async () => {
    const todayStr = getYYYYMMDD(new Date());

    // 1. Check if the CURRENT user has submitted today
    const { data: myTodayData } = await supabase
      .from('entries')
      .select('id')
      .eq('user_id', currentUser)
      .eq('date', todayStr);

    setHasSubmittedToday(!!(myTodayData && myTodayData.length > 0));

    // 2. Calculate Pagination Range
    const to = new Date();
    to.setUTCHours(0, 0, 0, 0); // Set to start of today in UTC
    to.setUTCDate(to.getUTCDate() - (page - 1) * ITEMS_PER_PAGE);
    let from = new Date(to);
    from.setUTCDate(to.getUTCDate() - ITEMS_PER_PAGE + 1);
    from = from < firstEntryDate ? firstEntryDate : from; // Ensure 'from' doesn't go before the first entry date
    // 3. Build the Query
    let query = supabase
      .from('entries')
      .select('*', { count: 'exact' })
      .eq('user_id', view)

    if (sortBy === 'date-desc') {
      query = query.gte('date', getYYYYMMDD(from)).lte('date', getYYYYMMDD(to)).order('date', { ascending: false });
    } else if (sortBy === 'score-desc') {
      query = query.order('total_score', { ascending: false }).order('date', { ascending: false }).range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);
    } else if (sortBy === 'score-asc') {
      query = query.order('total_score', { ascending: true }).order('date', { ascending: false }).range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);
    }

    // Apply pagination
    const { data, count } = await query;

    if (!data || data.length === 0) {
      setDisplayItems([]);
      return;
    }

    // Update total pages based on the count
    if (sortBy !== 'date-desc') {
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    }

    const processedList: DisplayItem[] = [];

    // 4. Process List (Only inject 'missed' days if viewing the timeline)
    if (sortBy === 'date-desc') {
      let currDate = getYYYYMMDD(new Date(to));
      let lastDate = getYYYYMMDD(new Date(from));

      while (currDate >= lastDate) {
        const foundEntry = data.find((e) => e.date === currDate);
        if (foundEntry) {
          processedList.push({ type: 'entry', data: foundEntry, date: currDate });
        } else {
          processedList.push({ type: 'missed', date: currDate });
        }
        currDate = getYYYYMMDD(new Date(new Date(currDate).getTime() - 24 * 60 * 60 * 1000)); // Move back one day
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

      {hasSubmittedToday || view === currentUser ? displayItems.map((item) => {
        const dateDisplay = new Date(item.date).toLocaleDateString('en-IN', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });

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
                <span className="entry-chip-val" style={{ color: 'var(--accent-n)' }}>{e.self_rating}</span>
              </div>
              <div className="entry-chip">
                <span className="entry-chip-label">partner</span>
                <span className="entry-chip-val" style={{ color: 'var(--accent-a)' }}>{e.partner_rating}</span>
              </div>
              <div className="entry-chip">
                <span className="entry-chip-label">outside</span>
                <span className="entry-chip-val" style={{ color: 'var(--accent-ext)' }}>{e.ext_rating}</span>
              </div>
            </div>
            <p className="partner-note-text">"{e.note}"</p>
          </div>
        );
      }) :
        <div key={`locked-${getYYYYMMDD(new Date())}`} className="history-entry missed" style={{ opacity: 0.8 }}>
          <div className="entry-date">{new Date().toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
          })}</div>
          <p className="partner-note-text" style={{ fontStyle: 'normal', color: 'var(--text-dim)' }}>
            🔒 Write today's entry to unlock {capitalize(view)}'s.
          </p>
        </div>
      }
    </div>
  );
}