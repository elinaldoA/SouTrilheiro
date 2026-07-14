import { useEffect, useRef, useState } from 'react';

const EMOJIS = [
  '😀', '😂', '😊', '😍', '😎', '🤔', '😅', '😉',
  '🙌', '👏', '👍', '👎', '🙏', '💪', '🤝', '✌️',
  '❤️', '🔥', '⭐', '🎉', '😢', '😱', '😴', '👌',
  '🏞️', '⛰️', '🥾', '🌲', '🌄', '🌅', '☀️', '🌧️',
  '💧', '🐾', '🧭', '🎒', '📸', '🗺️', '🚵', '🏕️',
];

export default function EmojiPicker({ onEscolher }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(e) {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false);
    }
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, [aberto]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="emoji-picker-btn"
        onClick={() => setAberto((v) => !v)}
        aria-label="Escolher emoji"
        aria-expanded={aberto}
      >
        🙂
      </button>

      {aberto && (
        <div className="emoji-picker-panel">
          {EMOJIS.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              type="button"
              className="emoji-picker-item"
              onClick={() => {
                onEscolher(emoji);
                setAberto(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
