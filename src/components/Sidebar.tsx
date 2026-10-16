import { BookOpen, Gamepad2, Sparkles, Trophy, Users } from 'lucide-react';
import type { Copy } from '../i18n';

export type Page = 'play' | 'profiles' | 'records';

interface SidebarProps {
  t: Copy;
  page: Page;
  onNavigate: (page: Page) => void;
  playing: boolean;
  onHelp: () => void;
}

export function Sidebar({ t, page, onNavigate, playing, onHelp }: SidebarProps) {
  const navItems = [
    { key: 'play', icon: Gamepad2, label: t.play },
    { key: 'profiles', icon: Users, label: t.profiles },
    { key: 'records', icon: Trophy, label: t.records },
  ] as const;

  return (
    <aside className="sidebar">
      <a
        className="brand"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          if (!playing) onNavigate('play');
        }}
        aria-label="Number Trouble"
      >
        <span className="brand-icon">
          +<small>−</small>
        </span>
        <span>
          number
          <span className="brand-second">
            trouble<span className="brand-dot">.</span>
          </span>
        </span>
      </a>
      <p className="tagline">{t.tagline}</p>
      <nav aria-label="Number Trouble">
        {navItems.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            className={`nav-item ${page === key ? 'selected' : ''}`}
            aria-current={page === key ? 'page' : undefined}
            disabled={playing}
            onClick={() => onNavigate(key)}
          >
            <Icon size={21} />
            <span>{label}</span>
            {page === key && <span className="nav-dot" />}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <Sparkles size={24} />
          <p>{t.footer}</p>
          <span aria-hidden="true">+ &nbsp; − &nbsp; =</span>
        </div>
        <button className="help-link" disabled={playing} onClick={onHelp}>
          <BookOpen size={18} />
          {t.how}
        </button>
      </div>
    </aside>
  );
}
