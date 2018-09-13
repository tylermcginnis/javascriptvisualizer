var topLevelVar = 'This is the top level var'
topLevelVarWithNoDeclaration = 'This is a top var with no decl'

function topLevelFn () {
  varWithoutDeclaration = 'This should be global'
  var withDec = 'This should be local to the fn'

  function nestedFn () {
    var notGlobal = 'This is in nestedFn'
    nestedVarWithoutDeclaration = 'This should be global too'
  }
}

var fnExpression = function () {
  var varInFnExpression = 'This is in a function expression'
}

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
    alert("Hello, my name is ${this.name}")
  },
  mother: {
    name: 'Stacey',
    greet: function () {
      alert("Hello, my name is ${this.name}")
    }
  }
}

user.greet()