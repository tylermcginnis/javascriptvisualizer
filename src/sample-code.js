var topLevelVar = 'This is the top level var'
topLevelVarWithNoDeclaration = 'This is a top var with no decl'

function topLevelFn () {
  varWithoutDeclaration = 'This should be global'
  var withDec = 'This should be local to the fn'

  function nestedFn () {
    var notGlobal = 'This is in nestedFn'
    nestedVarWithoutDeclaration = 'This should be global too'
  }

  nestedFn()
}

var fnExpression = function () {
  var varInFnExpression = 'This is in a function expression'
}

fnExpression()
topLevelFn()

const user = {
  name: 'Tyler',
  age: 27,
  greet() {
    alert(`Hello, my name is ${this.name}`)
  },
  mother: {
    name: 'Stacey',
    greet() {
      alert(`Hello, my name is ${this.name}`)
    }
  }
}

user.greet()
user.mother.greet()


var user = {
  name: 'Tyler',
  age: 27,
  greet: function () {
    var inner = 'hello'
    alert('Greeeeeet')
  },
  mother: {
    name: 'Stacey',
    greet: function () {
      var another = 'okokok'
     console.log('Greeeeeting')
    }
  }
}

user.greet()
user.mother.greet()


var name = 'Tyler'

function doThing () {
  var age = 28
  return age
}

doThing()





function doThing () {
  var thing = 'thinggggg'
  return thing
}

function doMe () {
  var me = 'meeee'
  return me
}

var doYou = function () {
  var you = 'youuuu'
  return you;
}

doThing()
var name = 'Tyler'
doMe()
var age = 28
doYou()

scopes: {
  Program: {
    doThing: fn(),
    name: 'Tyler',
  },
  doThing: {
    age: 28,
  }
},
stack: [
  {
    name: 'Program',
    closure: false,
  },
  {
    name: 'doThing',
    closure: false
  }
]


scopes: {
  Program: {
    doThing: fn(),
    name: 'Tyler',
  },
  greet: {
    inner: 'hello',
  },
},
stack: [
  {
    name: 'Program',
    closure: false,
  },
  {
    name: 'greet',
    closure: false
  }.
  {
    name: 'greet',
    closure: false,
  }
]


// todo. handle this case
var user = {
  name: 'Tyler',
  age: 27,
  greet: function () {
    var inner = 'hello'
    this.mother.greet()
    alert('Greeeeeet')
  },
  mother: {
    name: 'Stacey',
    greet: function () {
      var another = 'okokok'
     console.log('Greeeeeting')
    }
  }
}

function doThing () {
  var name = 'Tyler'

  function nestedFn() {
    var age = 28
    return age
  }

  nestedFn()
}

doThing


function add (arr) {
  var count = 0
  for (var i = 0; i < arr.length; i++) {
    count += arr[i]
  }

  return count
}

add([1,2,3])