export function lessonCounter (lesson) {
  let counter = 0
  for (const key in lesson) {
    counter += lesson[key] ? 1 : 0
  }
  return counter
}
