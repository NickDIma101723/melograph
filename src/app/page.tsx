export default function Home() {
  return (
    <div className="scss-demo-container">
      <div className="card">
        <h1>SCSS is Working!</h1>
        <p>
          This card is styled using SCSS variables, nesting, and color functions.
        </p>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          Hover over this card to see the hover effect defined in SCSS.
        </p>
      </div>
    </div>
  );
}
