import {
    format,
    addDays,
    addWeeks,
    addMonths,
    addYears,
    parse,
    differenceInDays,
    differenceInWeeks,
    differenceInMonths,
    differenceInYears
} from "date-fns"
import { es } from "date-fns/locale"

export const FORMATS = {
    SHORT_FRONT: "dd/MM/yyyy",
    DATE_TIME_FRONT: "dd/MM/yyyy HH:mm",
    DATE_TIME_FULL_FRONT: "dd/MM/yyyy HH:mm:ss",
    SHORT_BACK: "yyyy-MM-dd",
    DATE_TIME_BACK: "yyyy-MM-dd HH:mm",
    DATE_TIME_FULL_BACK: "yyyy-MM-dd HH:mm:ss",
    ISO_STRING: "yyyy-MM-dd'T'HH:mm:ss'Z'"
}

export function formatDate(date, formatStr = "dd/MM/yyyy") {
    if (!date) return "N/A"
    try {
        if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const [year, month, day] = date.split("-").map(Number)
            date = new Date(year, month - 1, day)
        }
        return format(date, formatStr, { locale: es })
    } catch (error) {
        console.error("[Date] Error formatting date:", error)
        return "Fecha inválida"
    }
}

export function dateShortFront(date) {
    return formatDate(date)
}

export function dateTimeFront(date, full = false) {
    return formatDate(date, `dd/MM/yyyy HH:mm${full ? ":ss" : ""}`)
}

export function dateShortBack(date) {
    return formatDate(date, "yyyy-MM-dd")
}

export function dateTimeBack(date, full = false) {
    return formatDate(date, `yyyy-MM-dd HH:mm${full ? ":ss" : ""}`)
}

export function dateAdd(date, amount, unit = "days") {
    const adds = {
        days: addDays,
        weeks: addWeeks,
        months: addMonths,
        years: addYears
    }

    return adds[unit](date, amount)
}

export function dateSub(date, amount, unit) {
    return dateAdd(date, -amount, unit)
}

export function parseDateStr(dateString, formatStr = "yyyy-MM-dd") {
    try {
        return parse(dateString, formatStr, new Date())
    } catch (error) {
        console.error("[Date] Error parsing date:", error)
        return null
    }
}

export function dateDifF(start, end, unit = "days") {
    const diffs = {
        days: differenceInDays(end, start),
        weeks: differenceInWeeks(end, start),
        months: differenceInMonths(end, start),
        years: differenceInYears(end, start)
    }

    try {
        if (unit in diffs) return diffs[unit]

        console.error(`[Date] Unsupported unit for dateDifF: ${unit}`)
        return null
    } catch (error) {
        console.error("[Date] Error calculating date difference:", error)
        return null
    }
}
