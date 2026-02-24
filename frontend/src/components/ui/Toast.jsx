import clsx from 'clsx';

const STYLES = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800',
};

export function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(({ id, message, type }) => (
        <div key={id} className={clsx('border rounded-lg px-4 py-3 text-sm shadow-lg', STYLES[type] ?? STYLES.info)}>
          {message}
        </div>
      ))}
    </div>
  );
}
