import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useDisplay } from 'vuetify/framework'
dayjs.extend(relativeTime)
dayjs.extend(duration)

export function timeTransformAgo (time) {
  const { smAndUp } = useDisplay()
  if (smAndUp.value) {
    if (time?._seconds) {
      return dayjs.unix(time._seconds).fromNow()
    }
    if (time?.seconds) {
      return dayjs.unix(time.seconds).fromNow()
    }
    return ''
  } else {
    const timeInSeconds = time?._seconds || time?.seconds
    if (!timeInSeconds) {
      return ''
    }
    const a = dayjs.unix(timeInSeconds)
    const b = dayjs()
    const diff = dayjs.duration(b.diff(a))

    const years = Math.floor(diff.asYears())
    if (years > 0) {
      return `${years}y ago`
    }
    const months = Math.floor(diff.asMonths())
    if (months > 0) {
      return `${months}M ago`
    }
    const days = Math.floor(diff.asDays())
    if (days > 0) {
      return `${days}d ago`
    }
    const hours = Math.floor(diff.asHours())
    if (hours > 0) {
      return `${hours}h ago`
    }
    const minutes = Math.floor(diff.asMinutes())
    if (minutes > 0) {
      return `${minutes}m ago`
    }
    return `${Math.floor(diff.asSeconds())}s ago`
  }
}
