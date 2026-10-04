/** Identifies edits so delayed imports cannot replace newer work. */
export class EditRevision {
  private value = 0;
  advance(): void {
    this.value++;
  }
  read(): number {
    return this.value;
  }
}
