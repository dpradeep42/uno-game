import type { Color } from '@shared/types';

interface ColorPickerProps {
  onSelect: (color: Color) => void;
  onCancel: () => void;
}

const COLORS: { value: Color; label: string; bg: string; hover: string }[] = [
  { value: 'red',    label: 'Red',    bg: 'bg-red-500',    hover: 'hover:bg-red-400' },
  { value: 'blue',   label: 'Blue',   bg: 'bg-blue-500',   hover: 'hover:bg-blue-400' },
  { value: 'green',  label: 'Green',  bg: 'bg-green-500',  hover: 'hover:bg-green-400' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-400', hover: 'hover:bg-yellow-300' },
];

export default function ColorPicker({ onSelect, onCancel }: ColorPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 animate-slideUp">
        <h2 className="text-white text-xl font-bold text-center mb-2">Choose a color</h2>
        <p className="text-white/50 text-sm text-center mb-5">Pick the color you want to set</p>

        <div className="grid grid-cols-2 gap-3">
          {COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => onSelect(c.value)}
              className={`
                ${c.bg} ${c.hover}
                rounded-xl py-5 text-white font-bold text-lg
                transition-all active:scale-95 hover:scale-105 shadow-lg
                flex items-center justify-center gap-2
              `}
            >
              <span className="w-4 h-4 rounded-full bg-white/30 inline-block" />
              {c.label}
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="mt-4 w-full py-2 text-white/50 hover:text-white/80 text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
