import Interpreter from './interpreter';
import get from 'lodash.get'

const globalToIgnore = {
  "Infinity": true,
  "NaN": true,
  "undefined": true,
  "window": true,
  "self": true,
  "Function": true,
  "Object": true,
  "Array": true,
  "Number": true,
  "String": true,
  "Boolean": true,
  "Date": true,
  "Math": true,
  "RegExp": true,
  "JSON": true,
  "Error": true,
  "EvalError": true,
  "RangeError": true,
  "ReferenceError": true,
  "SyntaxError": true,
  "TypeError": true,
  "URIError": true,
  "isNaN": true,
  "isFinite": true,
  "parseFloat": true,
  "parseInt": true,
  "eval": true,
  "escape": true,
  "unescape": true,
  "decodeURI": true,
  "decodeURIComponent": true,
  "encodeURI": true,
  "encodeURIComponent": true,
  "alert": true,
  "console": true,
}

const arrayMethodsToIgnore = {
  every: true,
  fill: true,
  filter: true,
  find: true,
  findIndex: true,
  flat: true,
  flatMap: true,
  forEach: true,
  map: true,
  reduce: true,
  reduceRight: true,
  reverse: true,
  some: true,
  sort: true,
}

export function getGlobalsToIgnore () {
  return globalToIgnore
}

function objectExpressionToString (properties) {
  if (properties.length === 0) {
    return '{}'
  }

  let str = '{ '

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i]

    str += prop.key.name + ': '

    if (prop.value.type === 'FunctionExpression') {
      str += 'fn()'
    } else if (prop.value.type === 'ArrayExpression') {
      str += arrayExpressionToString(prop.value.elements)
    } else if (prop.value.type === 'ObjectExpression') {
      str += objectExpressionToString(prop.value.properties)
    } else {
      str += prop.value.value
    }

    str += (i === properties.length - 1 ? '' : ', ')
  }

  return str + " }"
}

function arrayExpressionToString (elements) {
  if (elements.length === 0) {
    return '[]'
  }

  let str = '['

  for (let i = 0; i < elements.length; i++) {
    const ele = elements[i]

    if (ele.type === 'FunctionExpression') {
      str += 'fn()'
    } else if (ele.type === 'ArrayExpression') {
      str += arrayExpressionToString(ele.elements)
    } else if (ele.type === 'ObjectExpression') {
      str += objectExpressionToString(ele.properties)
    } else {
      str += ele.value
    }

    str += (i === elements.length - 1 ? '' : ', ')
  }

  return str + ']'
}

export function argToString (arg, key, isArray) {
  if (arg.type === 'string') {
    return isArray ? `"${arg.data}"` : `${key}: "${arg.data}"`
  } else if (arg.type === 'undefined') {
    return isArray ? `undefined` : `${key}: undefined`
  } else if (arg.type === 'function') {
    return isArray ? 'fn()' : `${key}: fn()`
  } else if (arg.type === 'boolean' || arg.type === 'number') {
    return isArray ? arg.data : `${key}: ${arg.data}`
  } else {
    return isArray
      ? argumentsToString(arg.properties, typeof arg.length !== 'undefined', false)
      : `${key}: ${argumentsToString(arg.properties, typeof arg.length !== 'undefined', false)}`
  }

}

export function argumentsToString (args, isArray = false, includeLength = true) {
  const length = Object.keys(args).length

  if (length === 0) {
    return includeLength === true ? '{ length: 0 }' : '{}'
  }

  let str = isArray === true
    ? '['
    : '{ '

  let count = 0

  for (let key in args) {
    count++
    const arg = args[key]
    str += argToString(arg, key, isArray)
    str += (count === length  ? '' : ', ')
  }

  const lengthString = includeLength === false ? ' }' : `, length: ${length} }`
  const appendage = isArray === true ? ']' : lengthString

  return str + appendage
}

export function formatValue (type, init) {
  if (get(init, 'properties.EvalError')) {
    return 'window'
  }

  if (type === 'FunctionExpression') {
    return 'fn()'
  } else if (type === 'ArrayExpression') {
    return arrayExpressionToString(init.elements)
  } else if (type === 'ObjectExpression') {
    return objectExpressionToString(init.properties)
  } else if (type === 'Arguments') {
    return argumentsToString(init)
  } else if (type === 'thisExpression') {
    return argumentsToString(init.properties, false, false)
  } else {
    return init.value
  }
}

export function createNewExecutionContext (prev, current) {
  if (prev.type === 'CallExpression' || prev.type === 'NewExpression') {
    if (current.type === 'BlockStatement') {
      if (arrayMethodsToIgnore[get(prev, 'callee.property.name')]) {
        return false
      }

      if (get(prev, 'callee.object.type') === 'ArrayExpression') {
        return false
      }

      return true
    }
  }

  return false
}

export function endExecutionContext ({ node, doneCallee_, doneExec_ }) {
  if (node.type === 'CallExpression') {
    if (node.callee && node.callee.object && node.callee.object.name === 'console') {
      return false
    }

    return doneCallee_ === true && doneExec_ === true
  }
}

export function getScopeName (stack) {
  for (let i = stack.length - 1; i >= 0; i--) {
    const state = stack[i]

    if (state._fn) {
      const { name, start, end } = state._fn

      return {
        scopeName: name,
        scopeHash: name + start + end
      }
    }
  }

  return {
    scopeName: 'Global',
    scopeHash: 'global',
  }
}

export function getFirstStepState () {
  return {
    stack: [{
      name: 'Global',
      hash: 'global',
      closure: false,
      phase: 'Creation'
    }],
    scopes: {
      'global': {
        'window': 'global object',
        'this': 'window',
      }
    }
  }
}

function interpreterShims (interpreter, scope) {
  interpreter.setProperty(
    scope,
    'alert',
    interpreter.createNativeFunction((text = '') => alert(text))
  )

  const obj = interpreter.createObject(interpreter.OBJECT)

  interpreter.setProperty(
    scope,
    'console',
    obj
  )

  interpreter.setProperty(
    obj,
    'log',
    interpreter.createNativeFunction(
      (text = '') => interpreter.createPrimitive(console.log(text.toString()))
    )
  )
}

let MyInterpreter
export function getInterpreter(code) {
  try {
    let placeholder = new Interpreter(code, interpreterShims)
    MyInterpreter = placeholder
  } catch(e) {
    // Thrown if code is not valid
  }

  return MyInterpreter
}