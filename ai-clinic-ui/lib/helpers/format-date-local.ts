export const formatDateLocal = (date: Date | string | null) => {
  if (!date) return "";
  const d = new Date(date);
  // This gets the year, month, and day based on the USER'S computer time, not UTC
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
