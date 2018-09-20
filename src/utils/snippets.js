function closures () {
  return `var count = 0

function makeAdder(x) {
  return function(y) {
    return x + y;
  };
}

var add5 = makeAdder(5);
count += add5(2)`
}

function bubbleSort () {
  return `var a = 'bub`
}

function scopeChain () {
  return `var t = 'scope'`
}

const snippets = {
  closures: closures(),
  bubbleSort: bubbleSort(),
  scopeChain: scopeChain(),
}

export default snippets