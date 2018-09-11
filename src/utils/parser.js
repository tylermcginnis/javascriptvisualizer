import * as esprima from 'esprima'

function parseVariableDeclaration (declaration) {
  if (declaration.declarations.length !== 1) {
    console.log('Not handling this case!', declaration.declarations)
  }

  const { id, init, loc } = declaration.declarations[0]

  if (!init || !declaration || !id) {
    return null
  }

  return {
    identifier: id.name,
    position: loc,
    value: init.value,
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
  if (exp && exp.operator === '=') {
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

function parseAST (ast) {
  let defaultValues = [
    {identifier: 'this', type: 'object', value: 'window'},
    {identifier: 'window', type: 'object', value: 'global'},
  ]

  const parsedAST = ast.body.map((declaration) =>
    parseDeclaration(declaration)
  ).filter(Boolean)

  return defaultValues.concat(parsedAST).filter(Boolean)
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
    console.log('AST', ast)
  } catch(e) {
    console.log('ERRROR', e)
  }

  return parseAST(ast)
}