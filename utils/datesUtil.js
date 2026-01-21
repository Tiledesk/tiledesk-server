const moment = require('moment-timezone');

class DatesUtil {

  /**
   * Helper function to parse a date with optional time
   * Supports formats: DD/MM/YYYY, DD/MM/YYYY HH:mm, DD/MM/YYYY HH:mm:ss, DD/MM/YYYY, HH:mm:ss
   * 
   * @param {string} dateString - Date string with or without time
   * @param {string} timezone - Timezone
   * @returns {moment.Moment} Parsed moment object
   */
  parseDate(dateString, timezone) {
    if (!dateString || typeof dateString !== 'string') {
      throw new Error(`The date must be a string: ${dateString}`);
    }

    if (!timezone || typeof timezone !== 'string') {
      throw new Error(`The timezone must be a string: ${timezone}`);
    }

    // Validate timezone: check if it's a valid IANA timezone
    if (!moment.tz.zone(timezone)) {
      throw new Error(`Invalid timezone: ${timezone}. Please use a valid IANA timezone (e.g., "Europe/Rome", "America/New_York")`);
    }

    const trimmedDate = dateString.trim();

    // List of possible formats to try
    const formats = [
      'DD/MM/YYYY HH:mm:ss',
      'DD/MM/YYYY, HH:mm:ss',
      'DD/MM/YYYY HH:mm',
      'DD/MM/YYYY, HH:mm',
      'DD/MM/YYYY',
      'YYYY/MM/DD HH:mm:ss',
      'YYYY/MM/DD, HH:mm:ss',
      'YYYY/MM/DD HH:mm',
      'YYYY/MM/DD, HH:mm',
      'YYYY/MM/DD'
    ];

    // Try every format until one valid is found
    for (const format of formats) {
      // Parse the date in the specified format (without timezone)
      const parsed = moment(trimmedDate, format, true); // strict mode
      if (parsed && parsed.isValid && parsed.isValid()) {
        // Apply the timezone to the parsed date
        const dateWithTimezone = parsed.tz(timezone);
        
        // Verify that the timezone was applied correctly
        if (!dateWithTimezone || !dateWithTimezone.isValid || !dateWithTimezone.isValid()) {
          throw new Error(`Unable to apply timezone ${timezone} to date: ${dateString}`);
        }
        
        return dateWithTimezone;
      }
    }

    throw new Error(`Unable to parse the date: ${dateString} with timezone: ${timezone}`);
  }

  /**
   * Checks if a date string contains time information
   * 
   * @param {string} dateString - Date string
   * @returns {boolean} True if contains time information
   */
  hasTimeComponent(dateString) {
    // Checks if contains time information (HH:mm or HH:mm:ss)
    return /[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?/.test(dateString);
  }

  /**
   * Converts local dates to UTC for database queries
   * 
   * @param {string|null|undefined} startDate - Start date in the format DD/MM/YYYY or DD/MM/YYYY HH:mm:ss (e.g. "20/01/2026" or "20/01/2026 14:30:00"). Optional.
   * @param {string|null|undefined} endDate - End date in the format DD/MM/YYYY or DD/MM/YYYY HH:mm:ss (e.g. "20/01/2026" or "20/01/2026 23:59:59"). Optional.
   * @param {string} timezone - User timezone (e.g. "Europe/Rome", "America/New_York", "Asia/Tokyo")
   * @returns {Object} Object with startDateUTC and/or endDateUTC in ISO string format for MongoDB
   */
  convertLocalDatesToUTC(startDate, endDate, timezone) {
    if (!timezone || typeof timezone !== 'string') {
      throw new Error(`The timezone must be a string: ${timezone}`);
    }

    // Validate timezone: check if it's a valid IANA timezone
    if (!moment.tz.zone(timezone)) {
      throw new Error(`Invalid timezone: ${timezone}. Please use a valid IANA timezone (e.g., "Europe/Rome", "America/New_York")`);
    }

    const result = {
      startDateUTC: null,
      endDateUTC: null,
      startDate: null,
      endDate: null
    };

    // Parse startDate if provided
    if (startDate) {
      const startMoment = this.parseDate(startDate, timezone);
      // If startDate does not contain time, use the start of the day
      // Otherwise use the specified time
      const startParsed = this.hasTimeComponent(startDate)
        ? startMoment
        : startMoment.startOf('day');

      result.startDateUTC = startParsed.utc().toISOString();
      result.startDate = startParsed.utc().toDate();
    }

    // Parse endDate if provided
    if (endDate) {
      const endMoment = this.parseDate(endDate, timezone);
      // If endDate does not contain time, use the start of the next day
      // Otherwise use the specified time
      const endParsed = this.hasTimeComponent(endDate)
        ? endMoment
        : endMoment.clone().add(1, 'day').startOf('day');

      result.endDateUTC = endParsed.utc().toISOString();
      result.endDate = endParsed.utc().toDate();
    }

    // At least one date must be provided
    if (!startDate && !endDate) {
      throw new Error('At least one of startDate or endDate must be provided');
    }

    return result;
  }

  /**
   * Creates a MongoDB query object with the converted dates in UTC
   * 
   * @param {string|null|undefined} startDate - Start date in the format DD/MM/YYYY or DD/MM/YYYY HH:mm:ss. Optional (from this date onwards).
   * @param {string|null|undefined} endDate - End date in the format DD/MM/YYYY or DD/MM/YYYY HH:mm:ss. Optional (until this date).
   * @param {string} timezone - User timezone
   * @param {string} fieldName - Field name in the database (default: "createdAt")
   * @returns {Object} MongoDB query object with $gte (if startDate provided), $lt/$lte (if endDate provided), or both
   */
  createDateRangeQuery(startDate, endDate, timezone, fieldName = 'createdAt') {
    const { startDate: start, endDate: end } = this.convertLocalDatesToUTC(startDate, endDate, timezone);

    const query = {};
    const dateQuery = {};

    // Add start date condition (from this date onwards)
    if (start) {
      dateQuery.$gte = start;
    }

    // Add end date condition (until this date)
    if (end) {
      // If endDate contains time, use $lte to include up to that time
      // Otherwise use $lt to exclude the start of the next day
      const endOperator = endDate && this.hasTimeComponent(endDate) ? '$lte' : '$lt';
      dateQuery[endOperator] = end;
    }

    // Only add the date query if at least one condition was set
    if (Object.keys(dateQuery).length > 0) {
      query[fieldName] = dateQuery;
    }

    return query;
  }

}

const datesUtil = new DatesUtil();
module.exports = datesUtil;