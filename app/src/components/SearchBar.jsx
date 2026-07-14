export default function SearchBar({ value, onChange }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Buscar por nome ou cidade"
      aria-label="Buscar trilhas"
      className="field"
    />
  );
}
