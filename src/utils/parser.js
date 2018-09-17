import Interpreter from 'js-interpreter';

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
  console.log('arg', arg)
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
    return includeLength === true ? '{ length: 0 }' : ''
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
  if (type === 'FunctionExpression') {
    return 'fn()'
  } else if (type === 'ArrayExpression') {
    return arrayExpressionToString(init.elements)
  } else if (type === 'ObjectExpression') {
    return objectExpressionToString(init.properties)
  } else if (type === 'Arguments') {
    return argumentsToString(init)
  } else if (type === 'thisExpression') {
    return init.properties.EvalError && init.properties.NaN
      ? 'window'
      : argumentsToString(init.properties, false, false)
  } else {
    return init.value
  }
}

export function createNewExecutionContext (previousHighlight, currentHighlight) {
  return previousHighlight.node.type === 'CallExpression' && currentHighlight.node.type === 'BlockStatement'
}

export function endExecutionContext (currentHighlight) {
  if (currentHighlight.node.type === 'CallExpression') {
    if (currentHighlight.doneCallee_ === true && currentHighlight.doneExec_ === true) {
      return true
    }
  }

  return false
}

export function getCalleeName (callee) {
  if (callee.name) {
    return callee.name
  } else if (callee.property) {
    return callee.property.name
  } else {
    return 'Not handling this case 🙈'
  }
}

export function getScopeName (stack) {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i].node.callee) {
      return getCalleeName(stack[i].node.callee)
    }
  }

  return 'Global' // needed?
}

export function getFirstStepState () {
  return {
    stack: [{
      name: 'Global',
      closure: false
    }],
    scopes: {
      'Global': {
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