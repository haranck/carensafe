// Pure date helpers for the admin reports. Reports follow India time (fixed +05:30, no daylight saving), whatever
// the server's own timezone is.

const REPORT_TIMEZONE = 'Asia/Kolkata';
const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Orders that count as sales: delivered, and delivered with some lines returned since
const SALE_STATUSES = ['delivered', 'partially_returned'];
// Never became real orders (stock released before payment)
const UNPLACED_STATUSES = ['pending_payment', 'payment_failed', 'payment_expired'];

const REPORT_PERIODS = ['daily', 'weekly', 'monthly', 'yearly', 'custom'];

// Chart bucket per unit: $dateToString format + how to step to the next bucket
const BUCKET_FORMATS = { hour: '%Y-%m-%dT%H', day: '%Y-%m-%d', month: '%Y-%m' };

// A Date whose UTC fields read as India wall-clock time (and back)
const toIst = (date) => new Date(date.getTime() + IST_OFFSET_MS);
const fromIst = (shifted) => new Date(shifted.getTime() - IST_OFFSET_MS);

// Midnight (India time) of the day `date` falls on
const startOfIstDay = (date) => {
    const shifted = toIst(date);
    shifted.setUTCHours(0, 0, 0, 0);
    return fromIst(shifted);
};

// Midnight (India time) of the 1st of the month `date` falls on, moved `addMonths` months
const startOfIstMonth = (date, addMonths = 0) => {
    const shifted = toIst(date);
    return fromIst(new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + addMonths, 1)));
};

// "YYYY-MM-DD" (an India calendar day) → its midnight
const parseIstDay = (value) => {
    const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
    return fromIst(new Date(Date.UTC(year, month - 1, day)));
};

const pad = (value) => String(value).padStart(2, '0');

// The bucket key $dateToString produces for `date` (same formats as BUCKET_FORMATS)
const bucketKey = (date, unit) => {
    const shifted = toIst(date);
    const day = `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
    if (unit === 'hour') return `${day}T${pad(shifted.getUTCHours())}`;
    if (unit === 'month') return day.slice(0, 7);
    return day;
};

const nextBucket = (date, unit) => {
    if (unit === 'hour') return new Date(date.getTime() + 60 * 60 * 1000);
    if (unit === 'month') return startOfIstMonth(date, 1);
    return new Date(date.getTime() + DAY_MS);
};

// Every bucket key in [start, end), so days without sales still show as 0
const bucketKeys = (start, end, unit) => {
    const keys = [];
    for (let cursor = start; cursor < end; cursor = nextBucket(cursor, unit)) keys.push(bucketKey(cursor, unit));
    return keys;
};

/**
 * Report window for a period, as [start, end) plus the chart unit:
 * daily = today by hour, weekly = last 7 days, monthly = last 30 days (by day), yearly = last 12 months (by month),
 * custom = from..to inclusive (by day, or by month past ~3 months).
 */
const periodRange = (period, { from, to } = {}, now = new Date()) => {
    const tomorrow = new Date(startOfIstDay(now).getTime() + DAY_MS);
    switch (period) {
        case 'daily':
            return { start: startOfIstDay(now), end: tomorrow, unit: 'hour' };
        case 'weekly':
            return { start: new Date(tomorrow.getTime() - 7 * DAY_MS), end: tomorrow, unit: 'day' };
        case 'yearly':
            return { start: startOfIstMonth(now, -11), end: tomorrow, unit: 'month' };
        case 'custom': {
            const start = parseIstDay(from);
            const end = new Date(parseIstDay(to).getTime() + DAY_MS);
            return { start, end, unit: end - start > 92 * DAY_MS ? 'month' : 'day' };
        }
        case 'monthly':
        default:
            return { start: new Date(tomorrow.getTime() - 30 * DAY_MS), end: tomorrow, unit: 'day' };
    }
};

// Rupees rounded to paise (sums of decimals drift otherwise)
const roundMoney = (value) => Math.round((value || 0) * 100) / 100;

// Change against the previous window in % (null when there was nothing before)
const percentChange = (current, previous) => (previous ? roundMoney(((current - previous) / previous) * 100) : null);

module.exports = {
    REPORT_TIMEZONE,
    DAY_MS,
    SALE_STATUSES,
    UNPLACED_STATUSES,
    REPORT_PERIODS,
    BUCKET_FORMATS,
    startOfIstDay,
    bucketKeys,
    periodRange,
    roundMoney,
    percentChange
};
