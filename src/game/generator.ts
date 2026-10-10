export type Level = 1 | 2 | 3 | 4;
export type Tempo = 'turtle' | 'horse' | 'cheetah';
export type Equation = { a: number; b: number; operator: '+' | '−'; result: number; shown: number };
export type Random = () => number;
export const levels: Level[] = [1, 2, 3, 4];
export const tempos: Tempo[] = ['turtle', 'horse', 'cheetah'];
const integer = (max: number, random: Random) => Math.floor(random() * (max + 1));
export const equationKey = (e: Equation) => `${e.a}${e.operator}${e.b}=${e.shown}`;
export function generate(
  level: Level,
  random: Random = Math.random,
  previous?: Equation,
): Equation {
  let equation!: Equation;
  for (let attempt = 0; attempt < 12; attempt++) {
    const operator = level === 3 && random() < 0.5 ? '−' : '+';
    const limit = level === 4 ? 100 : 10;
    const a = integer(limit, random);
    const b = integer(operator === '−' ? a : level === 1 || level === 4 ? limit - a : 10, random);
    const result = operator === '+' ? a + b : a - b;
    const maxResult =
      level === 4 ? 100 : (level === 2 || level === 3) && operator === '+' ? 20 : 10;
    let shown = result;
    if (random() < 0.5) {
      const alternatives = Array.from({ length: maxResult + 1 }, (_, value) => value).filter(
        (value) => value !== result && Math.abs(value - result) <= (level === 4 ? 10 : 3),
      );
      shown = alternatives[integer(alternatives.length - 1, random)];
    }
    equation = { a, b, operator, result, shown };
    if (!previous || equationKey(equation) !== equationKey(previous)) return equation;
  }
  // Deterministic fallback also prevents repeats with a constant test RNG.
  return {
    ...equation,
    shown:
      equation.shown === equation.result
        ? equation.result === 0
          ? 1
          : equation.result - 1
        : equation.result,
  };
}
