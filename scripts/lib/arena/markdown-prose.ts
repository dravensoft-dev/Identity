/* Splits Markdown into its prose runs, one per line, so a gate reading
 * punctuation never judges the code a document quotes. Both skips are lexed
 * rather than matched: a fence closes only on a run of its own character at
 * least as long as the one that opened it, and a code span only on a backtick
 * run of exactly its own length, which may be lines below. Kept dependency-free
 * so it runs under plain node. */

const OPENS_FENCE = /^ {0,3}(`{3,}|~{3,})/;
const CLOSES_FENCE = /^ {0,3}(`+|~+)[ \t]*$/;

function runLength(source: string, at, character) {
  let length = 0;
  while (source[at + length] === character) length += 1;
  return length;
}

function lineEnd(source: string, at) {
  const found = source.indexOf('\n', at);
  return found === -1 ? source.length : found;
}

function blankFollows(source: string, newlineAt) {
  return /^[ \t]*(\n|$)/.test(source.slice(newlineAt + 1));
}

function spanEnd(source: string, at, arenaTicks) {
  for (let i = at + arenaTicks; i < source.length; i += 1) {
    if (source[i] === '\n') {
      if (blankFollows(source, i)) return -1;
      continue;
    }
    if (source[i] !== '`') continue;
    const run = runLength(source, i, '`');
    if (run === arenaTicks) return i + run;
    i += run - 1;
  }
  return -1;
}

export function proseSegments(source: string) {
  const segments: { line: number; column: number; text: string }[] = [];
  let line = 1;
  let column = 1;
  let index = 0;
  let text = '';
  let startLine = 1;
  let startColumn = 1;
  let fence = null;

  const flush = () => {
    if (text.trim() !== '') segments.push({ line: startLine, column: startColumn, text });
    text = '';
  };

  const advanceTo = (target) => {
    for (let k = index; k < target; k += 1) {
      if (source[k] === '\n') { line += 1; column = 1; } else column += 1;
    }
    index = target;
  };

  while (index < source.length) {
    if (column === 1) {
      const end = lineEnd(source, index);
      const raw = source.slice(index, end);
      const opening = OPENS_FENCE.exec(raw);
      const closing = CLOSES_FENCE.exec(raw);

      if (fence && closing && closing[1][0] === fence[0] && closing[1].length >= fence.length) {
        flush();
        fence = null;
        advanceTo(Math.min(end + 1, source.length));
        continue;
      }
      if (fence) {
        flush();
        advanceTo(Math.min(end + 1, source.length));
        continue;
      }
      if (opening) {
        flush();
        fence = opening[1];
        advanceTo(Math.min(end + 1, source.length));
        continue;
      }
    }

    const character = source[index];

    if (character === '\n') {
      flush();
      advanceTo(index + 1);
      continue;
    }

    if (character === '`') {
      const arenaTicks = runLength(source, index, '`');
      const end = spanEnd(source, index, arenaTicks);
      if (end !== -1) {
        flush();
        advanceTo(end);
        continue;
      }
    }

    if (text === '') { startLine = line; startColumn = column; }
    text += character;
    advanceTo(index + 1);
  }

  flush();
  return segments;
}
