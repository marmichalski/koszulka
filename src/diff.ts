export class Diff {
  constructor(
    readonly additions: number,
    readonly deletions: number,
  ) {}

  total(): number {
    return this.additions + this.deletions;
  }
}
