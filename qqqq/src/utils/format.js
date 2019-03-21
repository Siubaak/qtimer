import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

export function timeFormat(msTime) {
  if (isFinite(msTime)) {
    const time = dayjs(msTime).format(msTime < 60000 ? 's.SSS' : 'm:ss.SSS')
    return time.substring(0, time.length - 1)
  } else {
    return 'DNF'
  }
}

export function dateFormat(msTime) {
  return dayjs(msTime).format('YYYY/MM/DD hh:mm')
}

export function timeParse(timeStr) {
  if (timeStr === 'DNF') {
    return dayjs(Infinity)
  } else {
    const formatStr = timeStr.length > 5 ? 'm:ss.SS' : 's.SS'
    return dayjs(timeStr, formatStr)
  }
}
