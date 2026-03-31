export function transformUsername (username, name = 'user') {
  return username ?? ('@' + name.replaceAll(' ', '_'))
}
