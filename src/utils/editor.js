function getTotalLineLengths (lengths, lineNumber) {
  let count = 0

  for (let i = 0; i < lineNumber; i++) {
    // this one weird trick solves off by one errors. (+ 1)
    count += lengths[i] + 1
  }

  return count
}

export function formatCharLoc (code, charIndex) {
  const lineLengths = code.split('\n').map((line) => line.length)

  let line = 0;
  let ch = 0

  for (let i = 0; i < code.length + 1; i++) {
    if (i === charIndex) {
      return {
        line,
        ch: ch - getTotalLineLengths(lineLengths, line),
      }
    }

    if (code[i] === '\n') {
      line++
    }

    ch++
  }
}