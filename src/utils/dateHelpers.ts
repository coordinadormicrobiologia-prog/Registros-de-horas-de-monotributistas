// src/utils/dateHelpers.ts
// Helper functions for date formatting to avoid "Invalid Date" issues

/**
 * Formats a date string for display, handling both ISO timestamps and YYYY-MM-DD formats
 * @param dateStr - Date string in ISO format (with T) or YYYY-MM-DD format
 * @returns Formatted date string in DD/MM format for es-AR locale
 */
export function formatLogDateForDisplay(dateStr: string): string {
  if (!dateStr) return 'Invalid Date';
  
  try {
    // If date contains 'T' or 'Z', it's likely an ISO timestamp
    if (dateStr.includes('T') || dateStr.includes('Z')) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
      }
    }
    
    // If it matches YYYY-MM-DD format, add time component to avoid timezone issues
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const date = new Date(dateStr + 'T12:00:00');
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
      }
    }
    
    // Try to parse as-is as fallback
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    }
  } catch (err) {
    console.error('Error formatting date:', dateStr, err);
  }
  
  return 'Invalid Date';
}

/**
 * Extracts YYYY-MM-DD from an ISO timestamp or returns the date as-is
 * @param dateStr - Date string (ISO or YYYY-MM-DD)
 * @returns Date in YYYY-MM-DD format
 */
export function extractDateYYYYMMDD(dateStr: string): string {
  if (!dateStr) return '';
  
  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // If it contains 'T' or 'Z', extract date part
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0];
  }
  
  // Try to parse and format
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (err) {
    console.error('Error extracting date:', dateStr, err);
  }
  
  return dateStr;
}

/**
 * Extracts HH:MM from a timestamp like "1899-12-30T12:16:48.000Z" or returns time as-is
 * @param timeStr - Time string (ISO timestamp or HH:MM)
 * @returns Time in HH:MM format
 */
export function extractTimeHHMM(timeStr: string): string {
  if (!timeStr) return '';
  
  // If already in HH:MM format, return as-is
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    return timeStr;
  }
  
  // If it contains 'T', extract time part
  if (timeStr.includes('T')) {
    try {
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      }
    } catch (err) {
      console.error('Error extracting time:', timeStr, err);
    }
  }
  
  return timeStr;
}
