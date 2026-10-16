export type Level = 1 | 2 | 3 | 4;
export type Tempo = 'turtle' | 'horse' | 'cheetah';
export type Equation = { a: number; b: number; operator: '+' | '−'; result: number; shown: number };
export type Random = () => number;
export const levels: Level[] = [1, 2, 3, 4];
export const tempos: Tempo[] = ['turtle', 'horse', 'cheetah'];
export const MAX_ANSWER_RUN = 4;
const integer = (max: number, random: Random) => Math.floor(random() * (max + 1));
const operationKey = (e: Equation) => `${e.a}${e.operator}${e.b}`;

function operations(level: Level): Equation[] {
  const deck: Equation[] = [];
  const limit = level === 4 ? 100 : 10;
  for (let a = 0; a <= limit; a++) {
    for (let b = 0; b <= limit; b++) {
      if (level === 2 || level === 3 || a + b <= limit)
        deck.push({ a, b, operator: '+', result: a + b, shown: a + b });
      if (level === 3 && a >= b) deck.push({ a, b, operator: '−', result: a - b, shown: a - b });
    }
  }
  return deck;
}

// Each game owns a deck; exhausting it starts another complete, shuffled cycle.
export class EquationDeck {
  private deck: Equation[] = [];
  private cursor = 0;
  private previous?: Equation;
  private lastTruth?: boolean;
  private truthRun = 0;

  constructor(
    private level: Level,
    private random: Random = Math.random,
  ) {}

  next(): Equation {
    if (this.cursor === this.deck.length) this.refill();
    const equation = this.deck[this.cursor++];
    this.previous = equation;
    return equation;
  }

  private refill() {
    const deck = operations(this.level);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = integer(i, this.random);
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    if (this.previous && operationKey(deck[0]) === operationKey(this.previous)) {
      const j = 1 + integer(deck.length - 2, this.random);
      [deck[0], deck[j]] = [deck[j], deck[0]];
    }

    let truths = Math.floor(deck.length / 2);
    if (deck.length % 2 && this.random() < 0.5) truths++;
    let falses = deck.length - truths;
    for (const equation of deck) {
      const canUse = (truth: boolean) => {
        if ((truth ? truths : falses) === 0) return false;
        const run = this.lastTruth === truth ? this.truthRun + 1 : 1;
        if (run > MAX_ANSWER_RUN) return false;
        const same = (truth ? truths : falses) - 1;
        const opposite = truth ? falses : truths;
        // Leave enough separators for the remaining answers, including the tail.
        return (
          same <= MAX_ANSWER_RUN * (opposite + 1) - run && opposite <= MAX_ANSWER_RUN * (same + 1)
        );
      };
      const truth = !canUse(false) || (canUse(true) && this.random() < truths / (truths + falses));
      this.truthRun = this.lastTruth === truth ? this.truthRun + 1 : 1;
      this.lastTruth = truth;
      if (truth) truths--;
      else {
        falses--;
        const maxResult =
          this.level === 4 ? 100 : this.level === 1 || equation.operator === '−' ? 10 : 20;
        const distance = this.level === 4 ? 10 : 3;
        const alternatives = Array.from({ length: maxResult + 1 }, (_, value) => value).filter(
          (value) => value !== equation.result && Math.abs(value - equation.result) <= distance,
        );
        equation.shown = alternatives[integer(alternatives.length - 1, this.random)];
      }
    }
    this.deck = deck;
    this.cursor = 0;
  }
}
