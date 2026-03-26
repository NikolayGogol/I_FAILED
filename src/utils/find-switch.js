export function findSwitch (switches, id) {
  try {
    return switches.find(switchItem => switchItem.value === id).state
  } catch {
    return false
  }
}
