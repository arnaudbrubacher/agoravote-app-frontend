let id = 0

export function useId() {
  return `agoravote-${++id}`
}