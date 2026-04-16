export default function PageSpinner() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-border border-t-brand-500" />
    </div>
  );
}
