import ActivityGrid from "../components/ActivityGrid.jsx";
import HealthRecovery from "../components/HealthRecovery.jsx";

export default function Progress() {
  return (
    <div className="stack">
      <div>
        <h1 className="h1" style={{ fontSize: "1.7rem" }}>Your progress</h1>
        <p className="muted" style={{ margin: "0.15rem 0 0" }}>Everything you have won back so far.</p>
      </div>
      <ActivityGrid />
      <HealthRecovery />
    </div>
  );
}
