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
    Update (UI) code as it executes
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
  handleNewExecutionContext = ({ name, scope, thisExpression }) => {
    const scopeArgs = Object.keys(scope.properties)
      .filter((p) => p !== 'arguments')
      .reduce((result, key) => {
        result[key] = argToString(scope.properties[key], key, true)
        return result
      }, {})

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
            ...scopeArgs
          }
        }
      }
    })
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
      this.handleNewExecutionContext({
        name: getCalleeName(this.previousHighlight.node.callee),
        scope: highlighted.scope,
        thisExpression: highlighted.thisExpression,
      })
    }

    if (endExecutionContext(highlighted)) {
      this.handleEndExecutionContext(getCalleeName(highlighted.node.callee))
    }

    this.handleNewVariable(
      highlighted.node,
      getScopeName(highlightStack)
    )

    // if (highlighted.node.type === 'AssignmentExpression') {
    //   const scope = this.myInterpreter.getScope().properties

    //   console.log('Something (Maybe) Changed!')
    //   console.log('Highlight', highlighted.node)
    //   console.log('ScopeName', scopeName)
    //   console.log('Scope', scope)

    //   Object.keys(scope)
    //     .filter((v) => v !== 'arguments')
    //     .forEach((v) => {
    //       console.log('Name: ', v)
    //       console.log('Val: ', scope[v].data)
    //     })
    // }

    // console.log('\n')
    // console.log('*******')
    // console.log('SCOPE', this.myInterpreter.getScope().properties)
    // highlightStack.forEach((s) => console.log(s.node.type))
    // console.log(highlighted)
    // console.log('*******')
    // console.log('\n')

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
        {/*<pre>{JSON.stringify(highlighted, null, 2) }</pre>*/}
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
