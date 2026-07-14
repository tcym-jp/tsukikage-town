import { catalog } from './catalog'
import { characterIds, endingIds, locationIds } from './contentIds'
import type {
  CatalogValidationResult,
  Condition,
  ContentCatalog,
  Dialogue,
  Effect,
  EvidenceSource,
} from './types'

const textLength = (value: string): number => Array.from(value).length

const duplicateIds = (
  entries: readonly { readonly id: string }[],
  label: string,
  errors: string[],
): void => {
  const seen = new Set<string>()
  for (const entry of entries) {
    if (seen.has(entry.id)) {
      errors.push(`${label}: ID「${entry.id}」が重複しています。`)
    }
    seen.add(entry.id)
  }
}

const requireReference = (
  known: ReadonlySet<string>,
  value: string,
  path: string,
  label: string,
  errors: string[],
): void => {
  if (!known.has(value)) {
    errors.push(`${path}: 未定義の${label}「${value}」を参照しています。`)
  }
}

const validateText = (value: string, path: string, errors: string[], maxLength = 100): void => {
  if (value.trim().length === 0) {
    errors.push(`${path}: 空の本文は使用できません。`)
  }
  if (textLength(value) > maxLength) {
    errors.push(`${path}: ${maxLength}文字を超えています（${textLength(value)}文字）。`)
  }
}

/**
 * Validates all authored references and product-level content minimums.
 * It performs no I/O and never mutates the supplied catalog.
 */
export const validateCatalog = (input: ContentCatalog = catalog): CatalogValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  const allObjectives = input.chapters.flatMap((chapter) => chapter.objectives)
  const allScenes = input.chapters.flatMap((chapter) => chapter.scenes)
  const allStages = input.subEvents.flatMap((subEvent) => subEvent.stages)

  duplicateIds(input.locations, '場所', errors)
  duplicateIds(input.characters, '人物', errors)
  duplicateIds(input.chapters, '章', errors)
  duplicateIds(allObjectives, '目的', errors)
  duplicateIds(allScenes, '場面', errors)
  duplicateIds(input.dialogues, '会話', errors)
  duplicateIds(input.letters, '手紙', errors)
  duplicateIds(input.bulletins, '回覧板', errors)
  duplicateIds(input.clues, '手掛かり', errors)
  duplicateIds(input.subEvents, 'サブイベント', errors)
  duplicateIds(allStages, 'サブイベント段階', errors)
  duplicateIds(input.investigations, '調査文', errors)
  duplicateIds(input.endings, '結末', errors)
  duplicateIds(input.achievements, '実績', errors)
  duplicateIds(input.narrativeFlags, '物語フラグ', errors)

  const locations = new Set(input.locations.map((entry) => entry.id as string))
  const characters = new Set(input.characters.map((entry) => entry.id as string))
  const chapters = new Set(input.chapters.map((entry) => entry.id as string))
  const objectives = new Set(allObjectives.map((entry) => entry.id as string))
  const dialogues = new Set(input.dialogues.map((entry) => entry.id as string))
  const letters = new Set(input.letters.map((entry) => entry.id as string))
  const bulletins = new Set(input.bulletins.map((entry) => entry.id as string))
  const clues = new Set(input.clues.map((entry) => entry.id as string))
  const subEvents = new Set(input.subEvents.map((entry) => entry.id as string))
  const stages = new Set(allStages.map((entry) => entry.id as string))
  const investigations = new Set(input.investigations.map((entry) => entry.id as string))
  const endings = new Set(input.endings.map((entry) => entry.id as string))
  const achievements = new Set(input.achievements.map((entry) => entry.id as string))
  const flags = new Set(input.narrativeFlags.map((entry) => entry.id as string))

  const validateCondition = (condition: Condition, path: string): void => {
    switch (condition.kind) {
      case 'always':
      case 'time':
      case 'finalChoice':
        return
      case 'day':
        if (condition.value < 0 || condition.value > 7) {
          errors.push(`${path}: Dayは0から7で指定してください。`)
        }
        return
      case 'flag':
        requireReference(flags, condition.flagId, path, 'フラグ', errors)
        return
      case 'trust':
        requireReference(characters, condition.characterId, path, '人物', errors)
        if (!Number.isFinite(condition.value) || condition.value < 0) {
          errors.push(`${path}: 信頼値は0以上の有限値にしてください。`)
        }
        return
      case 'totalTrust':
      case 'clueCount':
      case 'stat':
        if (!Number.isFinite(condition.value) || condition.value < 0) {
          errors.push(`${path}: 比較値は0以上の有限値にしてください。`)
        }
        return
      case 'clue':
        requireReference(clues, condition.clueId, path, '手掛かり', errors)
        return
      case 'letterRead':
        requireReference(letters, condition.letterId, path, '手紙', errors)
        return
      case 'bulletinRead':
        requireReference(bulletins, condition.bulletinId, path, '回覧板', errors)
        return
      case 'dialogueSeen':
        requireReference(dialogues, condition.dialogueId, path, '会話', errors)
        return
      case 'locationVisited':
        requireReference(locations, condition.locationId, path, '場所', errors)
        return
      case 'subEvent':
        requireReference(subEvents, condition.subEventId, path, 'サブイベント', errors)
        return
      case 'objectiveComplete':
        requireReference(objectives, condition.objectiveId, path, '目的', errors)
        return
      case 'endingReached':
        requireReference(endings, condition.endingId, path, '結末', errors)
        return
      case 'all':
      case 'any':
        if (condition.conditions.length === 0) {
          errors.push(`${path}: ${condition.kind}条件には一つ以上の子条件が必要です。`)
        }
        condition.conditions.forEach((child, index) => {
          validateCondition(child, `${path}.${condition.kind}[${index}]`)
        })
        return
      case 'not':
        validateCondition(condition.condition, `${path}.not`)
        return
    }
  }

  const validateEffect = (effect: Effect, path: string): void => {
    switch (effect.kind) {
      case 'setFlag':
        requireReference(flags, effect.flagId, path, 'フラグ', errors)
        return
      case 'addTrust':
        requireReference(characters, effect.characterId, path, '人物', errors)
        if (!Number.isFinite(effect.amount) || effect.amount === 0) {
          errors.push(`${path}: 信頼変化量は0以外の有限値にしてください。`)
        }
        return
      case 'discoverClue':
        requireReference(clues, effect.clueId, path, '手掛かり', errors)
        return
      case 'deliverLetter':
        requireReference(letters, effect.letterId, path, '手紙', errors)
        return
      case 'startSubEvent':
      case 'completeSubEvent':
        requireReference(subEvents, effect.subEventId, path, 'サブイベント', errors)
        return
      case 'advanceSubEvent':
        requireReference(subEvents, effect.subEventId, path, 'サブイベント', errors)
        requireReference(stages, effect.stageId, path, 'サブイベント段階', errors)
        return
      case 'completeObjective':
        requireReference(objectives, effect.objectiveId, path, '目的', errors)
        return
      case 'unlockLocation':
        requireReference(locations, effect.locationId, path, '場所', errors)
        return
      case 'setFinalChoice':
        return
      case 'incrementStat':
        if (!Number.isFinite(effect.amount) || effect.amount === 0) {
          errors.push(`${path}: 統計変化量は0以外の有限値にしてください。`)
        }
        return
    }
  }

  const validateSource = (source: EvidenceSource, path: string): void => {
    switch (source.kind) {
      case 'dialogue':
        requireReference(dialogues, source.dialogueId, path, '会話', errors)
        return
      case 'investigation':
        requireReference(investigations, source.investigationId, path, '調査文', errors)
        return
      case 'letter':
        requireReference(letters, source.letterId, path, '手紙', errors)
        return
      case 'bulletin':
        requireReference(bulletins, source.bulletinId, path, '回覧板', errors)
        return
      case 'subEvent':
        requireReference(subEvents, source.subEventId, path, 'サブイベント', errors)
        return
    }
  }

  if (input.metadata.schemaVersion < 1 || !Number.isInteger(input.metadata.schemaVersion)) {
    errors.push('metadata.schemaVersion: 1以上の整数が必要です。')
  }
  const requiredLocations = Object.values(locationIds)
  for (const locationId of requiredLocations) {
    requireReference(locations, locationId, 'locations', '必須場所', errors)
  }
  if (input.locations.length < 9) {
    errors.push(`locations: 必須9場所に対して${input.locations.length}場所しかありません。`)
  }
  input.locations.forEach((location, index) => {
    validateText(location.description, `locations[${index}].description`, errors, 140)
    validateCondition(location.accessCondition, `locations[${index}].accessCondition`)
  })

  const namedCharacters = input.characters.filter((character) => character.namedCharacter)
  if (namedCharacters.length < 6) {
    errors.push(`characters: 名前付き人物が${namedCharacters.length}人です。6人以上必要です。`)
  }
  for (const characterId of Object.values(characterIds)) {
    requireReference(characters, characterId, 'characters', '必須人物', errors)
  }
  input.characters.forEach((character, index) => {
    requireReference(
      locations,
      character.homeLocationId,
      `characters[${index}]`,
      '拠点場所',
      errors,
    )
    validateText(character.publicBio, `characters[${index}].publicBio`, errors, 140)
    character.schedule.forEach((entry, scheduleIndex) => {
      requireReference(
        locations,
        entry.locationId,
        `characters[${index}].schedule[${scheduleIndex}]`,
        '場所',
        errors,
      )
    })
  })

  const chapterDays = [...input.chapters.map((chapter) => chapter.day)].sort(
    (left, right) => left - right,
  )
  const expectedDays = [0, 1, 2, 3, 4, 5, 6, 7]
  if (
    chapterDays.length !== expectedDays.length ||
    chapterDays.some((day, index) => day !== expectedDays[index])
  ) {
    errors.push('chapters: Day 0からDay 7までを重複なく一章ずつ定義してください。')
  }
  input.chapters.forEach((chapter, chapterIndex) => {
    if (!chapters.has(chapter.id)) {
      errors.push(`chapters[${chapterIndex}]: 章IDが登録されていません。`)
    }
    if (chapter.objectives.filter((objective) => objective.required).length === 0) {
      errors.push(`chapters[${chapterIndex}]: 必須目的がありません。`)
    }
    chapter.objectives.forEach((objective, objectiveIndex) => {
      const path = `chapters[${chapterIndex}].objectives[${objectiveIndex}]`
      validateCondition(objective.completionCondition, `${path}.completionCondition`)
      objective.onComplete.forEach((effect, effectIndex) => {
        validateEffect(effect, `${path}.onComplete[${effectIndex}]`)
      })
      const thresholds = objective.hints.map((hint) => hint.threshold).sort()
      if (thresholds.join(',') !== '0,1,2') {
        errors.push(`${path}.hints: 0、1、2の三段階ヒントが必要です。`)
      }
      objective.hints.forEach((hint, hintIndex) => {
        validateText(hint.text, `${path}.hints[${hintIndex}]`, errors, 100)
      })
    })
    chapter.scenes.forEach((scene, sceneIndex) => {
      const path = `chapters[${chapterIndex}].scenes[${sceneIndex}]`
      requireReference(locations, scene.locationId, path, '場所', errors)
      validateCondition(scene.entryCondition, `${path}.entryCondition`)
      validateCondition(scene.completionCondition, `${path}.completionCondition`)
      scene.investigationIds.forEach((id) => {
        requireReference(investigations, id, path, '調査文', errors)
      })
      scene.dialogueIds.forEach((id) => {
        requireReference(dialogues, id, path, '会話', errors)
      })
    })
    chapter.availableLetterIds.forEach((id) => {
      requireReference(letters, id, `chapters[${chapterIndex}].availableLetterIds`, '手紙', errors)
    })
    chapter.featuredBulletinIds.forEach((id) => {
      requireReference(
        bulletins,
        id,
        `chapters[${chapterIndex}].featuredBulletinIds`,
        '回覧板',
        errors,
      )
    })
    validateCondition(chapter.advanceCondition, `chapters[${chapterIndex}].advanceCondition`)
  })

  const validateDialogueGraph = (dialogue: Dialogue, dialogueIndex: number): void => {
    const path = `dialogues[${dialogueIndex}]`
    requireReference(characters, dialogue.characterId, path, '人物', errors)
    requireReference(locations, dialogue.locationId, path, '場所', errors)
    validateCondition(dialogue.conditions, `${path}.conditions`)
    duplicateIds(dialogue.nodes, `${path}.nodes`, errors)
    const nodes = new Map(dialogue.nodes.map((node) => [node.id as string, node]))
    requireReference(
      new Set(nodes.keys()),
      dialogue.entryNodeId,
      `${path}.entryNodeId`,
      '会話ノード',
      errors,
    )

    dialogue.nodes.forEach((node, nodeIndex) => {
      const nodePath = `${path}.nodes[${nodeIndex}]`
      if (node.speakerId !== 'narrator') {
        requireReference(characters, node.speakerId, nodePath, '話者', errors)
      }
      validateText(node.text, `${nodePath}.text`, errors)
      if (node.kind === 'line') {
        if (node.nextNodeId !== 'end') {
          requireReference(new Set(nodes.keys()), node.nextNodeId, nodePath, '次ノード', errors)
        }
        node.effects.forEach((effect, effectIndex) => {
          validateEffect(effect, `${nodePath}.effects[${effectIndex}]`)
        })
      } else {
        if (node.choices.length < 2) {
          errors.push(`${nodePath}: 選択ノードには二つ以上の選択肢が必要です。`)
        }
        const choiceIds = new Set<string>()
        node.choices.forEach((dialogueChoice, choiceIndex) => {
          const choicePath = `${nodePath}.choices[${choiceIndex}]`
          if (choiceIds.has(dialogueChoice.id)) {
            errors.push(`${choicePath}: 選択肢ID「${dialogueChoice.id}」が重複しています。`)
          }
          choiceIds.add(dialogueChoice.id)
          validateText(dialogueChoice.text, `${choicePath}.text`, errors)
          validateCondition(dialogueChoice.condition, `${choicePath}.condition`)
          if (dialogueChoice.nextNodeId !== 'end') {
            requireReference(
              new Set(nodes.keys()),
              dialogueChoice.nextNodeId,
              choicePath,
              '次ノード',
              errors,
            )
          }
          dialogueChoice.effects.forEach((effect, effectIndex) => {
            validateEffect(effect, `${choicePath}.effects[${effectIndex}]`)
          })
        })
      }
    })

    const reachable = new Set<string>()
    const visit = (id: string): void => {
      if (id === 'end' || reachable.has(id)) return
      const node = nodes.get(id)
      if (node === undefined) return
      reachable.add(id)
      if (node.kind === 'line') {
        visit(node.nextNodeId)
      } else {
        node.choices.forEach((dialogueChoice) => visit(dialogueChoice.nextNodeId))
      }
    }
    visit(dialogue.entryNodeId)
    dialogue.nodes.forEach((node) => {
      if (!reachable.has(node.id)) {
        errors.push(`${path}: 到達不能な会話ノード「${node.id}」があります。`)
      }
    })
  }

  input.dialogues.forEach(validateDialogueGraph)

  const hasTrustConditionFor = (condition: Condition, characterId: string): boolean => {
    switch (condition.kind) {
      case 'trust':
        return condition.characterId === characterId
      case 'all':
      case 'any':
        return condition.conditions.some((child) => hasTrustConditionFor(child, characterId))
      case 'not':
        return hasTrustConditionFor(condition.condition, characterId)
      default:
        return false
    }
  }
  input.characters
    .filter((character) => character.namedCharacter)
    .forEach((character) => {
      const authored = input.dialogues.filter((dialogue) => dialogue.characterId === character.id)
      if (authored.length < 2) {
        errors.push(`characters.${character.id}: Day別会話が二つ以上必要です。`)
      }
      if (!authored.some((dialogue) => dialogue.nodes.some((node) => node.kind === 'choice'))) {
        errors.push(`characters.${character.id}: 価値観を選べる会話がありません。`)
      }
      if (
        character.trustTrack &&
        !authored.some((dialogue) => hasTrustConditionFor(dialogue.conditions, character.id))
      ) {
        errors.push(`characters.${character.id}: 信頼条件による会話分岐がありません。`)
      }
    })

  input.letters.forEach((letter, letterIndex) => {
    const path = `letters[${letterIndex}]`
    if (letter.sender.kind === 'character') {
      requireReference(characters, letter.sender.characterId, `${path}.sender`, '人物', errors)
    }
    validateCondition(letter.arrivalCondition, `${path}.arrivalCondition`)
    if (letter.bodyBlocks.length === 0) {
      errors.push(`${path}: 本文ブロックがありません。`)
    }
    letter.bodyBlocks.forEach((block, blockIndex) => {
      validateText(block, `${path}.bodyBlocks[${blockIndex}]`, errors)
    })
    letter.attachments.forEach((id) =>
      requireReference(clues, id, `${path}.attachments`, '手掛かり', errors),
    )
    letter.actions.forEach((action, actionIndex) => {
      validateCondition(action.condition, `${path}.actions[${actionIndex}].condition`)
      action.effects.forEach((effect, effectIndex) => {
        validateEffect(effect, `${path}.actions[${actionIndex}].effects[${effectIndex}]`)
      })
      action.responseBlocks.forEach((block, blockIndex) => {
        validateText(block, `${path}.actions[${actionIndex}].responseBlocks[${blockIndex}]`, errors)
      })
    })
    if (letter.endingVariant !== null) {
      requireReference(endings, letter.endingVariant, `${path}.endingVariant`, '結末', errors)
    }
  })
  const baseLetters = input.letters.filter((letter) => letter.endingVariant === null)
  if (baseLetters.length < 8) {
    errors.push(`letters: 結末差分を除く手紙が${baseLetters.length}通です。8通以上必要です。`)
  }
  const anonymousBaseLetters = baseLetters.filter((letter) => letter.anonymous)
  if (anonymousBaseLetters.length < 2) {
    errors.push('letters: 結末前に読む差出人不明の手紙が二通以上必要です。')
  }

  input.bulletins.forEach((bulletin, bulletinIndex) => {
    const path = `bulletins[${bulletinIndex}]`
    validateCondition(bulletin.visibilityCondition, `${path}.visibilityCondition`)
    if (bulletin.revisions.length === 0) {
      errors.push(`${path}: 掲示履歴がありません。`)
    }
    let previousDay = -1
    bulletin.revisions.forEach((revision, revisionIndex) => {
      if (revision.day < previousDay) {
        errors.push(`${path}.revisions: 日付順に並んでいません。`)
      }
      previousDay = revision.day
      validateText(revision.body, `${path}.revisions[${revisionIndex}].body`, errors)
      validateText(revision.changeNote, `${path}.revisions[${revisionIndex}].changeNote`, errors)
    })
    bulletin.variants.forEach((variant, variantIndex) => {
      validateCondition(variant.condition, `${path}.variants[${variantIndex}].condition`)
      validateText(variant.body, `${path}.variants[${variantIndex}].body`, errors)
    })
  })
  const officialBulletins = input.bulletins.filter((bulletin) => bulletin.official)
  const officialNumbers = officialBulletins
    .map((bulletin) => bulletin.officialNumber)
    .sort((left, right) => left - right)
  if (officialNumbers.join(',') !== '1,2,3,4,5,6,7,8,9,10,11,12') {
    errors.push('bulletins: 公式1番から12番を重複なく定義してください。')
  }
  const thirteenth = input.bulletins.filter(
    (bulletin) => !bulletin.official && bulletin.officialNumber === 13,
  )
  if (thirteenth.length !== 1) {
    errors.push('bulletins: 条件付きの非公式13番を一件だけ定義してください。')
  } else if (thirteenth[0]?.visibilityCondition.kind === 'always') {
    errors.push('bulletins: 13番目は無条件表示にできません。')
  }

  input.clues.forEach((clue, clueIndex) => {
    const path = `clues[${clueIndex}]`
    if (clue.sourceRefs.length < 2) {
      errors.push(`${path}: 同じ情報へ至る経路が二つ未満です。`)
    }
    const distinctSourceKinds = new Set(clue.sourceRefs.map((source) => source.kind))
    if (distinctSourceKinds.size < 2) {
      warnings.push(`${path}: 二経路が同じ媒体だけです。別媒体の手掛かりを推奨します。`)
    }
    clue.sourceRefs.forEach((source, sourceIndex) => {
      validateSource(source, `${path}.sourceRefs[${sourceIndex}]`)
    })
    clue.locationIds.forEach((id) =>
      requireReference(locations, id, `${path}.locationIds`, '場所', errors),
    )
    validateText(clue.shortFact, `${path}.shortFact`, errors, 140)
    validateText(clue.interpretation, `${path}.interpretation`, errors, 140)
  })
  if (input.clues.length < 15) {
    errors.push(`clues: 手掛かりが${input.clues.length}個です。15個必要です。`)
  }

  input.subEvents.forEach((subEvent, subEventIndex) => {
    const path = `subEvents[${subEventIndex}]`
    requireReference(characters, subEvent.ownerCharacterId, path, '担当人物', errors)
    validateCondition(subEvent.startCondition, `${path}.startCondition`)
    if (subEvent.stages.length < 2) {
      errors.push(`${path}: 段階が二つ未満です。`)
    }
    const ownStages = new Set(subEvent.stages.map((stage) => stage.id as string))
    subEvent.stages.forEach((stage, stageIndex) => {
      validateCondition(
        stage.completionCondition,
        `${path}.stages[${stageIndex}].completionCondition`,
      )
      stage.effects.forEach((effect, effectIndex) => {
        validateEffect(effect, `${path}.stages[${stageIndex}].effects[${effectIndex}]`)
        if (
          effect.kind === 'advanceSubEvent' &&
          effect.subEventId === subEvent.id &&
          !ownStages.has(effect.stageId)
        ) {
          errors.push(`${path}.stages[${stageIndex}]: 同イベント内に遷移先段階がありません。`)
        }
      })
    })
    subEvent.completionEffects.forEach((effect, effectIndex) => {
      validateEffect(effect, `${path}.completionEffects[${effectIndex}]`)
    })
  })
  if (input.subEvents.length < 4) {
    errors.push(`subEvents: サブイベントが${input.subEvents.length}件です。4件必要です。`)
  }

  input.investigations.forEach((investigation, investigationIndex) => {
    const path = `investigations[${investigationIndex}]`
    requireReference(locations, investigation.locationId, path, '場所', errors)
    if (investigation.variants.length === 0) {
      errors.push(`${path}: 条件付き調査文がありません。`)
    }
    investigation.variants.forEach((variant, variantIndex) => {
      validateCondition(variant.condition, `${path}.variants[${variantIndex}].condition`)
      variant.textBlocks.forEach((block, blockIndex) => {
        validateText(block, `${path}.variants[${variantIndex}].textBlocks[${blockIndex}]`, errors)
      })
      variant.effects.forEach((effect, effectIndex) => {
        validateEffect(effect, `${path}.variants[${variantIndex}].effects[${effectIndex}]`)
      })
    })
    if (investigation.fallbackText.length === 0) {
      errors.push(`${path}: フォールバック調査文がありません。`)
    }
    investigation.fallbackText.forEach((block, blockIndex) => {
      validateText(block, `${path}.fallbackText[${blockIndex}]`, errors)
    })
  })

  const endingCodes = input.endings.map((ending) => ending.code).sort()
  if (endingCodes.join(',') !== 'A,B,C,D') {
    errors.push('endings: A、B、C、Dを一件ずつ定義してください。')
  }
  for (const endingId of Object.values(endingIds)) {
    requireReference(endings, endingId, 'endings', '必須結末', errors)
  }
  input.endings.forEach((ending, endingIndex) => {
    const path = `endings[${endingIndex}]`
    if (ending.id !== ending.code) {
      errors.push(`${path}: game層との共有IDは結末コード「${ending.code}」に一致させてください。`)
    }
    validateCondition(ending.conditions, `${path}.conditions`)
    requireReference(letters, ending.finalLetterId, `${path}.finalLetterId`, '最後の手紙', errors)
    const finalLetter = input.letters.find((letter) => letter.id === ending.finalLetterId)
    if (finalLetter?.endingVariant !== ending.id) {
      errors.push(`${path}: 最後の手紙のendingVariantが結末と一致しません。`)
    }
    ending.scenes.forEach((scene, sceneIndex) => {
      requireReference(locations, scene.locationId, `${path}.scenes[${sceneIndex}]`, '場所', errors)
      scene.textBlocks.forEach((block, blockIndex) => {
        validateText(block, `${path}.scenes[${sceneIndex}].textBlocks[${blockIndex}]`, errors)
      })
    })
    if (ending.affirmation.trim().length === 0 || ending.cost.trim().length === 0) {
      errors.push(`${path}: 肯定と代償の両方を記述してください。`)
    }
  })

  if (input.achievements.length < 6) {
    errors.push(`achievements: 実績が${input.achievements.length}件です。6件以上必要です。`)
  }
  input.achievements.forEach((achievement, achievementIndex) => {
    if (!achievements.has(achievement.id)) {
      errors.push(`achievements[${achievementIndex}]: 実績IDが登録されていません。`)
    }
    validateCondition(achievement.condition, `achievements[${achievementIndex}].condition`)
  })

  const counts = {
    locations: input.locations.length,
    namedCharacters: namedCharacters.length,
    chapters: input.chapters.length,
    dialogues: input.dialogues.length,
    letters: input.letters.length,
    officialBulletins: officialBulletins.length,
    clues: input.clues.length,
    subEvents: input.subEvents.length,
    endings: input.endings.length,
    achievements: input.achievements.length,
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    counts,
  }
}
