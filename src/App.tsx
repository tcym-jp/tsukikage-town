import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { catalog } from './content'
import {
  RESET_CONFIRMATION_PHRASE,
  MAX_SAVE_IMPORT_BYTES,
  advanceTime,
  applyEffect,
  autoSave,
  completeEnding,
  createInitialGameState,
  determineEndingFromRules,
  exportSave,
  importSave,
  importSaveToStorage,
  loadSave,
  loadSettings,
  manualSave,
  resetGameData,
  saveSettings,
  type FinalChoice,
  type GameSettings,
  type GameState,
} from './game'
import { townAudio } from './audio/townAudio'
import {
  STORY_ACTIONS,
  canAdvanceStory,
  completeStoryAction,
  getAvailableStoryActions,
  getStoryBeat,
  isStoryActionComplete,
  type StoryAction,
  type StoryDialogueChoice,
} from './app/storyActions'
import {
  getAchievementViews,
  getBulletinViews,
  getCharacterViews,
  getClueViews,
  getLetterViews,
  personalizeText,
  toGameLocationId,
  toWorldLocationId,
  validateGameCatalogReferences,
} from './app/adapters'
import {
  evaluateAllAchievements,
  mergePersistentRecords,
  rewindToDaySeven,
  synchronizeGameContent,
} from './app/gameRuntime'
import { BulletinBoard } from './ui/BulletinBoard'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { DayAdvancePanel } from './ui/DayAdvancePanel'
import { Dialog } from './ui/Dialog'
import { DialoguePanel } from './ui/DialoguePanel'
import { EndingScreen } from './ui/EndingScreen'
import { GameHud } from './ui/GameHud'
import { Journal } from './ui/Journal'
import { LetterReader } from './ui/LetterReader'
import { LocationPanel, type LocationActionView } from './ui/LocationPanel'
import { RecordsPanel } from './ui/RecordsPanel'
import { ResidentCard } from './ui/ResidentCard'
import { SettingsPanel, type SettingsView } from './ui/SettingsPanel'
import { TitleScreen } from './ui/TitleScreen'
import { TownMap, type MapLocation } from './ui/TownMap'
import { TransferForm } from './ui/TransferForm'
import type { MenuPanel } from './ui/types'
import { WorldMobileControls } from './world/WorldMobileControls'
import { useWorldInputController } from './world/useWorldInputController'
import { DEFAULT_PLAYER_POSITION, WORLD_AREAS } from './world/worldData'
import type { WorldArea, WorldPosition } from './world/types'

const WorldScene = lazy(async () => {
  const module = await import('./world/WorldScene')
  return { default: module.WorldScene }
})

const LAST_DAY_SAVE_KEY = 'tsukikage-town:save:day-seven'
const TIME_LABEL = { morning: '朝', evening: '夕方', night: '夜' } as const
const EMPTY_RECORD_STATE = createInitialGameState('未登録', new Date('2026-01-01T00:00:00.000Z'))
const MAP_PIN_POSITION: Readonly<Record<string, readonly [number, number]>> = {
  station: [18, 40],
  town_hall: [34, 61],
  main_street: [50, 49],
  bulletin_board: [42, 34],
  touka_books: [57, 67],
  yoi_machi: [70, 66],
  tsukikage_heights: [76, 38],
  room_203: [86, 28],
  broadcast_hill: [24, 76],
}

type Screen = 'title' | 'transfer' | 'town' | 'ending'
type ConfirmMode = 'reset' | null

interface ActiveDialogue {
  readonly action: StoryAction
  readonly response?: readonly string[]
  readonly pendingChoice?: StoryDialogueChoice
}

function readLatestGame(): GameState | null {
  if (typeof window === 'undefined') return null
  const result = loadSave(window.localStorage)
  return result.success ? result.save.game : null
}

function worldPositionFor(gameLocationId: string): WorldPosition {
  const worldId = toWorldLocationId(gameLocationId)
  return WORLD_AREAS.find((area) => area.id === worldId)?.position ?? DEFAULT_PLAYER_POSITION
}

function mapLocations(
  game: GameState,
  objectiveLocationId: string | undefined,
): readonly MapLocation[] {
  return catalog.locations.map((location) => {
    const worldId = toWorldLocationId(location.id)
    const area = WORLD_AREAS.find((candidate) => candidate.id === worldId)
    const x = area?.position.x ?? location.mapPosition.x
    const z = area?.position.z ?? location.mapPosition.z
    const pin = MAP_PIN_POSITION[location.id]
    return {
      id: location.id,
      name: location.name,
      description: location.description,
      x: pin?.[0] ?? 12 + ((x + 18) / 36) * 76,
      y: pin?.[1] ?? 12 + ((13 - z) / 26) * 76,
      unlocked: game.unlockedLocations.includes(location.id),
      objective: location.id === objectiveLocationId,
    }
  })
}

function completedJournalEntries(game: GameState) {
  return STORY_ACTIONS.filter((action) => isStoryActionComplete(game, action.id)).map((action) => ({
    id: action.id,
    title: action.label,
    body: action.description,
    complete: true,
  }))
}

function endingCode(id: string | null): 'A' | 'B' | 'C' | 'D' {
  return id === 'A' || id === 'B' || id === 'C' ? id : 'D'
}

export function App() {
  const [settings, setSettings] = useState<GameSettings>(() =>
    typeof window === 'undefined'
      ? {
          bgmVolume: 0.55,
          sfxVolume: 0.7,
          muted: false,
          textSpeed: 'normal',
          autoAdvance: false,
          reducedMotion: false,
          quality: 'auto',
          showControlGuide: true,
          fontScale: 1,
        }
      : loadSettings(window.localStorage),
  )
  const [game, setGame] = useState<GameState | null>(null)
  const [recordGame, setRecordGame] = useState<GameState | null>(() => readLatestGame())
  const [screen, setScreen] = useState<Screen>('title')
  const [panel, setPanel] = useState<MenuPanel | null>(null)
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null)
  const [activeDialogue, setActiveDialogue] = useState<ActiveDialogue | null>(null)
  const [dialogueHistory, setDialogueHistory] = useState<
    readonly { speaker: string; text: string }[]
  >([])
  const [playerPosition, setPlayerPosition] = useState<WorldPosition>(DEFAULT_PLAYER_POSITION)
  const [nearbyArea, setNearbyArea] = useState<WorldArea | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [toast, setToast] = useState<string | null>(null)
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null)
  const [timeAdvanceOpen, setTimeAdvanceOpen] = useState(false)
  const [systemReducedMotion, setSystemReducedMotion] = useState(false)
  const [updateReady, setUpdateReady] = useState(false)
  const [canContinue, setCanContinue] = useState(() => readLatestGame() !== null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const toastTimerRef = useRef<number | undefined>(undefined)
  const saveTimerRef = useRef<number | undefined>(undefined)
  const inputController = useWorldInputController()
  const reducedMotion = settings.reducedMotion || systemReducedMotion

  const showToast = useCallback((message: string) => {
    window.clearTimeout(toastTimerRef.current)
    setToast(message)
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3_400)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setSystemReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    document.documentElement.style.fontSize = `${String(settings.fontScale * 100)}%`
    townAudio.setLevels(settings.bgmVolume, settings.sfxVolume, settings.muted)
    saveSettings(window.localStorage, settings)
  }, [settings])

  useEffect(() => {
    const ready = () => setUpdateReady(true)
    window.addEventListener('tsukikage:update-ready', ready)
    return () => window.removeEventListener('tsukikage:update-ready', ready)
  }, [])

  useEffect(() => {
    if (screen !== 'town' || game === null) return
    const timer = window.setInterval(() => {
      setGame((current) =>
        current === null
          ? current
          : {
              ...current,
              playTimeSeconds: current.playTimeSeconds + 10,
              revision: current.revision + 1,
              updatedAt: new Date().toISOString(),
            },
      )
    }, 10_000)
    return () => window.clearInterval(timer)
  }, [game, screen])

  useEffect(
    () => () => {
      window.clearTimeout(toastTimerRef.current)
      window.clearTimeout(saveTimerRef.current)
      inputController.reset()
    },
    [inputController],
  )

  const persist = useCallback(
    (next: GameState, message?: string, nextSettings: GameSettings = settings) => {
      setSaveStatus('saving')
      const result = autoSave(window.localStorage, next, nextSettings)
      if (result.success) {
        setSaveStatus('saved')
        setCanContinue(true)
        setRecordGame(next)
        window.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = window.setTimeout(() => setSaveStatus('idle'), 1_700)
        if (message !== undefined) showToast(message)
      } else {
        setSaveStatus('error')
        showToast(`記録できませんでした：${result.error}`)
      }
    },
    [settings, showToast],
  )

  const commitGame = useCallback(
    (state: GameState, message?: string) => {
      const next = synchronizeGameContent(evaluateAllAchievements(state))
      setGame(next)
      persist(next, message)
      return next
    },
    [persist],
  )

  const unlockAudio = useCallback(
    async (time = game?.clock.period ?? 'evening') => {
      const unlocked = await townAudio.unlock()
      if (unlocked) townAudio.startAmbience(time, reducedMotion)
    },
    [game?.clock.period, reducedMotion],
  )

  const handleNewGame = useCallback(() => {
    void unlockAudio('evening')
    setPanel(null)
    setScreen('transfer')
  }, [unlockAudio])

  const handleTransfer = useCallback(
    (playerName: string) => {
      window.localStorage.removeItem(LAST_DAY_SAVE_KEY)
      const prior = game ?? recordGame
      const initial = synchronizeGameContent(
        mergePersistentRecords(createInitialGameState(playerName), prior),
      )
      setGame(initial)
      setPlayerPosition(DEFAULT_PLAYER_POSITION)
      setActiveLocationId(null)
      setDialogueHistory([])
      setScreen('town')
      setPanel('resident')
      persist(initial, `${playerName}さんの転入を記録しました。`)
      townAudio.play('paper')
    },
    [game, persist, recordGame],
  )

  const handleContinue = useCallback(() => {
    void unlockAudio()
    const result = loadSave(window.localStorage)
    if (!result.success) {
      showToast(
        result.reason === 'corrupt'
          ? '保存記録が壊れており、復旧できませんでした。'
          : '保存記録が見つかりません。',
      )
      setCanContinue(false)
      return
    }
    const issues = validateGameCatalogReferences(result.save.game)
    if (issues.length > 0) {
      showToast(`保存記録の参照先を確認できません：${issues[0] ?? ''}`)
      return
    }
    const loaded = synchronizeGameContent(result.save.game)
    setSettings(result.save.settings)
    setGame(loaded)
    setRecordGame(loaded)
    setPlayerPosition(worldPositionFor(loaded.currentLocationId))
    setScreen(loaded.currentEndingId === null ? 'town' : 'ending')
    if (result.recovered) showToast('直前のバックアップから記録を復旧しました。')
  }, [showToast, unlockAudio])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shouldContinue = params.get('continue') === '1'
    const shouldOpenRecords = params.get('records') === '1'
    if (shouldContinue || shouldOpenRecords) {
      window.history.replaceState({}, '', window.location.pathname)
    }

    const timer = window.setTimeout(() => {
      if (shouldContinue) handleContinue()
      if (shouldOpenRecords) setPanel('records')
    }, 0)

    return () => window.clearTimeout(timer)
  }, [handleContinue])

  const activeBeat = game === null ? null : getStoryBeat(game)
  const activeObjectiveAction =
    game === null || activeBeat === null
      ? undefined
      : STORY_ACTIONS.find(
          (action) =>
            activeBeat.requiredActionIds.includes(action.id) &&
            !isStoryActionComplete(game, action.id),
        )
  const activeObjectiveLocationId = activeObjectiveAction?.locationId
  const activeObjectiveWorldId =
    activeObjectiveLocationId === undefined
      ? null
      : (toWorldLocationId(activeObjectiveLocationId) ?? null)

  const visitLocation = useCallback(
    (locationId: string, open = true) => {
      if (game === null) return
      if (!game.unlockedLocations.includes(locationId)) {
        showToast('まだ、この場所へ続く道は開いていません。')
        return
      }
      const next = applyEffect(game, { kind: 'visitLocation', locationId })
      setGame(next)
      setPlayerPosition(worldPositionFor(locationId))
      setPanel(null)
      if (open) setActiveLocationId(locationId)
      persist(next)
      townAudio.play('step')
    },
    [game, persist, showToast],
  )

  const openWorldArea = useCallback(
    (area: WorldArea) => {
      visitLocation(toGameLocationId(area.id))
    },
    [visitLocation],
  )

  const handleLocationAction = useCallback(
    (actionId: string) => {
      if (game === null) return
      const action = STORY_ACTIONS.find((candidate) => candidate.id === actionId)
      if (action === undefined) return
      setActiveDialogue({ action })
      townAudio.play(
        action.kind === 'letters' ? 'letter' : action.kind === 'bulletins' ? 'paper' : 'select',
      )
    },
    [game],
  )

  const finalizeAction = useCallback(
    (dialogue: ActiveDialogue) => {
      if (game === null || isStoryActionComplete(game, dialogue.action.id)) {
        setActiveDialogue(null)
        return
      }
      const choiceEffects = dialogue.pendingChoice?.effects ?? []
      let next = completeStoryAction(game, dialogue.action, choiceEffects)
      const historyLines = [
        ...dialogue.action.lines.map((text) => ({
          speaker: dialogue.action.speaker ?? '地の文',
          text: personalizeText(text, game.player.name),
        })),
        ...(dialogue.pendingChoice?.response ?? []).map((text) => ({
          speaker: dialogue.action.speaker ?? '地の文',
          text: personalizeText(text, game.player.name),
        })),
      ]
      setDialogueHistory((current) => [...current, ...historyLines].slice(-40))

      if (dialogue.action.kind === 'final') {
        const choice = dialogue.pendingChoice?.id
        const finalChoice: FinalChoice =
          choice === 'take_outside' || choice === 'inherit_role' ? choice : 'return_name'
        next = applyEffect(next, { kind: 'setFinalChoice', value: finalChoice })
        const endingId = determineEndingFromRules(
          next,
          catalog.endings.map((ending) => ({
            id: ending.id,
            condition: ending.conditions,
            priority: ending.priority,
          })),
        )
        next = completeEnding(next, endingId)
        const ending = catalog.endings.find((candidate) => candidate.id === endingId)
        if (ending !== undefined) {
          next = applyEffect(next, { kind: 'deliverLetter', letterId: ending.finalLetterId })
        }
        next = evaluateAllAchievements(next)
        commitGame(next, `ENDING ${endingId} を記録しました。`)
        setActiveDialogue(null)
        setActiveLocationId(null)
        setScreen('ending')
        townAudio.play('chime')
        return
      }

      const completed = commitGame(next, `${dialogue.action.label}を日記へ記録しました。`)
      setActiveDialogue(null)
      if (dialogue.action.kind === 'letters') {
        setActiveLocationId(null)
        setPanel('letters')
      }
      if (dialogue.action.kind === 'bulletins') {
        setActiveLocationId(null)
        setPanel('bulletins')
      }
      if (canAdvanceStory(completed)) townAudio.play('discovery')
    },
    [commitGame, game],
  )

  const handleDialogueComplete = useCallback(() => {
    if (activeDialogue === null) return
    finalizeAction(activeDialogue)
  }, [activeDialogue, finalizeAction])

  const handleDialogueChoice = useCallback(
    (choiceId: string) => {
      if (activeDialogue === null) return
      const choice = activeDialogue.action.choices?.find((candidate) => candidate.id === choiceId)
      if (choice === undefined) return
      setActiveDialogue({
        action: activeDialogue.action,
        response: choice.response,
        pendingChoice: choice,
      })
      townAudio.play('select')
    },
    [activeDialogue],
  )

  const handleAdvanceTime = useCallback(() => {
    if (game === null || !canAdvanceStory(game)) return
    const result = advanceTime(game)
    if (!result.advanced) {
      showToast(result.blockedMessage)
      return
    }
    let next = synchronizeGameContent(result.state)
    if (next.clock.day === 7 && next.clock.period === 'morning') {
      window.localStorage.setItem(LAST_DAY_SAVE_KEY, exportSave(next, settings))
    }
    next = commitGame(next, `第${next.clock.day}日・${TIME_LABEL[next.clock.period]}へ進みました。`)
    setActiveLocationId(null)
    setPanel(null)
    setTimeAdvanceOpen(false)
    townAudio.startAmbience(next.clock.period, reducedMotion)
    townAudio.play('chime')
  }, [commitGame, game, reducedMotion, settings, showToast])

  const readLetter = useCallback(
    (letterId: string) => {
      setGame((current) => {
        if (current === null || current.readLetters.includes(letterId)) return current
        const letter = catalog.letters.find((candidate) => candidate.id === letterId)
        const next = applyEffect(current, {
          kind: 'readLetter',
          letterId,
          anonymous: letter?.anonymous === true,
        })
        persist(next)
        return next
      })
    },
    [persist],
  )

  const useLetterAction = useCallback(
    (letterId: string) => {
      if (game === null) return
      const action = catalog.letters.find((letter) => letter.id === letterId)?.actions[0]
      if (action === undefined) return
      commitGame(
        applyEffect(game, { kind: 'readLetter', letterId }),
        action.responseBlocks.join(' '),
      )
    },
    [commitGame, game],
  )

  const readBulletin = useCallback(
    (bulletinId: string) => {
      setGame((current) => {
        if (current === null || current.readBulletins.includes(bulletinId)) return current
        const bulletin = catalog.bulletins.find((candidate) => candidate.id === bulletinId)
        const next = applyEffect(current, {
          kind: 'readBulletin',
          bulletinId,
          official: bulletin?.official !== false,
        })
        persist(next)
        return next
      })
    },
    [persist],
  )

  const changeSettings = useCallback((patch: Partial<SettingsView>) => {
    setSettings((current) => ({ ...current, ...patch }))
  }, [])

  const handleManualSave = useCallback(() => {
    if (game === null) return
    const result = manualSave(window.localStorage, game, settings)
    setSaveStatus(result.success ? 'saved' : 'error')
    showToast(result.success ? '手動保存しました。' : `保存できませんでした：${result.error}`)
  }, [game, settings, showToast])

  const handleExport = useCallback(() => {
    const exportGame = game ?? recordGame
    if (exportGame === null) {
      showToast('書き出せる記録がありません。')
      return
    }
    const blob = new Blob([exportSave(exportGame, settings)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `tsukikage-town-day${String(exportGame.clock.day)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    showToast('記録JSONを書き出しました。')
  }, [game, recordGame, settings, showToast])

  const handleImportFile = useCallback(
    async (file: File | undefined) => {
      if (file === undefined) return
      if (file.size > MAX_SAVE_IMPORT_BYTES) {
        showToast('読み込めませんでした：記録JSONは2 MB以下にしてください。')
        return
      }
      const text = await file.text()
      const parsed = importSave(text)
      if (!parsed.success) {
        showToast(`読み込めませんでした：${parsed.issues[0] ?? '形式が正しくありません。'}`)
        return
      }
      const issues = validateGameCatalogReferences(parsed.save.game)
      if (issues.length > 0) {
        showToast(`読み込めませんでした：${issues[0] ?? '不明な参照があります。'}`)
        return
      }
      const result = importSaveToStorage(window.localStorage, text, 'manual')
      if (!result.success) {
        showToast(`読み込めませんでした：${result.error}`)
        return
      }
      const loaded = synchronizeGameContent(result.save.game)
      if (loaded.clock.day === 7) {
        const checkpoint = rewindToDaySeven(loaded, loaded)
        window.localStorage.setItem(LAST_DAY_SAVE_KEY, exportSave(checkpoint, result.save.settings))
      }
      setGame(loaded)
      setRecordGame(loaded)
      setSettings(result.save.settings)
      setCanContinue(true)
      setScreen(loaded.currentEndingId === null ? 'town' : 'ending')
      setPlayerPosition(worldPositionFor(loaded.currentLocationId))
      setPanel(null)
      showToast('記録JSONを読み込みました。')
    },
    [showToast],
  )

  const handleReset = useCallback(() => {
    resetGameData(window.localStorage, RESET_CONFIRMATION_PHRASE)
    window.localStorage.removeItem(LAST_DAY_SAVE_KEY)
    setGame(null)
    setRecordGame(null)
    setCanContinue(false)
    setPanel(null)
    setConfirmMode(null)
    setScreen('title')
    showToast('この端末の記録を初期化しました。')
  }, [showToast])

  const restartDaySeven = useCallback(() => {
    if (game === null) return
    const raw = window.localStorage.getItem(LAST_DAY_SAVE_KEY)
    if (raw === null) {
      showToast('最終日前の記録が見つかりません。')
      return
    }
    const parsed = importSave(raw)
    if (!parsed.success) {
      showToast('最終日前の記録を復旧できませんでした。')
      return
    }
    const rewound = synchronizeGameContent(rewindToDaySeven(parsed.save.game, game))
    setGame(rewound)
    setScreen('town')
    setPanel('journal')
    setPlayerPosition(worldPositionFor(rewound.currentLocationId))
    persist(rewound, '最終日の朝へ記録を戻しました。')
  }, [game, persist, showToast])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (screen !== 'town' || game === null || activeDialogue !== null) return
      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      )
        return
      if (event.key.toLowerCase() === 'm') setPanel((current) => (current === 'map' ? null : 'map'))
      if (event.key.toLowerCase() === 'j')
        setPanel((current) => (current === 'journal' ? null : 'journal'))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeDialogue, game, screen])

  if (screen === 'title') {
    const visibleRecord = recordGame ?? EMPTY_RECORD_STATE
    return (
      <>
        <TitleScreen
          canContinue={canContinue}
          soundMuted={settings.muted}
          reducedMotion={reducedMotion}
          onNewGame={handleNewGame}
          onContinue={handleContinue}
          onOpenRecords={() => setPanel('records')}
          onOpenSettings={() => setPanel('settings')}
          onToggleMute={() => setSettings((current) => ({ ...current, muted: !current.muted }))}
        />
        {panel === 'records' ? (
          <Dialog title="町の記録" size="large" onClose={() => setPanel(null)}>
            <RecordsContent game={visibleRecord} />
          </Dialog>
        ) : null}
        {panel === 'settings' ? (
          <Dialog title="設定" size="medium" onClose={() => setPanel(null)}>
            <SettingsPanel
              settings={settings}
              onChange={changeSettings}
              {...(recordGame === null ? {} : { onExport: handleExport })}
              onImport={() => importInputRef.current?.click()}
              onReset={() => setConfirmMode('reset')}
            />
            <input
              ref={importInputRef}
              className="visually-hidden"
              type="file"
              accept="application/json,.json"
              aria-label="保存記録JSONを読み込む"
              tabIndex={-1}
              onChange={(event) => {
                void handleImportFile(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </Dialog>
        ) : null}
        {confirmMode === 'reset' ? (
          <ConfirmDialog
            title="記録を初期化"
            body="自動保存、手動保存、設定、結末記録をこの端末から削除します。この操作は元に戻せません。"
            confirmLabel="すべて削除"
            danger
            phrase={RESET_CONFIRMATION_PHRASE}
            onConfirm={handleReset}
            onCancel={() => setConfirmMode(null)}
          />
        ) : null}
        <TransientMessages toast={toast} updateReady={updateReady} />
      </>
    )
  }

  if (screen === 'transfer') {
    return <TransferForm onSubmit={handleTransfer} onCancel={() => setScreen('title')} />
  }

  if (game === null) {
    return (
      <TitleScreen
        canContinue={canContinue}
        soundMuted={settings.muted}
        reducedMotion={reducedMotion}
        onNewGame={handleNewGame}
        onContinue={handleContinue}
        onOpenRecords={() => setPanel('records')}
        onOpenSettings={() => setPanel('settings')}
        onToggleMute={() => setSettings((current) => ({ ...current, muted: !current.muted }))}
      />
    )
  }

  if (screen === 'ending') {
    const ending =
      catalog.endings.find((candidate) => candidate.id === game.currentEndingId) ??
      catalog.endings[3]
    const finalLetter = catalog.letters.find((letter) => letter.id === ending.finalLetterId)
    return (
      <>
        <EndingScreen
          endingId={endingCode(ending.id)}
          title={ending.title}
          epilogue={ending.scenes.flatMap((scene) => scene.textBlocks)}
          clueCount={game.discoveredClues.length}
          trustedResidents={getCharacterViews(game)
            .filter((character) => character.discovered && character.trust >= 65)
            .map((character) => character.name)}
          finalLetter={personalizeText(
            finalLetter?.bodyBlocks.join(' ') ?? ending.summary,
            game.player.name,
          )}
          reducedMotion={reducedMotion}
          onRecords={() => setPanel('records')}
          onRestartDay7={restartDaySeven}
          onNewGame={handleNewGame}
          onSkip={() =>
            document
              .querySelector('.ending-paper')
              ?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
          }
        />
        {panel === 'records' ? (
          <Dialog title="町の記録" size="large" onClose={() => setPanel(null)}>
            <RecordsContent game={game} />
          </Dialog>
        ) : null}
        <TransientMessages toast={toast} updateReady={updateReady} />
      </>
    )
  }

  const beat = getStoryBeat(game)
  const location =
    catalog.locations.find((candidate) => candidate.id === game.currentLocationId) ??
    catalog.locations[0]
  const currentWorldLocation = toWorldLocationId(game.currentLocationId)
  const currentActions =
    activeLocationId === null ? [] : getAvailableStoryActions(game, activeLocationId)
  const locationActions: readonly LocationActionView[] = currentActions.map((action) => {
    const completed = isStoryActionComplete(game, action.id)
    const kind: LocationActionView['kind'] =
      action.kind === 'talk'
        ? 'talk'
        : action.kind === 'rest'
          ? 'rest'
          : action.kind === 'story' || action.kind === 'final'
            ? 'story'
            : 'inspect'
    return {
      id: action.id,
      label: action.label,
      description: action.description,
      symbol: action.symbol,
      kind,
      completed,
      disabled: false,
      ...(completed ? { description: '記録済み。会話や出来事を読み返せます。' } : {}),
    }
  })
  const locationPanelData =
    activeLocationId === null
      ? undefined
      : catalog.locations.find((candidate) => candidate.id === activeLocationId)
  const letters = getLetterViews(game)
  const bulletins = getBulletinViews(game)
  const clues = getClueViews(game)
  const characters = getCharacterViews(game)
  const canAdvance = canAdvanceStory(game)

  return (
    <main className="game-shell" data-testid="game-screen">
      <Suspense
        fallback={
          <div className="world-loading" role="status">
            町並みを組み立てています……
          </div>
        }
      >
        <WorldScene
          timeOfDay={game.clock.period}
          quality={settings.quality}
          reducedMotion={reducedMotion}
          playerPosition={playerPosition}
          onPlayerMove={setPlayerPosition}
          interactionEnabled={
            panel === null &&
            activeLocationId === null &&
            activeDialogue === null &&
            !timeAdvanceOpen
          }
          onInteract={(interaction) => openWorldArea(interaction.area)}
          activeObjective={activeObjectiveWorldId}
          {...(currentWorldLocation === undefined ? {} : { currentLocation: currentWorldLocation })}
          inputController={inputController}
          onNearbyAreaChange={setNearbyArea}
          className="game-world"
        />
      </Suspense>
      <GameHud
        day={game.clock.day}
        timeLabel={TIME_LABEL[game.clock.period]}
        location={location.name}
        objective={beat.objective}
        {...(nearbyArea === null ? {} : { interactionLabel: `${nearbyArea.label}を調べる` })}
        unreadLetters={letters.filter((letter) => letter.unread).length}
        newJournalEntries={canAdvance ? 1 : 0}
        saveStatus={saveStatus}
        onOpenMenu={setPanel}
        onInteract={() => {
          if (nearbyArea !== null) openWorldArea(nearbyArea)
        }}
        onAdvanceTime={() => setTimeAdvanceOpen(true)}
        canAdvanceTime={canAdvance}
      />
      <div className="world-mobile-controls">
        <WorldMobileControls
          controller={inputController}
          disabled={panel !== null || activeLocationId !== null || activeDialogue !== null}
          interactionLabel="調べる"
        />
      </div>

      {activeLocationId !== null && locationPanelData !== undefined && activeDialogue === null ? (
        <Dialog
          title={locationPanelData.name}
          size="medium"
          onClose={() => setActiveLocationId(null)}
        >
          <LocationPanel
            name={locationPanelData.name}
            atmosphere={locationPanelData.atmosphere}
            description={locationPanelData.description}
            day={game.clock.day}
            timeLabel={TIME_LABEL[game.clock.period]}
            actions={locationActions}
            onAction={handleLocationAction}
            onLeave={() => setActiveLocationId(null)}
          />
        </Dialog>
      ) : null}

      {panel === 'map' ? (
        <Dialog title="月影町案内図" size="large" onClose={() => setPanel(null)}>
          <TownMap
            locations={mapLocations(game, activeObjectiveLocationId)}
            currentLocationId={game.currentLocationId}
            onTravel={visitLocation}
          />
        </Dialog>
      ) : null}
      {panel === 'journal' ? (
        <Dialog title="日記と手掛かり" size="large" onClose={() => setPanel(null)}>
          <Journal
            objective={beat.objective}
            hintSteps={beat.hints}
            completed={completedJournalEntries(game)}
            clues={clues}
            characters={characters}
            collectedLetters={letters.length}
            totalLetters={catalog.letters.length}
            collectedBulletins={game.readBulletins.length}
            totalBulletins={catalog.bulletins.length}
          />
        </Dialog>
      ) : null}
      {panel === 'letters' ? (
        <Dialog title="自室の机・手紙" size="large" onClose={() => setPanel(null)}>
          <LetterReader letters={letters} onRead={readLetter} onAction={useLetterAction} />
        </Dialog>
      ) : null}
      {panel === 'bulletins' ? (
        <Dialog title="町内掲示板" size="large" onClose={() => setPanel(null)}>
          <BulletinBoard bulletins={bulletins} day={game.clock.day} onRead={readBulletin} />
        </Dialog>
      ) : null}
      {panel === 'resident' ? (
        <Dialog title="住民票" size="medium" onClose={() => setPanel(null)}>
          <ResidentCard
            playerName={game.player.name}
            residentNumber={game.player.residentNumber}
            day={game.clock.day}
            note={
              catalog.endings.find((ending) => ending.id === game.currentEndingId)
                ?.residentRecordNote ??
              (game.clock.day === 0 ? '転入手続き済み。月影荘203号室。' : '町内記録を調査中。')
            }
            onPrint={() => window.print()}
          />
        </Dialog>
      ) : null}
      {panel === 'records' ? (
        <Dialog title="町の記録" size="large" onClose={() => setPanel(null)}>
          <RecordsContent game={game} />
        </Dialog>
      ) : null}
      {panel === 'settings' ? (
        <Dialog title="設定と記録" size="medium" onClose={() => setPanel(null)}>
          <SettingsPanel
            settings={settings}
            onChange={changeSettings}
            onManualSave={handleManualSave}
            onExport={handleExport}
            onImport={() => importInputRef.current?.click()}
            onReset={() => setConfirmMode('reset')}
          />
          <input
            ref={importInputRef}
            className="visually-hidden"
            type="file"
            accept="application/json,.json"
            aria-label="保存記録JSONを読み込む"
            tabIndex={-1}
            onChange={(event) => {
              void handleImportFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </Dialog>
      ) : null}
      {timeAdvanceOpen ? (
        <Dialog title="時間を進める" size="small" onClose={() => setTimeAdvanceOpen(false)}>
          <DayAdvancePanel
            day={game.clock.day}
            period={game.clock.period}
            canAdvance={canAdvance}
            blockedMessage={beat.blockedMessage}
            nextLabel={
              game.clock.period === 'night'
                ? `第${String(game.clock.day + 1)}日へ`
                : `${game.clock.period === 'morning' ? '夕方' : '夜'}へ`
            }
            onAdvance={handleAdvanceTime}
          />
        </Dialog>
      ) : null}

      {activeDialogue !== null ? (
        <DialoguePanel
          key={`${activeDialogue.action.id}:${activeDialogue.response === undefined ? 'main' : 'response'}`}
          speaker={activeDialogue.action.speaker ?? '地の文'}
          {...(activeDialogue.action.speakerRole === undefined
            ? {}
            : { speakerRole: activeDialogue.action.speakerRole })}
          {...(activeDialogue.action.portraitSymbol === undefined
            ? {}
            : { portraitSymbol: activeDialogue.action.portraitSymbol })}
          lines={(activeDialogue.response ?? activeDialogue.action.lines).map((line) =>
            personalizeText(line, game.player.name),
          )}
          {...(activeDialogue.response === undefined && activeDialogue.action.choices !== undefined
            ? { choices: activeDialogue.action.choices }
            : { choices: [] })}
          textSpeed={settings.textSpeed}
          autoAdvance={settings.autoAdvance}
          reducedMotion={reducedMotion}
          history={dialogueHistory}
          {...(isStoryActionComplete(game, activeDialogue.action.id)
            ? { onSkip: handleDialogueComplete }
            : {})}
          onChoose={handleDialogueChoice}
          onComplete={handleDialogueComplete}
        />
      ) : null}

      {confirmMode === 'reset' ? (
        <ConfirmDialog
          title="記録を初期化"
          body="自動保存、手動保存、設定、結末記録をこの端末から削除します。この操作は元に戻せません。"
          confirmLabel="すべて削除"
          danger
          phrase={RESET_CONFIRMATION_PHRASE}
          onConfirm={handleReset}
          onCancel={() => setConfirmMode(null)}
        />
      ) : null}
      <TransientMessages toast={toast} updateReady={updateReady} />
    </main>
  )
}

function RecordsContent({ game }: { readonly game: GameState }) {
  return (
    <RecordsPanel
      endings={catalog.endings.map((ending) => ({
        id: ending.id,
        title: ending.title,
        description: ending.summary,
        reached: game.reachedEndings.includes(ending.id),
      }))}
      achievements={getAchievementViews(game)}
      clues={getClueViews(game)}
      letters={getLetterViews(game)}
      bulletins={getBulletinViews(game).filter(
        (bulletin) => game.currentEndingId !== null || game.readBulletins.includes(bulletin.id),
      )}
      characters={getCharacterViews(game)}
      playTimeMinutes={Math.floor(game.playTimeSeconds / 60)}
      resident={{
        name: game.player.name,
        number: game.player.residentNumber,
        note:
          catalog.endings.find((ending) => ending.id === game.currentEndingId)
            ?.residentRecordNote ?? '月影町の記録を調査中。',
      }}
      totalClues={catalog.clues.length}
      totalLetters={catalog.letters.length}
      totalBulletins={catalog.bulletins.length}
    />
  )
}

function TransientMessages({
  toast,
  updateReady,
}: {
  readonly toast: string | null
  readonly updateReady: boolean
}) {
  return (
    <>
      {toast === null ? null : (
        <div className="game-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
      {updateReady ? (
        <button type="button" className="update-banner" onClick={() => window.location.reload()}>
          新しい町の記録があります。更新する
        </button>
      ) : null}
    </>
  )
}
