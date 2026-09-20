import { CONFIG } from '../config.js'

const { utcOffsetHours, workDays, openHour, closeHour } = CONFIG.desk
const OFFSET_MS = utcOffsetHours * 3600_000
const DAY_MS = 86_400_000

/** Wall-clock parts in Saudi time. Riyadh has no DST, so a fixed offset is exact. */
function riyadhParts(date) {
  const d = new Date(date.getTime() + OFFSET_MS)
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth(),
    day: d.getUTCDate(),
    dow: d.getUTCDay(),
    minutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
  }
}

function riyadhDate(y, m, day, hour) {
  return new Date(Date.UTC(y, m, day, hour, 0) - OFFSET_MS)
}

export function nextOpening(after) {
  for (let i = 0; i <= 7; i++) {
    const p = riyadhParts(new Date(after.getTime() + i * DAY_MS))
    const opening = riyadhDate(p.y, p.m, p.day, openHour)
    if (workDays.includes(p.dow) && opening.getTime() > after.getTime()) return opening
  }
  return new Date(after.getTime() + DAY_MS)
}

export function isDeskOpen(now = new Date()) {
  const p = riyadhParts(now)
  return workDays.includes(p.dow) && p.minutes >= openHour * 60 && p.minutes < closeHour * 60
}

/** Adds working hours on the Sunday–Thursday desk calendar. */
export function addBusinessHours(start, hours) {
  let remaining = hours * 60
  let cursor = new Date(start)
  for (let guard = 0; guard < 64; guard++) {
    const p = riyadhParts(cursor)
    if (!workDays.includes(p.dow) || p.minutes >= closeHour * 60) {
      cursor = nextOpening(cursor)
      continue
    }
    if (p.minutes < openHour * 60) {
      cursor = riyadhDate(p.y, p.m, p.day, openHour)
      continue
    }
    const available = closeHour * 60 - p.minutes
    if (remaining <= available) return new Date(cursor.getTime() + remaining * 60_000)
    remaining -= available
    cursor = nextOpening(riyadhDate(p.y, p.m, p.day, closeHour))
  }
  return cursor
}

export function formatRiyadh(date, options) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Riyadh', ...options }).format(date)
}

export function deskStatus(now = new Date()) {
  if (isDeskOpen(now)) {
    return { open: true, label: 'Sales desk open', detail: `Replying until ${closeHour}:00 AST` }
  }
  const opening = nextOpening(now)
  return {
    open: false,
    label: 'Desk opens ' + formatRiyadh(opening, { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + ' AST',
    detail: 'Requests received now are first in the queue',
  }
}

export function quotationDueDate(submittedAt = new Date()) {
  return addBusinessHours(submittedAt, CONFIG.quoteSlaBusinessHours)
}
