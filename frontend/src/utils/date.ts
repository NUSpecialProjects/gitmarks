const optionsDate: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

const optionsDateTime: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

//formats a date with only the day, month and year
export const formatDate = (date: Date | null) => {
  return date ? new Date(date).toLocaleDateString("en-US", optionsDate) : "N/A";
};

//formats a date with the date and timestamp
export const formatDateTime = (date: Date | null) => {
  return date
    ? new Date(date).toLocaleDateString("en-US", optionsDateTime)
    : "N/A";
};

export const formatRelativeTime = (date: Date | undefined) => {
  if (!date) return "N/A";

  const diff = new Date().getTime() - new Date(date).getTime();

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return rtf.format(-seconds, "second");

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, "minute");

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");

  const days = Math.floor(hours / 24);
  return rtf.format(-days, "day");
};
