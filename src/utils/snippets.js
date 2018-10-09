function simpleClosure () {
  return `var count = 0;

function makeAdder(x) {
  return function(y) {
    return x + y;
  };
}

var add5 = makeAdder(5);
count += add5(2);`
}

function bubbleSort () {
  return `function bubbleSort (arr) {
  var length = arr.length;
  var swapped;

  do {
    swapped = false;

    for (var i = 0; i < length; i++) {
      if (arr[i] > arr[i + 1]) {
        var temp = arr[i];
        arr[i] = arr[i + 1];
        arr[i + 1] = temp;
        swapped = true;
      }
    }

  } while (swapped);

  return arr;
}

bubbleSort([5,19,1]);`
}

function scopeChain () {
  return `var topLevelVar = "Since this variable was declared outside of a function, it'll go on the global scope.";

function topLevelFn () {
  globalVar = 'This variable has no declaration, it should be put on the global scope.';
  var localVar = "This variable should be local to topLevelFn's scope";

  function nestedFn () {
    var anotherLocalVar = "Local to nestedFn's scope.";
    var access = "Because of the scope chain, in this function we still have access to any of the variable declared in topLevelFn or the global scope.";

    console.log(localVar);
    console.log(topLevelVar);
  }

  nestedFn();
}

var fnExpression = function () {
  var hoisted = "Did you notice that fnExpression is a function expression? It's declaration is hoisted and set to undefined in the 'creation' phase.";
};

fnExpression();
topLevelFn();`
}

function moreClosures () {
  return `var e = 10;
function sum(a){
  return function(b){
    return function(c){
      return function(d){
        return a + b + c + d + e;
      }
    }
  }
}

sum(1)(2)(3)(4); // log 20`
}

function pseudoclassical () {
  return `function Person (name, age) {
  this.name = name;
  this.age = age;
}

Person.prototype.sayName = function () {
  alert(this.name);
};

var me = new Person('Tyler', 28);

me.sayName();`
}

function complexClosures () {
  return `var counter = (function() {
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

counter.value();
counter.increment();
counter.increment();
counter.value();
counter.decrement();
counter.value();`
}

function thisKeyword () {
  return `var user = {
  name: 'Tyler',
  age: 28,
  handle: '@tylermcginnis',
  greet: function () {
    console.log('Hello! My name is ', this.name);
  }
};

user.greet();`
}

const snippets = {
  simpleClosure: simpleClosure(),
  complexClosures: complexClosures(),
  bubbleSort: bubbleSort(),
  scopeChain: scopeChain(),
  moreClosures: moreClosures(),
  pseudoclassical: pseudoclassical(),
  thisKeyword: thisKeyword()
}

export default snippets