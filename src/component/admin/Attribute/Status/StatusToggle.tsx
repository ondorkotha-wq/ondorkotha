const StatusToggle = ({
  active,
  onToggle,
  disabled = false,
}: {
  active: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    disabled={disabled}
    onClick={() => onToggle(!active)}
    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors outline-none ${disabled ? "opacity-80 cursor-default" : "cursor-pointer"} ${active ? "bg-emerald-500" : "bg-slate-300"}`}
  >
    <span
      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${active ? "translate-x-6" : "translate-x-1"}`}
    />
  </button>
);

export default StatusToggle;
