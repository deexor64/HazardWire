export interface MessageBoxProps {
  message: string;
  messageType: "error" | "success" | "warning";
}

const STYLES = {
  error: "mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm",
  success: "mb-5 p-3.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm",
  warning: "mb-5 p-3.5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm",
};

export default function MessageBox({ message, messageType }: MessageBoxProps) {
  return (
    <div className={STYLES[messageType]}>
      {message}
    </div>
  );
}
