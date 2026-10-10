import { parseISODate } from '@/domain/dates';
import type { ISODate } from '@/domain/types';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const usdWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const formatMoney = (value: number): string => usd.format(value);
export const formatMoneyWhole = (value: number): string => usdWhole.format(value);

const shortDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
const longDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
const monthTitle = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export const formatDate = (value: ISODate): string => shortDate.format(parseISODate(value));
export const formatDateLong = (value: ISODate): string => longDate.format(parseISODate(value));
export const formatMonthTitle = (month: string): string =>
  monthTitle.format(parseISODate(`${month}-01`));

export const pluralize = (count: number, singular: string, plural = `${singular}s`): string =>
  `${count} ${count === 1 ? singular : plural}`;
