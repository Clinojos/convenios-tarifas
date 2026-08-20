import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400 gap-2 text-[12px]">
      <Loader2 size={16} className="animate-spin" />
      {message}
    </div>
  );
}