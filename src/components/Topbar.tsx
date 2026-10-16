import { Volume2, VolumeX } from 'lucide-react';
import type { Copy } from '../i18n';
import type { Profile } from '../profiles';

interface TopbarProps {
  t: Copy;
  profile: Profile;
  onMuteToggle: () => void;
  onLanguageChange: (lang: 'pl' | 'en') => void;
}

export function Topbar({ t, profile, onMuteToggle, onLanguageChange }: TopbarProps) {
  const name = (p: Profile) => p.name || t.explorer;

  return (
    <header className="topbar">
      <div className="current-profile">
        <span className="avatar">
          {name(profile).slice(0, 1).toLocaleUpperCase(profile.settings.language)}
        </span>
        <span>{name(profile)}</span>
      </div>
      <div className="toolbar">
        <button
          className="icon-button"
          onClick={onMuteToggle}
          aria-label={profile.settings.muted ? t.soundOff : t.soundOn}
        >
          {profile.settings.muted ? <VolumeX size={21} /> : <Volume2 size={21} />}
        </button>
        <label className="language">
          <span className="sr-only">{t.language}</span>
          <select
            aria-label={t.language}
            value={profile.settings.language}
            onChange={(e) => onLanguageChange(e.target.value as 'pl' | 'en')}
          >
            <option value="pl">PL</option>
            <option value="en">EN</option>
          </select>
        </label>
      </div>
    </header>
  );
}
