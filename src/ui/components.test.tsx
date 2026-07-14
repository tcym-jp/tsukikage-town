import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BulletinBoard } from './BulletinBoard'
import { ConfirmDialog } from './ConfirmDialog'
import { DialoguePanel } from './DialoguePanel'
import { ErrorBoundary } from './ErrorBoundary'
import { Journal } from './Journal'
import { LetterReader } from './LetterReader'
import { LocationPanel } from './LocationPanel'
import { RecordsPanel } from './RecordsPanel'
import { SettingsPanel, type SettingsView } from './SettingsPanel'
import { prepareLowQualityRetry } from './lowQualityRetry'
import { createInitialGameState, DEFAULT_SETTINGS, exportSave, importSave } from '../game'

describe('core narrative components', () => {
  it('advances dialogue and applies a choice only after it is shown', () => {
    const onChoose = vi.fn()
    render(
      <DialoguePanel
        speaker="御影 澄"
        lines={['記録を確かめましょう。']}
        choices={[{ id: 'listen', label: '話を聞く' }]}
        textSpeed="normal"
        autoAdvance={false}
        reducedMotion
        history={[]}
        onChoose={onChoose}
        onComplete={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '話を聞く' }))
    expect(onChoose).toHaveBeenCalledWith('listen')
  })

  it('offers a skip control only for dialogue marked as already read', () => {
    const onSkip = vi.fn()
    render(
      <DialoguePanel
        speaker="久世 灯"
        lines={['読み返した文章です。']}
        textSpeed="instant"
        autoAdvance={false}
        reducedMotion
        history={[]}
        onSkip={onSkip}
        onComplete={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '既読を送る' }))
    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('lets a completed location event be opened again for safe rereading', () => {
    const onAction = vi.fn()
    render(
      <LocationPanel
        name="灯下書房"
        atmosphere="古い紙の匂いがする。"
        description="町史が並んでいる。"
        day={2}
        timeLabel="夕方"
        actions={[
          {
            id: 'history',
            label: '町史を読み返す',
            description: '記録済み。会話や出来事を読み返せます。',
            symbol: '史',
            completed: true,
            disabled: false,
          },
        ]}
        onAction={onAction}
        onLeave={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /町史を読み返す/ }))
    expect(onAction).toHaveBeenCalledWith('history')
  })

  it('reads and revisits a delivered letter', async () => {
    const onRead = vi.fn()
    render(
      <LetterReader
        letters={[
          {
            id: 'letter-1',
            sender: '差出人不明',
            recipient: '月野さん',
            date: '第1日',
            subject: 'まだ捨てないでください',
            body: ['十二の次を、空白のままにしないで。'],
            unread: true,
            anonymous: true,
            kind: 'unknown',
          },
        ]}
        onRead={onRead}
      />,
    )
    expect(screen.getByRole('heading', { name: 'まだ捨てないでください' })).toBeVisible()
    await waitFor(() => expect(onRead).toHaveBeenCalledWith('letter-1'))
  })

  it('distinguishes and opens the thirteenth bulletin', () => {
    const onRead = vi.fn()
    render(
      <BulletinBoard
        day={6}
        bulletins={[
          {
            id: 'notice-13',
            number: 13,
            title: '名前の確認について',
            body: '読んだ名前を、空白へ戻さないこと。',
            status: 'thirteenth',
          },
        ]}
        onRead={onRead}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /十三番目.*名前の確認について/ }))
    expect(onRead).toHaveBeenCalledWith('notice-13')
    expect(screen.getByText('読んだ名前を、空白へ戻さないこと。')).toBeVisible()
  })

  it('shows objective hints and switches to collected clues', () => {
    render(
      <Journal
        objective="役場の台帳を調べる"
        hintSteps={['役場へ向かおう。', '青いインクの行を見る。']}
        completed={[]}
        clues={[{ id: 'blue', title: '青い訂正線', body: '名前の跡が残る。' }]}
        characters={[]}
        collectedLetters={2}
        totalLetters={12}
        collectedBulletins={3}
        totalBulletins={13}
      />,
    )
    expect(screen.getByRole('heading', { name: '役場の台帳を調べる' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'もう少し詳しいヒント' }))
    expect(screen.getByText('青いインクの行を見る。')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '手掛かり' }))
    expect(screen.getByRole('heading', { name: '青い訂正線' })).toBeVisible()
  })

  it('keeps resident, letter, bulletin, and clue records available after clearing', () => {
    render(
      <RecordsPanel
        endings={[
          { id: 'ending-a', title: '月影町の住民', description: '名前が戻った。', reached: true },
        ]}
        achievements={[
          { id: 'first', title: '最初の記録', description: '町へ着いた。', unlocked: true },
        ]}
        clues={[{ id: 'clock', title: '11時13分の時計', body: '針が戻った。' }]}
        letters={[
          {
            id: 'welcome',
            sender: '御影 澄',
            recipient: '検証住民',
            date: '物語のあと',
            subject: 'ようこそ',
            body: ['記録係補佐へ。'],
            unread: false,
          },
        ]}
        bulletins={[
          {
            id: 'thirteen',
            number: 13,
            title: '名前の確認',
            body: '空白へ戻さないこと。',
            status: 'thirteenth',
          },
        ]}
        characters={[
          {
            id: 'sumi',
            name: '御影 澄',
            reading: 'みかげ すみ',
            role: '住民課',
            note: '町の記録を守る。',
            trust: 80,
            discovered: true,
          },
        ]}
        resident={{ name: '検証住民', number: 'TS-013-0203', note: '記録係補佐' }}
        playTimeMinutes={37}
        totalClues={15}
        totalLetters={12}
        totalBulletins={13}
      />,
    )
    expect(screen.getByRole('article', { name: '検証住民さんの住民票' })).toHaveTextContent(
      '記録係補佐',
    )
    expect(screen.getByText('ようこそ')).toBeInTheDocument()
    expect(screen.getByText(/第13項.*名前の確認/)).toBeInTheDocument()
    expect(screen.getByText('11時13分の時計')).toBeInTheDocument()
    expect(screen.getByText('町の記録を守る。')).toBeInTheDocument()
  })
})

describe('settings and failure recovery components', () => {
  const settings: SettingsView = {
    bgmVolume: 0.55,
    sfxVolume: 0.7,
    muted: false,
    textSpeed: 'normal',
    autoAdvance: false,
    reducedMotion: false,
    quality: 'auto',
    fontScale: 1,
  }

  it('emits canonical settings values', () => {
    const onChange = vi.fn()
    render(<SettingsPanel settings={settings} onChange={onChange} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /すべての音を消す/ }))
    expect(onChange).toHaveBeenCalledWith({ muted: true })
    fireEvent.change(screen.getByRole('combobox', { name: '3D画質' }), { target: { value: 'low' } })
    expect(onChange).toHaveBeenCalledWith({ quality: 'low' })
  })

  it('requires the destructive confirmation phrase', () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        title="記録を初期化"
        body="端末内の記録を削除します。"
        confirmLabel="削除"
        danger
        phrase="月影町の記録を初期化"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    )
    const confirm = screen.getByRole('button', { name: '削除' })
    expect(confirm).toBeDisabled()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '月影町の記録を初期化' } })
    expect(confirm).toBeEnabled()
    fireEvent.click(confirm)
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('renders a recoverable error surface', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    function BrokenView(): never {
      throw new Error('test failure')
    }
    render(
      <ErrorBoundary>
        <BrokenView />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('heading', { name: '予期しない問題が起きました' })).toBeVisible()
    expect(screen.getByRole('button', { name: '画面を読み直す' })).toBeVisible()
    consoleError.mockRestore()
  })

  it('persists low quality and reduced motion before a low-load retry', () => {
    window.localStorage.clear()
    window.localStorage.setItem(
      'tsukikage-town:save:auto',
      exportSave(createInitialGameState('低負荷検証'), DEFAULT_SETTINGS),
    )
    expect(prepareLowQualityRetry(window.localStorage)).toEqual({ success: true })
    expect(
      JSON.parse(window.localStorage.getItem('tsukikage-town:settings') ?? '{}'),
    ).toMatchObject({
      quality: 'low',
      reducedMotion: true,
    })
    const save = importSave(window.localStorage.getItem('tsukikage-town:save:auto') ?? '')
    expect(save.success).toBe(true)
    if (!save.success) throw new Error('low-load save should remain valid')
    expect(save.save.settings).toMatchObject({ quality: 'low', reducedMotion: true })
    window.localStorage.clear()
  })

  it('treats dialogue as a focus-trapped modal without letting Escape skip choices', async () => {
    const onComplete = vi.fn()
    render(
      <DialoguePanel
        speaker="御影 澄"
        lines={['検証住民さん、記録を確かめましょう。']}
        textSpeed="instant"
        autoAdvance={false}
        reducedMotion
        history={[]}
        onComplete={onComplete}
      />,
    )
    const dialogue = screen.getByRole('dialog', { name: '御影 澄' })
    expect(dialogue).toBeVisible()
    await waitFor(() => expect(dialogue).toHaveFocus())
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onComplete).not.toHaveBeenCalled()
    expect(dialogue).toHaveFocus()
  })
})
