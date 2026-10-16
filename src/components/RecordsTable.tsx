import { animals } from '../i18n';
import type { Copy } from '../i18n';
import { levels, tempos } from '../game/generator';
import { recordKey, type Profile } from '../profiles';

interface RecordsTableProps {
  t: Copy;
  profile: Profile;
}

export function RecordsTable({ t, profile }: RecordsTableProps) {
  return (
    <section className="content-panel">
      <p className="eyebrow">{profile.name || t.explorer}</p>
      <h1>{t.records}</h1>
      <p>{t.recordsHint}</p>
      <div className="records-table">
        <table>
          <thead>
            <tr>
              <th scope="col">{t.recordLevel}</th>
              {tempos.map((tempo, i) => (
                <th scope="col" key={tempo}>
                  <span aria-hidden="true">{animals[i]}</span> {t.tempos[i]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {levels.map((level, i) => (
              <tr key={level}>
                <th scope="row">{t.levels[i]}</th>
                {tempos.map((tempo) => {
                  const record = profile.records[recordKey(level, tempo)];
                  return (
                    <td key={tempo}>
                      {record ? (
                        <strong>{record.score}</strong>
                      ) : (
                        <span aria-label={t.emptyRecord}>—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="local-note">{t.local}</p>
    </section>
  );
}
