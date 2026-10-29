const Equalizer = ({ active = true, className }: { active?: boolean; className?: string }) => (
  <span className={`eq ${active ? "is-active" : ""} ${className ?? ""}`} aria-hidden="true">
    <i />
    <i />
    <i />
    <i />
  </span>
);

export default Equalizer;
