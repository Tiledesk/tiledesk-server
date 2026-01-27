const { expect } = require('chai');
const datesUtil = require('../utils/datesUtil');
const moment = require('moment-timezone');

describe('datesUtil', () => {

    it('test1', () => {
        const startDate = '21/01/2026';
        const endDate = '21/01/2026';
        const timezone = 'Europe/Rome';

        const res = datesUtil.createDateRangeQuery(startDate, endDate, timezone);

        expect(res).to.have.property('createdAt');
        expect(res.createdAt).to.have.property('$gte');
        expect(res.createdAt).to.have.property('$lt');

        let startDateUTC = new Date("2026-01-20T23:00:00.000Z").toISOString();
        let endDateUTC = new Date("2026-01-21T23:00:00.000Z").toISOString();
    
        expect(res.createdAt.$gte.toISOString()).to.equal(startDateUTC);
        expect(res.createdAt.$lt.toISOString()).to.equal(endDateUTC);
    })

    it('test2', () => {
        const startDate = '20/01/2026, 12:25';
        const endDate = '20/01/2026, 15:25 ';
        const timezone = 'Europe/Rome';

        const res = datesUtil.createDateRangeQuery(startDate, endDate, timezone);

        console.log(res);

        expect(res).to.have.property('createdAt');
        expect(res.createdAt).to.have.property('$gte');
        expect(res.createdAt).to.have.property('$lte');

        let startDateUTC = new Date("2026-01-20T11:25:00.000Z").toISOString();
        let endDateUTC = new Date("2026-01-20T14:25:00.000Z").toISOString();
    
        expect(res.createdAt.$gte.toISOString()).to.equal(startDateUTC);
        expect(res.createdAt.$lte.toISOString()).to.equal(endDateUTC);
    })
//   describe('parseDate', () => {
//     it('should parse DD/MM/YYYY format and apply timezone', () => {
//       const dateStr = '28/02/2023';
//       const timezone = 'Europe/Rome';
//       const m = datesUtil.parseDate(dateStr, timezone);
//       expect(m).to.be.an.instanceof(moment);
//       expect(m.tz()).to.equal(timezone);
//       expect(m.format('DD/MM/YYYY')).to.equal('28/02/2023');
//     });

//     it('should parse DD/MM/YYYY HH:mm:ss format and apply timezone', () => {
//       const dateStr = '01/03/2023 13:14:15';
//       const timezone = 'America/New_York';
//       const m = datesUtil.parseDate(dateStr, timezone);

//       expect(m.format('DD/MM/YYYY HH:mm:ss')).to.equal('01/03/2023 07:14:15');
//       expect(m.tz()).to.equal(timezone);
//     });

//     it('should throw error for invalid timezone', () => {
//       expect(() => datesUtil.parseDate('01/03/2023', 'Invalid/Zone')).to.throw('Invalid timezone');
//     });

//     it('should throw error for unparseable date', () => {
//       expect(() => datesUtil.parseDate('notadate', 'Europe/Rome')).to.throw('Unable to parse the date');
//     });
//   });


//   describe('hasTimeComponent', () => {
//     it('should return true for string with time', () => {
//       expect(datesUtil.hasTimeComponent('20/02/2021 23:31:01')).to.be.true;
//       expect(datesUtil.hasTimeComponent('20/02/2021 02:31')).to.be.true;
//     });
//     it('should return false for string without time', () => {
//       expect(datesUtil.hasTimeComponent('20/02/2021')).to.be.false;
//       expect(datesUtil.hasTimeComponent('01/03/2022')).to.be.false;
//     });
//   });

//   describe('convertLocalDatesToUTC', () => {
//     it('should convert start and end dates and output correct UTC ISO strings', () => {
//       const timezone = 'Europe/Rome';
//       const startDate = '01/06/2021';
//       const endDate = '05/06/2021';
//       const res = datesUtil.convertLocalDatesToUTC(startDate, endDate, timezone);

//       // startDateUTC should be 2021-06-01T00:00:00.000Z in UTC
//       expect(res.startDateUTC).to.match(/^2021-05-31T22:00:00/);
//       // endDateUTC should be 2021-06-06T00:00:00.000Z in UTC (start of *next* day)
//       expect(res.endDateUTC).to.match(/^2021-06-05T22:00:00/);
//     });

//     it('should convert when time is included in the dates', () => {
//       const timezone = 'America/New_York';
//       const startDate = '20/07/2022 09:30:00';
//       const endDate = '21/07/2022 17:45:10';
//       const res = datesUtil.convertLocalDatesToUTC(startDate, endDate, timezone);
//       // The result.startDateUTC and endDateUTC should be the same as the input local time mapped to UTC
//       expect(new Date(res.startDateUTC).toISOString()).to.equal(res.startDateUTC);
//       expect(new Date(res.endDateUTC).toISOString()).to.equal(res.endDateUTC);
//     });

//     it('should throw if both startDate and endDate are missing', () => {
//       expect(() => datesUtil.convertLocalDatesToUTC(null, null, 'Europe/Rome')).to.throw('At least one of startDate or endDate must be provided');
//     });
//   });

//   describe('createDateRangeQuery', () => {
//     it('should generate MongoDB query with $gte and $lt for date only', () => {
//       const tz = 'Europe/Rome';
//       const res = datesUtil.createDateRangeQuery('02/02/2022', '05/02/2022', tz, 'createdAt');
//       expect(res).to.have.property('createdAt');
//       expect(res.createdAt).to.have.property('$gte');
//       expect(res.createdAt).to.have.property('$lt');
//       expect(res.createdAt).to.not.have.property('$lte');
//     });

//     it('should use $lte operator for endDate with time component', () => {
//       const tz = 'Europe/Rome';
//       const r = datesUtil.createDateRangeQuery('02/02/2022 09:00:00', '05/02/2022 18:23:10', tz, 'createdAt');
//       expect(r.createdAt).to.have.property('$gte');
//       expect(r.createdAt).to.have.property('$lte');
//       expect(r.createdAt).to.not.have.property('$lt');
//     });

//     it('should allow custom fieldName', () => {
//       const tz = 'Europe/Rome';
//       const result = datesUtil.createDateRangeQuery('10/08/2023', '15/08/2023', tz, 'customField');
//       expect(result).to.have.property('customField');
//       expect(result.customField).to.have.property('$gte');
//       expect(result.customField).to.have.property('$lt');
//     });

//     it('should allow only startDate', () => {
//       const tz = 'Europe/Rome';
//       const result = datesUtil.createDateRangeQuery('10/09/2023', undefined, tz);
//       expect(result).to.have.property('createdAt');
//       expect(result.createdAt).to.have.property('$gte');
//       expect(result.createdAt).to.not.have.property('$lt');
//       expect(result.createdAt).to.not.have.property('$lte');
//     });

//     it('should allow only endDate', () => {
//       const tz = 'Europe/Rome';
//       const result = datesUtil.createDateRangeQuery(null, '10/09/2023', tz);
//       expect(result).to.have.property('createdAt');
//       expect(result.createdAt).to.have.property('$lt');
//       expect(result.createdAt).to.not.have.property('$gte');
//       expect(result.createdAt).to.not.have.property('$lte');
//     });

//     it('should throw error for invalid timezone', () => {
//       expect(() => datesUtil.createDateRangeQuery('01/01/2023', '02/01/2023', 'Invalid/Timezone')).to.throw('Invalid timezone');
//     });
//   });

});
