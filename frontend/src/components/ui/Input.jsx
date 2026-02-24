import clsx from 'clsx';

export function Input({ label, error, className, required, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        className={clsx(
          'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors',
          'placeholder:text-gray-400',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
            : 'border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, rows = 4, required, className, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={clsx(
          'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors resize-none',
          'placeholder:text-gray-400',
          error
            ? 'border-red-400 focus:border-red-500'
            : 'border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Select({ label, options = [], error, required, className, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        className={clsx(
          'w-full rounded-lg border px-3 py-2 text-sm bg-white outline-none',
          error ? 'border-red-400' : 'border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500',
          className
        )}
        {...props}
      >
        {options.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
