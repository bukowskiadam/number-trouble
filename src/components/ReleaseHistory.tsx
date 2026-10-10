import { APP_VERSION, getReleaseNotes } from '../releases';
import { text } from '../i18n';
import type { Language } from '../profiles';
import { Dialog } from './Dialog';
import './ReleaseHistory.css';

export function ReleaseHistory({
  language,
  previousVersion,
  onClose,
}: {
  language: Language;
  previousVersion?: string;
  onClose: () => void;
}) {
  const t = text[language];
  const releases = getReleaseNotes(previousVersion);
  return (
    <Dialog
      title={previousVersion ? t.whatsNew : t.releaseHistory}
      closeLabel={t.close}
      onClose={onClose}
    >
      <div className="release-history">
        <p className="release-intro">
          Number Trouble v{APP_VERSION}. {previousVersion ? t.updatesIntro : t.releaseIntro}
        </p>
        {releases.map((release) => (
          <section className="release-entry" key={release.version}>
            <span className="release-version">v{release.version}</span>
            <h3>{release[language].title}</h3>
            <ul>
              {release[language].changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </section>
        ))}
        {!releases.length && <p>{t.noReleaseNotes}</p>}
        <button className="primary dialog-action" onClick={onClose}>
          {t.backToCounting}
        </button>
      </div>
    </Dialog>
  );
}
