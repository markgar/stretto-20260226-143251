export default function EventTypeBadge({ type }: { type: number }) {
  if (type === 0) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700">
        Rehearsal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700">
      Performance
    </span>
  );
}
