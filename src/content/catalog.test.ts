import { describe, expect, it } from 'vitest'
import { catalog } from './catalog'
import { characterIds, endingIds, flagIds, locationIds } from './contentIds'
import { ids } from './types'
import type { ContentCatalog, Dialogue, Ending } from './types'
import { validateCatalog } from './validateCatalog'

const content: ContentCatalog = catalog
const cloneCatalog = (): ContentCatalog => structuredClone(catalog)

const collectKinds = (ending: Ending): string[] => {
  if (ending.conditions.kind !== 'all') return [ending.conditions.kind]
  return ending.conditions.conditions.map((condition) => condition.kind)
}

describe('月影町コンテンツカタログ', () => {
  it('製品仕様の全コンテンツ下限と参照整合性を満たす', () => {
    const result = validateCatalog()

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
    expect(result.counts).toEqual({
      locations: 9,
      namedCharacters: 6,
      chapters: 8,
      dialogues: 26,
      letters: 12,
      officialBulletins: 12,
      clues: 15,
      subEvents: 4,
      endings: 4,
      achievements: 9,
    })
  })

  it('検査時にカタログを変更しない純粋関数である', () => {
    const before = JSON.stringify(catalog)

    const first = validateCatalog(catalog)
    const second = validateCatalog(catalog)

    expect(first).toEqual(second)
    expect(JSON.stringify(catalog)).toBe(before)
  })

  it('必須9場所と6人、猫ツキを共有IDで収録する', () => {
    expect(catalog.locations.map((location) => location.id)).toEqual(Object.values(locationIds))
    expect(catalog.characters.map((character) => character.id)).toEqual(Object.values(characterIds))
    expect(locationIds.yoimachiCafe).toBe('yoi_machi')

    const named = catalog.characters.filter((character) => character.namedCharacter)
    const tsuki = catalog.characters.find((character) => character.id === characterIds.tsuki)
    expect(named).toHaveLength(6)
    expect(named.map((character) => character.name)).toEqual(
      expect.arrayContaining(['御影 澄', '久世 灯', '雨宮 奏', '榊 蓮', '月白 こよみ', '星見 湊']),
    )
    expect(tsuki).toMatchObject({ kind: 'cat', name: 'ツキ' })
  })

  it('Day 0から7を一章ずつ持ち、各章に目的・進行条件・場面・ヒントがある', () => {
    expect(catalog.chapters.map((chapter) => chapter.day)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])

    for (const chapter of content.chapters) {
      expect(chapter.objectives.some((objective) => objective.required)).toBe(true)
      expect(chapter.scenes.some((scene) => scene.required)).toBe(true)
      expect(chapter.advanceCondition.kind).not.toBe('always')
      expect(chapter.blockedMessage.length).toBeGreaterThan(0)
      for (const objective of chapter.objectives) {
        expect(objective.hints.map((hint) => hint.threshold)).toEqual([0, 1, 2])
      }
    }
  })

  it('手紙8通とA–D差分を備え、名前テンプレートと匿名手紙を保持する', () => {
    const storyLetters = catalog.letters.filter((letter) => letter.endingVariant === null)
    const endingLetters = catalog.letters.filter((letter) => letter.endingVariant !== null)

    expect(storyLetters).toHaveLength(8)
    expect(endingLetters.map((letter) => letter.endingVariant)).toEqual([
      endingIds.a,
      endingIds.b,
      endingIds.c,
      endingIds.d,
    ])
    expect(storyLetters.filter((letter) => letter.anonymous)).toHaveLength(2)
    expect(catalog.letters.some((letter) => letter.recipient.includes('{{playerName}}'))).toBe(true)
    expect(
      catalog.letters.every((letter) =>
        letter.bodyBlocks.every((block) => Array.from(block).length <= 100),
      ),
    ).toBe(true)
  })

  it('公式12項目と条件付き13件目を番号順に保持し、日別差分を文章でも示す', () => {
    const official = content.bulletins.filter((bulletin) => bulletin.official)
    const thirteenth = content.bulletins.find((bulletin) => !bulletin.official)

    expect(official.map((bulletin) => bulletin.officialNumber)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ])
    expect(official.every((bulletin) => bulletin.revisions.length >= 2)).toBe(true)
    expect(
      official.every((bulletin) =>
        bulletin.revisions.every((revision) => revision.changeNote.length > 0),
      ),
    ).toBe(true)
    expect(thirteenth).toMatchObject({ officialNumber: 13, official: false })
    expect(thirteenth?.visibilityCondition.kind).toBe('all')
    expect(thirteenth?.variants.map((variant) => variant.id)).toEqual([
      'public',
      'local',
      'minato',
      'default',
    ])
  })

  it('15手掛かりすべてに二媒体以上の取得経路を持つ', () => {
    expect(catalog.clues).toHaveLength(15)
    for (const clue of catalog.clues) {
      expect(clue.sourceRefs.length).toBeGreaterThanOrEqual(2)
      expect(new Set(clue.sourceRefs.map((source) => source.kind)).size).toBeGreaterThanOrEqual(2)
    }
  })

  it('4サブイベントを複数段階で収録し、204統合と放送の意味へ接続する', () => {
    expect(catalog.subEvents).toHaveLength(4)
    expect(content.subEvents.every((subEvent) => subEvent.stages.length >= 3)).toBe(true)
    expect(catalog.subEvents.map((subEvent) => subEvent.title)).toEqual([
      'ツキの首輪',
      '破れた町史',
      '宵待のカセット',
      '鍵束の整理',
    ])
    expect(catalog.subEvents.every((subEvent) => subEvent.endingRelevance.length > 0)).toBe(true)
  })

  it('主要6人物にDay別会話、選択肢、信頼または証拠分岐を持つ', () => {
    const namedCharacters = catalog.characters.filter((character) => character.namedCharacter)

    for (const character of namedCharacters) {
      const authored = catalog.dialogues.filter((dialogue) => dialogue.characterId === character.id)
      expect(authored.length).toBeGreaterThanOrEqual(2)
      expect(
        authored.some((dialogue) => dialogue.nodes.some((node) => node.kind === 'choice')),
      ).toBe(true)
      expect(new Set(authored.map((dialogue) => dialogue.day)).size).toBeGreaterThanOrEqual(2)
      if (character.trustTrack) {
        expect(JSON.stringify(authored.map((dialogue) => dialogue.conditions))).toContain('trust')
      }
    }

    expect(
      catalog.dialogues.every((dialogue) =>
        dialogue.nodes.every((node) => Array.from(node.text).length <= 100),
      ),
    ).toBe(true)
  })

  it('A–Dをgame共有IDと同じ条件骨格で定義する', () => {
    expect(catalog.endings.map((ending) => ending.id)).toEqual(['A', 'B', 'C', 'D'])

    const endingA = catalog.endings.find((ending) => ending.id === endingIds.a)
    const endingB = catalog.endings.find((ending) => ending.id === endingIds.b)
    const endingC = catalog.endings.find((ending) => ending.id === endingIds.c)
    const endingD = catalog.endings.find((ending) => ending.id === endingIds.d)
    expect(endingA === undefined ? [] : collectKinds(endingA)).toEqual([
      'finalChoice',
      'totalTrust',
      'flag',
    ])
    expect(endingB === undefined ? [] : collectKinds(endingB)).toEqual(['finalChoice', 'clueCount'])
    expect(endingC === undefined ? [] : collectKinds(endingC)).toEqual([
      'finalChoice',
      'flag',
      'flag',
    ])
    expect(endingD?.conditions.kind).toBe('always')
    expect(endingA?.conditions.kind).toBe('all')
    if (endingA?.conditions.kind === 'all') {
      expect(endingA.conditions.conditions).toContainEqual({
        kind: 'flag',
        flagId: flagIds.minatoWishUnderstood,
        value: true,
      })
    }
  })
})

describe('validateCatalogの故障検出', () => {
  it('重複IDを検出する', () => {
    const broken: ContentCatalog = {
      ...cloneCatalog(),
      locations: [...catalog.locations, catalog.locations[0]],
    }

    const result = validateCatalog(broken)
    expect(result.valid).toBe(false)
    expect(result.errors.some((error) => error.includes('重複'))).toBe(true)
  })

  it('未定義の場所を参照する会話を検出する', () => {
    const source = catalog.dialogues[0]
    const brokenDialogue: Dialogue = {
      ...source,
      locationId: ids.location('missing_place'),
    }
    const broken: ContentCatalog = {
      ...cloneCatalog(),
      dialogues: [brokenDialogue, ...catalog.dialogues.slice(1)],
    }

    const result = validateCatalog(broken)
    expect(result.valid).toBe(false)
    expect(result.errors.some((error) => error.includes('missing_place'))).toBe(true)
  })

  it('未定義フラグ参照を検出する', () => {
    const broken: ContentCatalog = {
      ...cloneCatalog(),
      narrativeFlags: catalog.narrativeFlags.filter((flag) => flag.id !== flagIds.registered),
    }

    const result = validateCatalog(broken)
    expect(result.valid).toBe(false)
    expect(result.errors.some((error) => error.includes('registered'))).toBe(true)
  })

  it('到達不能ノードと存在しない次ノードを検出する', () => {
    const source = catalog.dialogues[0]
    const firstNode = source.nodes[0]

    const brokenDialogue: Dialogue = {
      ...source,
      nodes: [
        { ...firstNode, nextNodeId: ids.dialogueNode('missing_node') },
        ...source.nodes.slice(1),
      ],
    }
    const broken: ContentCatalog = {
      ...cloneCatalog(),
      dialogues: [brokenDialogue, ...catalog.dialogues.slice(1)],
    }

    const result = validateCatalog(broken)
    expect(result.valid).toBe(false)
    expect(result.errors.some((error) => error.includes('missing_node'))).toBe(true)
    expect(result.errors.some((error) => error.includes('到達不能'))).toBe(true)
  })

  it('手掛かりの第二経路欠落と13件目欠落を検出する', () => {
    const firstClue = catalog.clues[0]
    const broken: ContentCatalog = {
      ...cloneCatalog(),
      clues: [
        { ...firstClue, sourceRefs: firstClue.sourceRefs.slice(0, 1) },
        ...catalog.clues.slice(1),
      ],
      bulletins: catalog.bulletins.filter((bulletin) => bulletin.official),
    }

    const result = validateCatalog(broken)
    expect(result.valid).toBe(false)
    expect(result.errors.some((error) => error.includes('二つ未満'))).toBe(true)
    expect(result.errors.some((error) => error.includes('13番'))).toBe(true)
  })
})
