import { Cloud, Download, WifiOff } from 'lucide-react';
import type { Copy } from '../i18n';
import { APP_VERSION } from '../releases';

import type { usePwa } from '../pwa';

interface FooterProps {
  t: Copy;
  pwa: ReturnType<typeof usePwa>;
  onInstallClick: () => void;
  onReleaseHistory: () => void;
}

export function Footer({ t, pwa, onInstallClick, onReleaseHistory }: FooterProps) {
  const offlineText =
    pwa.status === 'ready'
      ? t.offlineReady
      : pwa.status === 'preparing'
        ? t.offlinePreparing
        : t.offlineUnavailable;
  const offlineIcon = pwa.status === 'ready' ? <Cloud size={17} /> : <WifiOff size={17} />;

  return (
    <footer>
      <button className="release-history-button" onClick={onReleaseHistory}>
        <span>
          {t.version} v{APP_VERSION}
        </span>
        <span>{t.releaseHistory}</span>
      </button>
      <span className={`offline-status ${pwa.status}`} role="status">
        {offlineIcon} {offlineText}
      </span>
      {pwa.status === 'unavailable' && import.meta.env.PROD && (
        <button onClick={pwa.retry}>{t.offlineRetry}</button>
      )}
      <button onClick={onInstallClick}>
        <Download size={16} />
        {t.install}
      </button>
      {pwa.waiting && (
        <button className="update-button" onClick={pwa.update}>
          {t.update} · {t.updateAction}
        </button>
      )}
    </footer>
  );
}
