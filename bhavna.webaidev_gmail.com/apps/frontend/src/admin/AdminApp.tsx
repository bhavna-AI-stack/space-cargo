import { useEffect, useState, useCallback } from 'react';
import { Gamepad2, Menu, X, LogOut } from 'lucide-react';
import { adminApi, adminToken, AdminApiError } from './adminApi';
import type {
  AdminAnalytics,
  AdminUserRow,
  AdminSessionRow,
  AdminClaimRow,
  GameConfig,
} from 'shared';
import { DEFAULT_GAME_CONFIG } from 'shared';
import './admin.css';

type Tab = 'overview' | 'users' | 'sessions' | 'claims' | 'config';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'claims', label: 'Claims' },
  { id: 'config', label: 'Config' },
];

const fmt = (n: number) => n.toLocaleString();
const shortDate = (d: string) => new Date(d).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
const shortAddr = (a?: string | null) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—');

export default function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      if (!adminToken.get()) {
        setChecking(false);
        return;
      }
      try {
        await adminApi.checkSession();
        setAuthed(true);
      } catch {
        adminToken.clear();
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    adminToken.clear();
    setAuthed(false);
  };

  if (checking) {
    return (
      <div className="admin-shell admin-center">
        <div className="admin-spinner" />
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin onAuthed={() => setAuthed(true)} />;
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-brand-group">
          <span className="admin-logo">◈</span>
          <div className="admin-brand-text">
            <h1>Mission Control</h1>
            <span className="admin-sub">Space Cargo Runner · Admin</span>
          </div>
        </div>
        
        <button 
          className={`admin-mobile-menu-btn ${isMobileMenuOpen ? 'open' : ''}`} 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu size={24} className="icon-menu" />
          <X size={24} className="icon-close" />
        </button>

        <div className={`admin-mobile-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <nav className="admin-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`admin-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => {
                  setTab(t.id);
                  setIsMobileMenuOpen(false);
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="admin-header-actions">
            <a className="admin-link-btn" href="#/"><Gamepad2 size={16} /> Game</a>
            <button className="admin-link-btn logout" onClick={handleLogout}><LogOut size={16} /> LOG OUT</button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'sessions' && <SessionsTab />}
        {tab === 'claims' && <ClaimsTab />}
        {tab === 'config' && <ConfigTab />}
      </main>
    </div>
  );
}

// ============================================================ Login
function AdminLogin({ onAuthed }: { onAuthed: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminApi.login(password);
      adminToken.set(res.token);
      onAuthed();
    } catch (err) {
      const msg = err instanceof AdminApiError ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-shell admin-center">
      <form className="admin-login" onSubmit={submit}>
        <span className="admin-logo big">◈</span>
        <h1>Mission Control</h1>
        <p className="admin-sub">Enter the admin passphrase to continue.</p>
        <input
          type="password"
          autoFocus
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div className="admin-error">{error}</div>}
        <button type="submit" className="admin-btn primary" disabled={loading || !password}>
          {loading ? 'Authenticating…' : 'Access dashboard'}
        </button>
        <a className="admin-back" href="#/" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Gamepad2 size={16} /> Back to game</a>
      </form>
    </div>
  );
}

// ============================================================ Overview
function OverviewTab() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.analytics().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Loading />;

  const cards = [
    { label: 'Total pilots', value: fmt(data.totalUsers) },
    { label: 'Active today', value: fmt(data.activeUsersToday) },
    { label: 'Active (7d)', value: fmt(data.activeUsers7d) },
    { label: 'Runs today', value: fmt(data.runsToday) },
    { label: 'Total runs', value: fmt(data.totalSessions) },
    { label: 'Top score', value: fmt(data.topScore) },
    { label: 'Coins in circulation', value: fmt(data.coinsInCirculation) },
    { label: 'Coins earned (all-time)', value: fmt(data.coinsEarnedAllTime) },
    { label: 'Tokens claimed', value: fmt(data.tokensClaimedAllTime) },
    { label: 'Pending claims', value: fmt(data.pendingClaims), warn: data.pendingClaims > 0 },
  ];

  return (
    <div className="admin-section">
      <div className="admin-cards">
        {cards.map((c) => (
          <div key={c.label} className={`admin-card ${c.warn ? 'warn' : ''}`}>
            <span className="admin-card-value">{c.value}</span>
            <span className="admin-card-label">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="admin-charts">
        <BarChart title="New pilots (7 days)" data={data.signupsByDay} color="#00ffcc" />
        <BarChart title="Runs (7 days)" data={data.runsByDay} color="#ff00ff" />
      </div>
    </div>
  );
}

function BarChart({ title, data, color }: { title: string; data: { date: string; count: number }[]; color: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="admin-chart">
      <h3>{title}</h3>
      <div className="admin-bars">
        {data.map((d) => (
          <div key={d.date} className="admin-bar-col" title={`${d.date}: ${d.count}`}>
            <div className="admin-bar-track">
              <div
                className="admin-bar-fill"
                style={{ height: `${(d.count / max) * 100}%`, background: color, boxShadow: `0 0 10px ${color}` }}
              />
            </div>
            <span className="admin-bar-value">{d.count}</span>
            <span className="admin-bar-label">{d.date.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================ Users
function UsersTab() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<AdminUserRow | null>(null);

  const load = useCallback(async (search = q) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.users(search);
      setUsers(res.users);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => { load(''); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onBan = async (u: AdminUserRow) => {
    await adminApi.banUser(u.id, !u.banned);
    load();
  };
  const onDelete = async (u: AdminUserRow) => {
    if (!confirm(`Delete ${u.username}? This removes their runs and claims.`)) return;
    await adminApi.deleteUser(u.id);
    load();
  };

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="admin-search">
          <input placeholder="Search username / wallet / id" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="admin-btn" type="submit">Search</button>
        </form>
        <span className="admin-count">{fmt(total)} pilots</span>
      </div>

      {error && <ErrorBox message={error} />}
      {loading ? <Loading /> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pilot</th><th>Wallet</th><th>Coins</th><th>XP</th><th>High score</th>
                <th>Runs</th><th>Role</th><th>Status</th><th>Joined</th><th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={u.banned ? 'banned' : ''}>
                  <td><strong>{u.username}</strong></td>
                  <td className="mono">{shortAddr(u.walletAddress)}</td>
                  <td>{fmt(u.coins)}</td>
                  <td>{fmt(u.xp)}</td>
                  <td>{fmt(u.highScore)}</td>
                  <td>{fmt(u.sessionCount ?? 0)}</td>
                  <td>{u.role === 'admin' ? <span className="tag admin">admin</span> : 'player'}</td>
                  <td>{u.banned ? <span className="tag danger">banned</span> : <span className="tag ok">active</span>}</td>
                  <td>{shortDate(u.createdAt)}</td>
                  <td className="admin-row-actions">
                    <button className="admin-btn tiny" onClick={() => setEditing(u)}>Edit</button>
                    <button className="admin-btn tiny" onClick={() => onBan(u)}>{u.banned ? 'Unban' : 'Ban'}</button>
                    <button className="admin-btn tiny danger" onClick={() => onDelete(u)}>Del</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={10} className="admin-empty">No pilots found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditUserModal user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

function EditUserModal({ user, onClose, onSaved }: { user: AdminUserRow; onClose: () => void; onSaved: () => void }) {
  const [username, setUsername] = useState(user.username);
  const [coins, setCoins] = useState(String(user.coins));
  const [xp, setXp] = useState(String(user.xp));
  const [highScore, setHighScore] = useState(String(user.highScore));
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await adminApi.updateUser(user.id, {
        username,
        coins: Number(coins),
        xp: Number(xp),
        highScore: Number(highScore),
        role,
      });
      onSaved();
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit pilot</h2>
        <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} /></label>
        <div className="admin-grid-2">
          <label>Coins<input type="number" value={coins} onChange={(e) => setCoins(e.target.value)} /></label>
          <label>XP<input type="number" value={xp} onChange={(e) => setXp(e.target.value)} /></label>
        </div>
        <div className="admin-grid-2">
          <label>High score<input type="number" value={highScore} onChange={(e) => setHighScore(e.target.value)} /></label>
          <label>Role
            <select value={role} onChange={(e) => setRole(e.target.value as AdminUserRow['role'])}>
              <option value="player">player</option>
              <option value="admin">admin</option>
            </select>
          </label>
        </div>
        {error && <div className="admin-error">{error}</div>}
        <div className="admin-modal-actions">
          <button className="admin-btn" onClick={onClose}>Cancel</button>
          <button className="admin-btn primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================ Sessions
function SessionsTab() {
  const [sessions, setSessions] = useState<AdminSessionRow[]>([]);
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.sessions(suspiciousOnly);
      setSessions(res.sessions);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [suspiciousOnly]);

  useEffect(() => { load(); }, [load]);

  const onDelete = async (id: string) => {
    if (!confirm('Delete this run record? (Removes it from analytics.)')) return;
    await adminApi.deleteSession(id);
    load();
  };

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <label className="admin-check">
          <input type="checkbox" checked={suspiciousOnly} onChange={(e) => setSuspiciousOnly(e.target.checked)} />
          Suspicious runs only
        </label>
      </div>
      {error && <ErrorBox message={error} />}
      {loading ? <Loading /> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Pilot</th><th>Distance</th><th>Cargo</th><th>Coins</th><th>XP</th><th>When</th><th>Flag</th><th></th></tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className={s.suspicious ? 'flagged' : ''}>
                  <td>{s.username || s.userId.slice(0, 8)}</td>
                  <td>{fmt(s.distance)}</td>
                  <td>{fmt(s.cargoCollected)}</td>
                  <td>{fmt(s.coinsEarned)}</td>
                  <td>{fmt(s.xpEarned)}</td>
                  <td>{shortDate(s.createdAt)}</td>
                  <td>{s.suspicious ? <span className="tag danger" title={s.suspicionReason}>⚠ flagged</span> : <span className="tag ok">ok</span>}</td>
                  <td><button className="admin-btn tiny danger" onClick={() => onDelete(s.id)}>Del</button></td>
                </tr>
              ))}
              {sessions.length === 0 && <tr><td colSpan={8} className="admin-empty">No runs to show.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================ Claims
function ClaimsTab() {
  const [claims, setClaims] = useState<AdminClaimRow[]>([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.claims(status);
      setClaims(res.claims);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const moderate = async (id: string, next: 'approved' | 'rejected') => {
    await adminApi.moderateClaim(id, next);
    load();
  };

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <div className="admin-filter-pills">
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button key={s} className={`admin-pill ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>{s}</button>
          ))}
        </div>
      </div>
      {error && <ErrorBox message={error} />}
      {loading ? <Loading /> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Pilot</th><th>Wallet</th><th>Amount</th><th>Nonce</th><th>Status</th><th>On-chain</th><th>When</th><th></th></tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c.id}>
                  <td>{c.username || c.userId.slice(0, 8)}</td>
                  <td className="mono">{shortAddr(c.walletAddress)}</td>
                  <td>{fmt(c.amount)}</td>
                  <td>{c.nonce}</td>
                  <td><span className={`tag ${c.status === 'rejected' ? 'danger' : c.status === 'pending' ? 'warn' : 'ok'}`}>{c.status}</span></td>
                  <td>{c.claimed ? '✓ claimed' : '—'}</td>
                  <td>{shortDate(c.createdAt)}</td>
                  <td className="admin-row-actions">
                    <button className="admin-btn tiny" disabled={c.status === 'approved'} onClick={() => moderate(c.id, 'approved')}>Approve</button>
                    <button className="admin-btn tiny danger" disabled={c.status === 'rejected'} onClick={() => moderate(c.id, 'rejected')}>Reject</button>
                  </td>
                </tr>
              ))}
              {claims.length === 0 && <tr><td colSpan={8} className="admin-empty">No claims.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <p className="admin-note">Rejecting an unclaimed reward refunds the pilot's coins.</p>
    </div>
  );
}

// ============================================================ Config
function ConfigTab() {
  const [cfg, setCfg] = useState<GameConfig>({ ...DEFAULT_GAME_CONFIG });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminApi.getConfig()
      .then((r) => setCfg({ ...DEFAULT_GAME_CONFIG, ...r.config }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const num = (key: keyof GameConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCfg((c) => ({ ...c, [key]: Number(e.target.value) }));

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const r = await adminApi.updateConfig(cfg);
      setCfg({ ...DEFAULT_GAME_CONFIG, ...r.config });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  const fields: { key: keyof GameConfig; label: string; hint: string }[] = [
    { key: 'shieldUpgradeBaseCost', label: 'Shield upgrade base cost', hint: 'cost = level × this' },
    { key: 'fuelUpgradeBaseCost', label: 'Fuel upgrade base cost', hint: 'cost = level × this' },
    { key: 'minClaimAmount', label: 'Min withdrawal (coins)', hint: 'minimum coins to claim tokens' },
    { key: 'coinToTokenRate', label: 'Coin → token rate', hint: 'tokens minted per coin' },
    { key: 'difficultySpeedScale', label: 'Difficulty speed scale', hint: '1 = default ramp' },
    { key: 'difficultySpawnScale', label: 'Difficulty spawn scale', hint: '1 = default pressure' },
  ];

  return (
    <div className="admin-section">
      <div className="admin-config">
        {fields.map((f) => (
          <label key={f.key} className="admin-config-field">
            <span className="admin-config-label">{f.label}</span>
            <input type="number" step="0.1" value={String(cfg[f.key] as number)} onChange={num(f.key)} />
            <span className="admin-config-hint">{f.hint}</span>
          </label>
        ))}

        <label className="admin-config-field admin-toggle">
          <span className="admin-config-label">Maintenance mode</span>
          <div style={{ display: 'flex', alignItems: 'center', height: '40px', paddingLeft: '4px' }}>
            <input
              type="checkbox"
              checked={cfg.maintenanceMode}
              onChange={(e) => setCfg((c) => ({ ...c, maintenanceMode: e.target.checked }))}
            />
            <span style={{ marginLeft: '12px', fontSize: '0.9rem', color: 'var(--a-text)' }}>
              {cfg.maintenanceMode ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <span className="admin-config-hint">Pause score submission &amp; leaderboard writes</span>
        </label>
      </div>

      {error && <ErrorBox message={error} />}
      <div className="admin-config-actions">
        {saved && <span className="admin-saved">✓ Saved</span>}
        <button className="admin-btn primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save config'}</button>
      </div>
    </div>
  );
}

// ============================================================ shared bits
function Loading() {
  return <div className="admin-loading"><div className="admin-spinner" /></div>;
}
function ErrorBox({ message }: { message: string }) {
  return <div className="admin-error block">⚠ {message}</div>;
}
