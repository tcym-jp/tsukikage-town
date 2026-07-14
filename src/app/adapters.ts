import { catalog } from '../content'
import { evaluateCondition, type GameState } from '../game'
import type { WorldAreaId } from '../world'
import type {
  AchievementView,
  BulletinView,
  CharacterProfileView,
  JournalEntryView,
  LetterView,
} from '../ui/types'

export const WORLD_TO_GAME_LOCATION = {
  station: 'station',
  'town-hall': 'town_hall',
  'moon-street': 'main_street',
  'bulletin-board': 'bulletin_board',
  'toka-books': 'touka_books',
  'yoimachi-cafe': 'yoi_machi',
  'tsukikage-apartments': 'tsukikage_heights',
  'room-203': 'room_203',
  'broadcast-tower': 'broadcast_hill',
} as const satisfies Readonly<Record<WorldAreaId, string>>

export const GAME_TO_WORLD_LOCATION = Object.fromEntries(
  Object.entries(WORLD_TO_GAME_LOCATION).map(([worldId, gameId]) => [gameId, worldId]),
) as Readonly<Record<string, WorldAreaId>>

export function toGameLocationId(worldId: WorldAreaId): string {
  return WORLD_TO_GAME_LOCATION[worldId]
}

export function toWorldLocationId(gameId: string): WorldAreaId | undefined {
  return GAME_TO_WORLD_LOCATION[gameId]
}

export function personalizeText(value: string, playerName: string): string {
  return value.replaceAll('{{playerName}}', playerName)
}

function senderName(letter: (typeof catalog.letters)[number]): string {
  if (letter.sender.kind === 'organization') return letter.sender.name
  if (letter.sender.kind === 'unknown') return letter.sender.label
  const characterId = 'characterId' in letter.sender ? letter.sender.characterId : ''
  return catalog.characters.find((character) => character.id === characterId)?.name ?? '町の住民'
}

function letterKind(
  style: (typeof catalog.letters)[number]['paperStyle'],
): NonNullable<LetterView['kind']> {
  if (style === 'official') return 'official'
  if (style === 'aged') return 'old'
  if (style === 'blue-ink') return 'unknown'
  return 'personal'
}

export function getLetterViews(state: GameState): readonly LetterView[] {
  return catalog.letters
    .filter((letter) => state.deliveredLetters.includes(letter.id))
    .map((letter) => ({
      id: letter.id,
      sender: senderName(letter),
      recipient: personalizeText(letter.recipient, state.player.name),
      date: letter.endingVariant === null ? `町の暦・第${letter.day}日` : '物語のあと',
      subject: personalizeText(letter.subject, state.player.name),
      body: letter.bodyBlocks.map((block) => personalizeText(block, state.player.name)),
      unread: !state.readLetters.includes(letter.id),
      anonymous: letter.anonymous,
      kind: letterKind(letter.paperStyle),
      ...(letter.actions[0] === undefined ? {} : { actionLabel: letter.actions[0].label }),
    }))
}

export function getBulletinViews(state: GameState): readonly BulletinView[] {
  return catalog.bulletins
    .filter((bulletin) => evaluateCondition(state, bulletin.visibilityCondition))
    .flatMap((bulletin) => {
      const revisions = bulletin.revisions.filter((revision) => revision.day <= state.clock.day)
      const revision = revisions.at(-1)
      if (revision === undefined) return []
      const variant = bulletin.variants.find((candidate) =>
        evaluateCondition(state, candidate.condition),
      )
      const previous = revisions.at(-2)
      const status: BulletinView['status'] =
        bulletin.officialNumber === 13
          ? 'thirteenth'
          : revision.status === 'removed'
            ? 'removed'
            : previous === undefined
              ? 'new'
              : previous.body === revision.body
                ? 'unchanged'
                : 'changed'
      return [
        {
          id: bulletin.id,
          number: bulletin.officialNumber,
          title: personalizeText(variant?.title ?? revision.title, state.player.name),
          body: personalizeText(variant?.body ?? revision.body, state.player.name),
          status,
          ...(revision.changeNote.length === 0 ? {} : { annotation: revision.changeNote }),
        },
      ]
    })
}

export function getCharacterViews(state: GameState): readonly CharacterProfileView[] {
  return catalog.characters
    .filter((character) => character.namedCharacter)
    .map((character) => {
      const trust = state.trust[character.id] ?? 0
      const discovered =
        trust !== 0 ||
        character.id === 'sumi' ||
        (character.id === 'minato' ? state.clock.day >= 3 : state.clock.day >= 1)
      return {
        id: character.id,
        name: character.name,
        reading: character.reading,
        role: character.role,
        note: discovered ? character.publicBio : '',
        trust: Math.max(0, Math.min(100, 50 + trust * 5)),
        discovered,
      }
    })
}

export function getClueViews(state: GameState): readonly JournalEntryView[] {
  return catalog.clues.map((clue) => ({
    id: clue.id,
    title: clue.title,
    body: `${clue.shortFact} ${clue.interpretation}`,
    locked: !state.discoveredClues.includes(clue.id),
    new: state.discoveredClues.at(-1) === clue.id,
  }))
}

export function getAchievementViews(state: GameState): readonly AchievementView[] {
  return catalog.achievements.map((achievement) => {
    const unlocked = evaluateCondition(state, achievement.condition)
    return {
      id: achievement.id,
      title: achievement.hidden && !unlocked ? '未発見' : achievement.title,
      description:
        achievement.hidden && !unlocked
          ? '条件は物語の中に隠されています。'
          : achievement.description,
      unlocked,
    }
  })
}

export function validateGameCatalogReferences(state: GameState): readonly string[] {
  const issues: string[] = []
  const locationIds = new Set(catalog.locations.map((item) => String(item.id)))
  const clueIds = new Set(catalog.clues.map((item) => String(item.id)))
  const letterIds = new Set(catalog.letters.map((item) => String(item.id)))
  const bulletinIds = new Set(catalog.bulletins.map((item) => String(item.id)))
  const endingIds = new Set(catalog.endings.map((item) => String(item.id)))

  const check = (label: string, value: string, allowed: ReadonlySet<string>) => {
    if (!allowed.has(value)) issues.push(`${label}: 不明なID「${value}」`)
  }

  check('currentLocationId', state.currentLocationId, locationIds)
  for (const value of state.unlockedLocations) check('unlockedLocations', value, locationIds)
  for (const value of state.visitedLocations) check('visitedLocations', value, locationIds)
  for (const value of state.discoveredClues) check('discoveredClues', value, clueIds)
  for (const value of state.deliveredLetters) check('deliveredLetters', value, letterIds)
  for (const value of state.readLetters) check('readLetters', value, letterIds)
  for (const value of state.readBulletins) check('readBulletins', value, bulletinIds)
  for (const value of state.reachedEndings) check('reachedEndings', value, endingIds)
  if (state.currentEndingId !== null) check('currentEndingId', state.currentEndingId, endingIds)
  return issues
}
