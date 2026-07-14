import { simulateCompleteStory } from '../src/app/simulator'

const result = simulateCompleteStory()
const lastPeriod = result.periods.at(-1)

console.log('Story reachability simulation: OK')
console.log(`  periods: ${result.periods.length} (Day 0 evening → Day 7 night)`)
console.log(`  gates verified: ${result.verifiedGateCount}`)
console.log(`  actions completed before branching: ${result.completedActionIds.length}`)
console.log(`  clues: ${result.preEndingState.discoveredClues.length}`)
console.log(
  `  endings: ${Object.values(result.endingStates)
    .map((state) => state.currentEndingId)
    .join(', ')}`,
)
console.log(`  retained records: ${result.restoredRecordState.reachedEndings.join(', ')}`)
console.log(`  final checkpoint: Day ${lastPeriod?.day ?? '?'} ${lastPeriod?.period ?? '?'}`)
