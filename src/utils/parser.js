import * as esprima from 'esprima'
import deepfilter from 'deep-filter'

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

function parseVariableDeclaration (declaration) {
  if (declaration.declarations.length !== 1) {
    console.log('Not handling this case: ', declaration.declarations)
  }

  const { id, init, loc } = declaration.declarations[0]

  if (!init || !declaration || !id) {
    return null
  }

  if (init.type === 'FunctionExpression') {
    return parseFunctionDeclaration({
      ...init,
      id,
    })
  }

  let value
  if (init.type === 'Literal') {
    value = init.value
  } else if (init.type === 'ObjectExpression') {
    value = objectExpressionToString(init.properties)
  } else if (init.type === 'ArrayExpression') {
    value = arrayExpressionToString(init.elements)
  }

  return {
    identifier: id.name,
    position: loc,
    value: value,
    type: typeof init.value,
    kind: declaration.kind
  }
}

function parseFunctionDeclaration ({ body, id, loc, params }) {
  // todo. arguments
  // todo 'this'

  if (!id || !body.body) {
    return null
  }

  return {
    identifier: id.name,
    position: loc,
    value: 'fn()',
    type: 'function',
    variables: body.body.map((declaration) =>
      parseDeclaration(declaration)
    ).filter(Boolean)
  }
}

function parseExpressionStatement (expression) {
  const exp = expression.expression
  if (exp && exp.type === "AssignmentExpression") {
    return {
      identifier: exp.left.name,
      value: exp.right.value,
      type: typeof exp.right.value,
      position: null, // doesn't give it to me?
      kind: 'global'
    }
  }

  return null
}

function parseDeclaration (declaration) {
  if (declaration.type === 'VariableDeclaration') {
    return parseVariableDeclaration(declaration)
  } else if (declaration.type === 'FunctionDeclaration') {
    return parseFunctionDeclaration(declaration)
  } else if (declaration.type === 'ExpressionStatement') {
    return parseExpressionStatement(declaration)
  } else {
    return null
  }
}

function getAllGlobals (declarations) {
  let results = []

  for (let i = 0; i < declarations.length; i++) {
    if (declarations[i].variables) {
      results = results.concat(getAllGlobals(declarations[i].variables))
    } else {
      if (declarations[i].kind === 'global') {
        results = results.concat(declarations[i])
      }
    }
  }

  return results
}

function isEmptyObject (value) {
  return Object.keys(value).length === 0 && value.constructor === Object
}

function removeAllGlobals (declarations) {
  const removedGlobals = deepfilter(declarations, (value, prop, subject) => {
    return subject.kind !== 'global'
  })

  // instead of removing, deepfilter sets all 'kind === global' to empty objects.
  // this gets rid of those
  return deepfilter(removedGlobals, (value, prop, subject) => {
    if (typeof value !== 'object') {
      return true
    }

    return !isEmptyObject(value)
  })
}

function hoistGlobals (declarations) {
  const allGlobals = getAllGlobals(declarations)
  const withoutGlobals = removeAllGlobals(declarations)

  return [
    ...allGlobals,
    ...withoutGlobals,
  ]
}

function parseAST (ast) {
  let defaultValues = [
    {identifier: 'window', type: 'object', value: 'global object'},
    {identifier: 'this', type: 'object', value: 'window'},
  ]



  const parsedDeclarations = ast.body.map((declaration) =>
    parseDeclaration(declaration))
  .filter(Boolean)

  return defaultValues.concat(hoistGlobals(parsedDeclarations)).filter(Boolean)
}

let ast = {
  body: [],
  sourceType: 'script',
  type: 'Program'
}

export function getParsedAST (code) {
  try {
    let placeholder = esprima.parse(code)
    ast = placeholder
    eval(code)
  } catch(e) {
    console.log('Code not valid: ', e)
  }

  return parseAST(ast)
}