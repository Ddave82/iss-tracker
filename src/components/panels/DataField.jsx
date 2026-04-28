export function DataField({ label, value, hint, emphasized = false }) {
  return (
    <article className={`data-field${emphasized ? " is-emphasized" : ""}`}>
      <span className="data-field-label">{label}</span>
      <strong className="data-field-value">{value}</strong>
      {hint ? <span className="data-field-hint">{hint}</span> : null}
    </article>
  );
}
