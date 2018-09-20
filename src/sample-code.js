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




var name = 'Tyler'

function doThing (arg) {
  var age = 28
  return name + ' ' + arg
}

doThing(name, function () {
  console.log('woo')
}, [true, 'hey', function anotehr(){}, [1,2,3, true, {name: 'cool'}]])



// Edge case
var name = 'Jake'

function doThing () {
  var name = 'Tyler'

  name = 'Eyo'
}

doThing()


// This doesnt work all the way
function Person (name, age) {
  this.name = name
  this.age = age
}

Person.prototype.sayName = function () {
  alert(this.name)
}

var me = new Person('Tyler', 28)

me.sayName()



function makeAdder(x) {
  return function(y) {
    return x + y;
  };
}

var add5 = makeAdder(5);

add5(2);


var count = 0

function makeAdder(x) {
  return function(y) {
    return x + y;
  };
}

var add5 = makeAdder(5);
count += add5(2)



// closure not working and vars not updating
var counter = (function() {
  var privateCounter = 0;
  function changeBy(val) {
    privateCounter += val;
  }
  return {
    increment: function() {
      changeBy(1);
    },
    decrement: function() {
      changeBy(-1);
    },
    value: function() {
      return privateCounter;
    }
  };
})();

counter.value()
counter.increment();
counter.increment();
counter.value()
counter.decrement();
counter.value()

// multiple anon test
(function () {
  var name = 'Tyler';

  (function () {
    var age = 28;
  })();
})();




function Person (name, age) {
  this.waka = function () {
    var woo = 'lololo'
  }
  this.nameThis = name
  this.age = age
}

Person.prototype.sayName = function () {
  alert(this.name)
}

var me = new Person('Tyler', 28)

me.sayName()