import type { Color } from '@shared/types';

interface ColorPickerProps {
  onSelect: (color: Color) => void;
  onCancel: () => void;
}

const COLORS: { value: Color; label: string; from: string; to: string; shadow: string }[] = [
  { value: 'red',    label: 'Red',    from: 'from-red-400',    to: 'to-rose-600',    shadow: 'shadow-red-500/50'    },
  { value: 'blue',   label: 'Blue',   from: 'from-blue-400',   to: 'to-indigo-600',  shadow: 'shadow-blue-500/50'   },
  { value: 'green',  label: 'Green',  from: 'from-emerald-400',to: 'to-teal-600',    shadow: 'shadow-emerald-500/50'},
  { value: 'yellow', label: 'Yellow', from: 'from-yellow-300', to: 'to-amber-500',   shadow: 'shadow-amber-400/50'  },
];

export default function ColorPicker({ onSelect, onCancel }: ColorPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="glass rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm mx-0 sm:mx-4 animate-slideUp shadow-2xl">
        {/* Handle (mobile) */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 sm:hidden" />

        <h2 className="text-white font-black text-xl text-center mb-1">Choose a Color</h2>
        <p className="text-white/40 text-xs text-center mb-5">The wild card will match your choice</p>

        <div className="grid grid-cols-2 gap-3">
          {COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => onSelect(c.value)}
              className={`
                bg-gradient-to-br ${c.from} ${c.to}
                rounded-2xl py-6 text-white font-black text-lg
                transition-all active:scale-90 hover:scale-105 shadow-xl ${c.shadow}
                flex flex-col items-center justify-center gap-2
                border border-white/20
              `}
            >
              <span className="w-6 h-6 rounded-full bg-white/30 shadow-inner" />
              {c.label}
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="mt-4 w-full py-2.5 text-white/40 hover:text-white/70 text-sm transition-colors rounded-xl hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
