import React, { Component } from 'react'
import {
  getInterpreter,
  formatValue,
  createNewExecutionContext,
  endExecutionContext,
  getCalleeName,
  getScopeName,
  getFirstStepState,
  argToString,
  getGlobalsToIgnore,
} from '../utils/parser'
import { formatCharLoc } from '../utils/editor'
import { getFlatColors, getRandomElement } from '../utils/index'
import { Controlled as CodeMirror } from 'react-codemirror2'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/material.css'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/addon/selection/mark-selection.js'
import ExecutionContext from './ExecutionContext'

/*
  Todos
    closures
    handleRun speed from UI
    Step through code options
    Highlight errors
    Don't crash on errors in code
    Creation phase vs execution phase
    get example code with two greets working
*/


/*
  this.myInterpreter.getScope()
  this.myInterpreter.getValueFromScope('varName')

  this.myInterpreter.getScope() === this.myInterpreter.stateStack[this.myInterpreter.stateStack.length - 1].scope

  Get this -> stack[stack.length - 1].thisExpression.properties

  All methods - Object.getPrototypeOf(this.myInterpreter)
*/

class App extends Component {
  state = {
    code: ``,
    highlighted: {},
    scopes: {},
    stack: [],
  }
  myInterpreter = getInterpreter('')
  chosenColors = []
  markers = []
  previousHighlight = { node: { type: null } }
  clearMarkers = () => this.markers.forEach((m) => m.clear())
  getColor = () => {
    const flatColors = getFlatColors()

    const availableColors = Object.keys(flatColors)
      .filter((color) => !this.chosenColors.includes(color))

    const randomColor = getRandomElement(availableColors)

    this.chosenColors.push(randomColor)

    return flatColors[randomColor]
  }
  highlightCode = (stack) => {
    if (stack.length) {
      const node = stack[stack.length - 1].node
      const start = node.start
      const end = node.end

      this.clearMarkers()

      this.markers.push(
        this.cm.editor.doc.markText(
          formatCharLoc(this.state.code, start),
          formatCharLoc(this.state.code, end),
          {className: "editor-highlighted-background"}
        )
      )
    }
  }
  handleRun = (e, speed = 1000) => {
    const interval = window.setInterval(() => {
      const state = this.myInterpreter.stateStack[0]

      if (state.done === true) {
        this.clearMarkers()
        return window.clearInterval(interval)
      }

      this.handleStep()
    }, speed)
  }
  handleNoVarDeclaration = ({ left, right, }) => {
    const identifier = left.name
    const value = formatValue(right.type, right)

    this.setState(({ scopes }) => ({
      scopes: {
        ...scopes,
        'Global': {
          ...scopes.Global,
          [identifier]: value,
        }
      }
    }))
  }
  handleVariableDeclaration = (scopeName, node) => {
    if (node.declarations.length > 1) {
      console.log('Check this')
    }

    const { init, id } = node.declarations[0]
    const identifier = id.name

    const value = formatValue(init.type, init)

    this.setState(({ scopes }) => ({
      scopes: {
        ...scopes,
        [scopeName]: {
          ...scopes[scopeName],
          [identifier]: value
        }
      }
    }))
  }
  handleFunctionDeclaration = (scopeName, node) => {
    const { id } = node
    const identifier = id.name

    this.setState(({ scopes }) => ({
      scopes: {
        ...scopes,
        [scopeName]: {
          ...scopes[scopeName],
          [identifier]: 'fn()'
        }
      }
    }))
  }
  updateScope = (scope, scopeName) => {
    const globalsToIgnore = getGlobalsToIgnore()

    const scopeArgs = Object.keys(scope.properties)
      .filter((p) => p !== 'arguments')
      .filter((p) => !globalsToIgnore[p])
      .reduce((result, key) => {
        result[key] = argToString(scope.properties[key], key, true)
        return result
      }, {})

    this.setState(({ scopes }) => ({
      scopes: {
        ...scopes,
        [scopeName]: {
          ...scopes[scopeName],
          ...scopeArgs
        }
      }
    }))
  }
  newExecutionContext = ({ name, scope, thisExpression }) => {
    this.setState(({ stack, scopes }) => {
      return {
        stack: stack.concat([{
          name,
          closure: false,
        }]),
        scopes: {
          ...scopes,
          [name]: {
            arguments: formatValue('Arguments', scope.properties.arguments.properties),
            this: formatValue('thisExpression', thisExpression),
          }
        }
      }
    })

    this.updateScope(scope, name)
  }
  handleEndExecutionContext = (name) => {
    if (name === 'Global') return

    this.setState(({ stack }) => ({
      stack: stack.filter((s) => s.name !== name),
    }))
  }
  handleNewVariable = (node, scopeName) => {
    if (node.operator === '=') {
      this.handleNoVarDeclaration(node)
    } else if (node.type === 'VariableDeclaration') {
      this.handleVariableDeclaration(scopeName, node)
    } else if (node.type === 'FunctionDeclaration') {
      this.handleFunctionDeclaration(scopeName, node)
    }
  }
  handleStep = () => {
    const highlightStack = this.myInterpreter.stateStack

    this.highlightCode(highlightStack)

    const highlighted = highlightStack[highlightStack.length - 1]
    this.setState({highlighted: highlighted.node})

    if (this.state.stack.length === 0) {
      this.setState(getFirstStepState())
    }

    if (createNewExecutionContext(this.previousHighlight, highlighted)) {
      this.newExecutionContext({
        name: getCalleeName(this.previousHighlight.node.callee),
        scope: highlighted.scope,
        thisExpression: highlighted.thisExpression,
      })
    }

    if (endExecutionContext(highlighted)) {
      this.handleEndExecutionContext(getCalleeName(highlighted.node.callee))
    }

    const scopeName = getScopeName(highlightStack)

    this.handleNewVariable(
      highlighted.node,
      scopeName,
    )

    // todo Dont' call this every time.
    this.updateScope(
      this.myInterpreter.getScope(),
      scopeName,
    )

    this.previousHighlight = highlighted

    try {
      var ok = this.myInterpreter.step()
    } finally {
      if (!ok) {
        // No more code to step through
        this.markers.forEach((m) => m.clear())
      }
    }
  }
  render() {
    const { code, highlighted, stack, scopes } = this.state

    return (
      <div>
        <button onClick={this.handleStep}>STEP</button>
        <button onClick={this.handleRun}>SLOW RUN</button>
        <CodeMirror
          ref={(cm) => this.cm = cm}
          value={code}
          options={{
            mode: 'javascript',
            theme: 'material',
            lineNumbers: true,
          }}
          onBeforeChange={(editor, data, code) => {
            this.setState({code})
            this.myInterpreter = getInterpreter(code)
          }}
          onFocus={() => {
            this.setState({
              scopes: {},
              stack: []
            })
          }}
        />
        <pre>{JSON.stringify(highlighted.type, null, 2) }</pre>
        {stack.length === 0
          ? null
          : <ExecutionContext
              context={stack[0].name}
              scopes={scopes}
              remainingStack={stack.slice(1)}
              getColor={this.getColor}
            />}
      </div>
    )
  }
}

export default App
