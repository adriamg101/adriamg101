import { pickText } from "../lib/i18n";
import { resolveAsset } from "../lib/assets";
import type { About, AboutLine, AboutRow } from "../lib/schema";
import { useSettings, useT } from "../lib/settings";

function LanguageTable({
  rows,
  labelId,
}: {
  rows: AboutRow[];
  labelId: string;
}) {
  const { lang } = useSettings();
  return (
    <table className="neofetch-table" aria-labelledby={labelId}>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td>{pickText(r.name, lang)}</td>
            <td>{pickText(r.level, lang)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LineValue({ line }: { line: Extract<AboutLine, { value: unknown }> }) {
  const { lang } = useSettings();
  const value = pickText(line.value, lang);
  if (!line.href) return <>{value}</>;
  if (line.download) {
    const href = resolveAsset(line.href);
    return (
      <a href={href} download rel="noopener noreferrer">
        {value}
      </a>
    );
  }
  const external = !line.href.startsWith("mailto:");
  return (
    <a
      href={line.href}
      {...(external ? { target: "_blank" } : {})}
      rel="noopener noreferrer"
    >
      {value}
    </a>
  );
}

export function NeofetchCard({ about }: { about: About }) {
  const { lang } = useSettings();
  const t = useT();
  return (
    <div className="neofetch">
      <img
        className="neofetch-photo"
        src={resolveAsset(about.photo)}
        alt={about.name}
        width={180}
        height={180}
      />
      <div className="neofetch-lines">
        <h1 className="neofetch-name">{about.name}</h1>
        <dl>
          <div className="neofetch-line">
            <dt>{t("neofetch.tagline")}</dt>
            <dd>{pickText(about.tagline, lang)}</dd>
          </div>
          {about.lines.map((line, i) => (
            <div className="neofetch-line" key={i}>
              <dt id={`neofetch-line-${i}`}>{pickText(line.label, lang)}</dt>
              <dd>
                {line.rows ? (
                  <LanguageTable
                    rows={line.rows}
                    labelId={`neofetch-line-${i}`}
                  />
                ) : (
                  <LineValue line={line} />
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
