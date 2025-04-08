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

// Change this function to add 23 hours and 59 minutes to the given date
export const formatAdvanceDate = (date: Date| null) =>{
  if (!date) return "N/A";

  // Add 23 hours and 59 minutes (in milliseconds)
  const advanceMs = (23 * 60 + 59) * 60 * 1000;

  const advancedDate = new Date(date.getTime() + advanceMs);

  return advancedDate.toUTCString();
}

//formats a date with only the day, month and year
export const formatDate = (date: Date | null) => {
  return date ? new Date(date).toUTCString() : "N/A";
};

//formats a date with the date and timestamp
export const formatDateTime = (date: Date | null) => {
  return date ? new Date(date).toLocaleDateString("en-US", optionsDateTime) : "N/A";
};
