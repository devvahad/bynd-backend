const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TimeConversionUtility = {
  minutesToMillis: (minutes) => minutes * 60_000,
  hoursToMillis: (hours) => hours * 3_600_000,
  daysToMillis: (days) => days * 86_400_000,

  formatTimestamp: (timestamp) => {
    const d = new Date(timestamp);
    return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  },

  monthName: (month) => MONTHS[month],
};

export default TimeConversionUtility;