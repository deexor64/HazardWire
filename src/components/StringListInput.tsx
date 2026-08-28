"use client";

type Props = {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

export default function StringListInput({
  label,
  values,
  onChange,
  placeholder = "",
}: Props) {
  function updateAt(index: number, text: string) {
    const next = values.map((v, i) => (i === index ? text : v));
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function addEmpty() {
    onChange([...values, ""]);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>

      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={value}
              onChange={(e) => updateAt(index, e.target.value)}
              className="input-base flex-1"
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-500 hover:text-red-600"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addEmpty}
        className="mt-2 text-sm text-orange-600 font-medium hover:underline"
      >
        + Add
      </button>
    </div>
  );
}
