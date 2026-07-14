export type MenuPanel =
  'map' | 'journal' | 'letters' | 'bulletins' | 'resident' | 'records' | 'settings'

export interface DialogueChoiceView {
  id: string
  label: string
  tone?: 'accept' | 'question' | 'distance'
  hint?: string
}

export interface LetterView {
  id: string
  sender: string
  recipient: string
  date: string
  subject: string
  body: readonly string[]
  unread: boolean
  anonymous?: boolean
  kind?: 'official' | 'personal' | 'old' | 'unknown'
  actionLabel?: string
}

export interface BulletinView {
  id: string
  number: number
  title: string
  body: string
  status: 'new' | 'changed' | 'unchanged' | 'removed' | 'thirteenth'
  annotation?: string
}

export interface JournalEntryView {
  id: string
  title: string
  body: string
  new?: boolean
  complete?: boolean
  locked?: boolean
}

export interface CharacterProfileView {
  id: string
  name: string
  reading: string
  role: string
  note: string
  trust: number
  discovered: boolean
}

export interface AchievementView {
  id: string
  title: string
  description: string
  unlocked: boolean
}
