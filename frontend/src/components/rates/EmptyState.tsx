interface EmptyStateProps {
  message: string;
  subMessage?: React.ReactNode;
}

export function EmptyState({ message, subMessage }: EmptyStateProps) {
  return (
    <div className="text-center py-16 text-[12px] text-slate-400">
      {message}
      {subMessage && (
        <>
          <br />
          {subMessage}
        </>
      )}
    </div>
  );
}