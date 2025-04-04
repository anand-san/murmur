/**
 * Format seconds into a MM:SS time display
 * @param seconds Number of seconds to format
 * @returns Formatted time string (MM:SS)
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};
