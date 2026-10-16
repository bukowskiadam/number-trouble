import { useEffect, useState } from 'react';
import { ChevronRight, Plus, RotateCcw } from 'lucide-react';
import type { Copy } from '../i18n';
import type { Profile, Store } from '../profiles';

interface ProfileManagerProps {
  t: Copy;
  store: Store;
  profile: Profile;
  onSwitch: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (name: string) => void;
  onDelete: (id: string) => void;
  onReset: (id: string) => void;
}

export function ProfileManager({
  t,
  store,
  profile,
  onSwitch,
  onAdd,
  onRename,
  onDelete,
  onReset,
}: ProfileManagerProps) {
  const [newName, setNewName] = useState('');
  const [rename, setRename] = useState(profile.name);

  useEffect(() => {
    setRename(profile.name);
  }, [profile.id, profile.name]);

  const name = (p: Profile) => p.name || t.explorer;

  return (
    <section className="content-panel">
      <p className="eyebrow">Number Trouble</p>
      <h1>{t.who}</h1>
      <p>{t.profileInfo}</p>
      <div className="profile-list">
        {store.profiles.map((p) => (
          <div className="profile-row" key={p.id}>
            <button
              className="profile-choice"
              aria-pressed={p.id === profile.id}
              onClick={() => onSwitch(p.id)}
            >
              <span className="avatar">
                {name(p).slice(0, 1).toLocaleUpperCase(profile.settings.language)}
              </span>
              <span>
                <strong>{name(p)}</strong>
                <small>{p.id === profile.id ? t.selected : t.select}</small>
              </span>
              <ChevronRight size={18} />
            </button>
            <button
              className="text-danger"
              disabled={store.profiles.length === 1}
              aria-label={`${t.remove}: ${name(p)}`}
              onClick={() => onDelete(p.id)}
            >
              {t.remove}
            </button>
          </div>
        ))}
      </div>
      <form
        className="profile-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newName.trim()) return;
          onAdd(newName);
          setNewName('');
        }}
      >
        <label htmlFor="new-name">{t.newName}</label>
        <div className="form-row">
          <input
            id="new-name"
            value={newName}
            maxLength={30}
            required
            onChange={(e) => setNewName(e.target.value)}
          />
          <button className="primary" disabled={!newName.trim()}>
            <Plus size={18} />
            {t.add}
          </button>
        </div>
      </form>
      <form
        className="profile-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (rename.trim()) {
            onRename(rename);
          }
        }}
      >
        <label htmlFor="rename">{t.name}</label>
        <div className="form-row">
          <input
            id="rename"
            value={rename}
            maxLength={30}
            required
            onChange={(e) => setRename(e.target.value)}
          />
          <button className="secondary" disabled={!rename.trim()}>
            {t.rename}
          </button>
        </div>
      </form>
      <button className="text-danger reset-button" onClick={() => onReset(profile.id)}>
        <RotateCcw size={16} />
        {t.reset}
      </button>
      {store.profiles.length === 1 && <p className="small-note">{t.lastProfile}</p>}
      <p className="local-note">{t.local}</p>
    </section>
  );
}
