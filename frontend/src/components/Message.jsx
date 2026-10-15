export default function Message({ message, fmtTime }) {
  const isUser = message.role === "user";

  return (
    <div className={`row ${isUser ? "row-user" : "row-bot"}`}>
      {!isUser && <div className="avatar">🤖</div>}

      <div className="col">
        <div className={`bubble ${isUser ? "bubble-user" : "bubble-bot"} ${message.error ? "bubble-error" : ""}`}>
          <div className="text">{message.content}</div>
          {message.ts && (
            <div className="meta">
              {fmtTime(message.ts)} {isUser && <span className="ticks">✓✓</span>}
            </div>
          )}
        </div>

        {!isUser && !message.error && message.ts && (
          <div className="actions">
            <button title="Helpful">👍</button>
            <button title="Not helpful">👎</button>
            <button title="Copy" onClick={() => navigator.clipboard?.writeText(message.content)}>📋</button>
          </div>
        )}
      </div>

      {isUser && <div className="avatar avatar-user">👤</div>}
    </div>
  );
}