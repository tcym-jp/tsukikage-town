export const countPlayerNameCharacters = (value: string) => Array.from(value).length

export function validatePlayerName(value: string): string | undefined {
  const trimmed = value.trim()
  const length = countPlayerNameCharacters(trimmed)
  if (length === 0) return 'お名前を一文字以上、記入してください。'
  if (length > 12) return 'お名前は十二文字以内で記入してください。'
  if (/\p{Cc}/u.test(trimmed)) return '制御文字は使用できません。'
  return undefined
}
