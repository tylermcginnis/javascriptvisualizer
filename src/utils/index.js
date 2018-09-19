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