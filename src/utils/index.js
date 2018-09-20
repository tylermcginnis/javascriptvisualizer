export function getFlatColors () {
  return {
    flatRed: '#fea3aa',
    flatOrange: '#f8b88b',
    flatPink: '#f2a2e8',
    flatGreen: '#baed91',
    flatYellow: '#faf884',
    flatBlue: '#b2cefe',
    flatPurple: '#E0BBE4',
  }
}

export function getRandomElement(arr) {
  return arr[~~(arr.length * Math.random())];
}

export function removeQuotesFromKeys (str) {
  return str.replace(/"([^(")"]+)":/g,"$1:")
}

export function addQuotesToKeys (str) {
  return str.replace(/([{,])(\s*)([A-Za-z0-9_-]+?)\s*:/g, '$1"$3":')
}