import { useState } from "react";
export default function SourceCard({ source, index }) {
  const [open, setOpen] = useState(false);
  const percent = Math.round((source.score || 0) * 100);

  return (
    <div className="source-card" onClick={() => setOpen((o) => !o)}>
      <div className="source-top">
        <span className="source-doc">📄</span>
        <div className="source-info">
          <div className="source-label">Source {index}:</div>
          <div className="source-name">{source.source || source.category || "Hospital info"}</div>
        </div>
        <span className="source-score">{percent}% match</span>
      </div>
      {open && source.snippet && <p className="source-snippet">{source.snippet}</p>}
    </div>
  );
}