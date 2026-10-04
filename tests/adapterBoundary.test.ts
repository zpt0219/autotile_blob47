import { it, expect } from 'vitest';
import ts from 'typescript';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const sourceRoot = path.resolve('src');
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)],
  );
}
it('keeps domain algorithms and models independent of browser and UI modules', () => {
  const failures: string[] = [];
  for (const file of [...files('src/core'), ...files('src/model')]) {
    const tree = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    function visit(node: ts.Node) {
      if (
        ts.isIdentifier(node) &&
        [
          'window',
          'document',
          'localStorage',
          'navigator',
          'HTMLCanvasElement',
          'ImageData',
        ].includes(node.text)
      )
        failures.push(file + ': ' + node.text);
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const name = node.moduleSpecifier.text;
        if (
          name === 'react' ||
          name.includes('/app/') ||
          name.includes('/panels/') ||
          name.includes('/components/')
        )
          failures.push(file + ': ' + name);
        if (name.startsWith('.'))
          expect(path.resolve(path.dirname(file), name).startsWith(sourceRoot + path.sep)).toBe(
            true,
          );
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
  }
  expect(failures).toEqual([]);
});
