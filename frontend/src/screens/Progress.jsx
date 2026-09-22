import MetricBubbles from "../components/MetricBubbles.jsx";
import ActivityGrid from "../components/ActivityGrid.jsx";

export default function Progress() {
  return (
    <div className="stack">
      <div>
        <h1 className="h1">Your progress</h1>
        <p className="muted">Everything you've won back so far — tap a card for detail.</p>
      </div>
      <ActivityGrid />
      <MetricBubbles />
    </div>
  );
}
