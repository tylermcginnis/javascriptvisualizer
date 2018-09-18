import React, { Component } from 'react'
import styled from 'styled-components'
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
import Welcome from './Welcome'
import Prompt from './Prompt'

/*
  Todos
    closures
    handleRun speed from UI
    Highlight errors
    Don't crash on errors in code
    get example code with two greets working

  Stretch
    Step through code options
*/


/*
  this.myInterpreter.getScope()
  this.myInterpreter.getValueFromScope('varName')

  this.myInterpreter.getScope() === this.myInterpreter.stateStack[this.myInterpreter.stateStack.length - 1].scope

  Get this -> stack[stack.length - 1].thisExpression.properties

  All methods - Object.getPrototypeOf(this.myInterpreter)
*/

const Container = styled.div`
  height: 100%;
  width: 100%;
`

const Body = styled.div`
  display: flex;
  height: 100%;
  width: 100%;

  > * {
    width: 50% !important;
    height: 100% !important;
  }
`

const ButtonPanelContainer = styled.div`
  background: #333333;
  height: 8%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const Buttons = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  align-self: flex-start;
  height: 65%;

  > button {
    border: none;
    background: none;
    color: #919191;
    font-size: 20px;
  }

  > button:hover {
    color: #fff;
    cursor: pointer;
  }
`

const Status = styled.div`
  background: #dfe1e9;
  height: 35%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 300
  font-size: 14px;

  > span {
    font-weight: 500;
    margin-left: 10px;
  }
`

function ButtonPanel ({ step, run, clear, operation, running, pause }) {
  return (
    <ButtonPanelContainer>
      <Buttons>
        <button onClick={step}>Step</button>
        {running === true
          ? <button onClick={pause}>Pause</button>
          : <button onClick={run}>Run</button>}
        <button onClick={clear}>Clear</button>
        <button>Slider</button>
      </Buttons>
      <Status>
        Current Operation: <span>{operation}</span>
      </Status>
    </ButtonPanelContainer>
  )
}

function isFunction (type) {
  return type === 'FunctionDeclaration' || type === 'FunctionExpression'
}

class App extends Component {
  state = {
    code: ``,
    highlighted: {},
    scopes: {},
    stack: [],
    running: false,
  }
  myInterpreter = getInterpreter('')
  chosenColors = []
  markers = []
  previousHighlight = { node: { type: null } }
  createdExecutionContexts = {}
  closuresToCreate = {}
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
    this.setState({
      running: true
    })

    this.runInterval = window.setInterval(() => {
      const state = this.myInterpreter.stateStack[0]

      if (state.done === true) {
        this.clearMarkers()
        return window.clearInterval(this.runInterval)
      }

      this.handleStep()
    }, speed)
  }
  handlePause = () => {
    this.setState({
      running: false
    })

    window.clearInterval(this.runInterval)
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
          [identifier]: value,
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
    var that = this
    // console.log('Scope', scope)
    // console.log('scopeName', scopeName)

    const stackItem = this.state.stack.find((s) => s.name === scopeName)
    if (
        stackItem &&
        stackItem.closure === true ||
        this.closuresToCreate[scopeName] === true
    ) {
      return
    }

    if (scope) {
      const scopeArgs = Object.keys(scope.properties)
        .filter((p) => p !== 'arguments')
        .filter((p) => !globalsToIgnore[p])
        .reduce((result, key) => {
          result[key] = argToString(scope.properties[key], key, true)
          return result
        }, {})

      console.log('ABOUT TO SET NEW SCOPE', scopeName)
      this.setState(({ scopes }) => ({
        scopes: {
          ...scopes,
          [scopeName]: {
            ...scopes[scopeName],
            ...scopeArgs,
          }
        }
      }))
    }
  }
  newExecutionContext = ({ name, scope, thisExpression }) => {
    if (!scope) return

    this.setState(({ stack, scopes }) => {
      return {
        stack: stack.concat([{
          name,
          closure: false,
          phase: 'Creation'
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

    this.createdExecutionContexts[name] = true

    this.updateScope(scope, name)
  }
  handleEndExecutionContext = (name) => {
    if (name === 'Global') return

    const stack = this.state.stack.filter((s) =>
      s.name !== name || this.closuresToCreate[name] === true
    )

    this.setState({ stack })

    this.createdExecutionContexts[name] = false
  }
  toExecutionPhase = (scopeName) => {
    this.setState(({ stack }) => ({
      stack: stack.map((pancake) => {
        return pancake.name === scopeName
          ? {
            ...pancake,
            phase: 'Execution'
          }
          : pancake
      })
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
  checkClosure = (stackLength, highlighted, scopeName) => {
    // todo figure out a way to only create a closure if there's a reference
    // to the fn still

    if (stackLength > 1 && isFunction(highlighted.node.type)) {
      this.closuresToCreate[scopeName] = true
    }

    if (highlighted.node.type === 'CallExpression' && highlighted.doneExec_) {
      const name = highlighted.node.callee.name || `anonymous_${this.getAnonCount()}`

      if (this.closuresToCreate[name] === true) {
        this.setState(({ stack }) => ({
          stack: stack.map((s) => s.name !== name
            ? s
            : { ...s, closure: true }
          )
        }))

        delete this.closuresToCreate[name]
      }
    }
  }
  getAnonCount = () => {
    return this.state.stack.reduce((count, item) => {
      if (item.name.includes('anonymous') && item.closure !== true) {
        return count + 1
      }

      return count
    }, 0)
  }
  handleStep = () => {
    const highlightStack = this.myInterpreter.stateStack

    const anonCount = this.getAnonCount()

    const scopeName = getScopeName(highlightStack, anonCount)

    this.highlightCode(highlightStack)

    const highlighted = highlightStack[highlightStack.length - 1]
    this.setState({highlighted: highlighted.node})

    if (this.createdExecutionContexts[scopeName] === true) {
      this.toExecutionPhase(scopeName)
    }

    if (this.state.stack.length === 0) {
      this.setState(getFirstStepState())
      this.createdExecutionContexts.Global = true
    }

    if (createNewExecutionContext(this.previousHighlight, highlighted)) {
      this.newExecutionContext({
        name: getCalleeName(this.previousHighlight.node.callee, anonCount + 1),
        scope: highlighted.scope,
        thisExpression: highlighted.thisExpression,
      })
    }

    if (endExecutionContext(highlighted)) {
      this.handleEndExecutionContext(getCalleeName(highlighted.node.callee, anonCount))
    }

    this.handleNewVariable(
      highlighted.node,
      scopeName,
    )

    // todo Dont' call this every time.
    this.updateScope(
      this.myInterpreter.getScope(),
      scopeName,
    )

    this.checkClosure(
      this.state.stack.length,
      highlighted,
      scopeName
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
  handleClear = (e, clearCode = true) => {
    this.setState(({ code }) => ({
      code: clearCode === true ? '' : code,
      highlighted: {},
      scopes: {},
      stack: [],
    }))

    this.myInterpreter = getInterpreter(this.state.code)
    this.chosenColors = []
    this.markers = []
    this.previousHighlight = { node: { type: null } }
    this.createdExecutionContexts = {}
    this.closuresToCreate = {}
  }
  render() {
    const { code, highlighted, stack, scopes, running } = this.state

    return (
      <Container>
        <Body>
          <div>
            <ButtonPanel
              operation={highlighted.type || 'NA'}
              step={this.handleStep}
              running={running}
              run={this.handleRun}
              clear={this.handleClear}
              pause={this.handlePause}
            />
            <CodeMirror
              ref={(cm) => this.cm = cm}
              value={code}
              options={{
                mode: 'javascript',
                theme: 'material',
                lineNumbers: true,
              }}
              onBeforeChange={(editor, data, code) => {
                if (code === '') {
                  this.handleClear()
                } else {
                  this.setState({code})
                  this.myInterpreter = getInterpreter(code)
                }
              }}
              onPaste={() => {
                this.handleClear(false)
              }}
            />
          </div>
          {stack.length === 0
            ? <Welcome />
            : <ExecutionContext
                context={stack[0].name}
                phase={stack[0].phase}
                closure={stack[0].closure}
                scopes={scopes}
                remainingStack={stack.slice(1)}
                getColor={this.getColor}
              />}
        </Body>
      </Container>
    )
  }
}

export default App
