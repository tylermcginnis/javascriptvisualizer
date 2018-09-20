import React, { Component } from 'react'
import styled from 'styled-components'
import {
  getInterpreter,
  formatValue,
  createNewExecutionContext,
  endExecutionContext,
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
import ButtonPanel from './ButtonPanel'

/*
  Todos
    closures
    Highlight errors
    Don't crash on errors in code
    all repo issues
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

  @media (max-width: 700px) {
    height: auto;
  }
`

const Body = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;

  > * {
    width: 50% !important;
    height: 100% !important;
    overflow: scroll;
  }

  @media (max-width: 700px) {
    flex-direction: column-reverse;

    > * {
      width: 100% !important;
      height: auto !important;
      overflow: auto !important;
    }
  }
`

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
    disableButtons: false,
    runningSpeed: 800
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
  highlightCode = (node) => {
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
  handleRun = (e) => {
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
    }, this.state.runningSpeed)
  }
  handlePause = () => {
    this.setState({
      running: false
    })

    window.clearInterval(this.runInterval)
  }
  changeRunSpeed =(speed) => {
    const speedMap = {
      0: 2000,
      1: 1800,
      2: 1600,
      3: 1200,
      4: 1000,
      5: 800,
      6: 600,
      7: 400,
      8: 300,
      9: 200,
      10: 100,
    }

    this.setState({
      runningSpeed: speedMap[speed]
    })

    if (this.state.running === true) {
      window.clearInterval(this.runInterval)

      this.runInterval = window.setInterval(() => {
        const state = this.myInterpreter.stateStack[0]

        if (state.done === true) {
          this.clearMarkers()
          return window.clearInterval(this.runInterval)
        }

        this.handleStep()
      }, speedMap[speed])
    }
  }
  updateScope = (scope, scopeName) => {
    const globalsToIgnore = getGlobalsToIgnore()

    const stackItem = this.state.stack.find((s) => s.name === scopeName)
    if (stackItem && this.closuresToCreate[scopeName] === true
    ) {
      return stackItem.closure === true
    }

    console.log('Scope', scope)

    if (scope) {
      const scopeArgs = Object.keys(scope.properties)
        .filter((p) => p !== 'arguments')
        .filter((p) => !globalsToIgnore[p])
        .reduce((result, key) => {
          result[key] = argToString(scope.properties[key], key, true)
          return result
        }, {})

      console.log('SCOPEARGS', scopeArgs)

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

    console.log('SCOPENAME', scopeName)

    const highlighted = highlightStack[highlightStack.length - 1]

    this.highlightCode(highlighted.node)
    this.setState({currentOperation: highlighted.node.type})

    if (this.createdExecutionContexts[scopeName] === true) {
      this.toExecutionPhase(scopeName)
    }

    if (this.state.stack.length === 0) {
      this.setState(getFirstStepState())
      this.createdExecutionContexts.Global = true
    }

    if (createNewExecutionContext(this.previousHighlight, highlighted)) {
      this.newExecutionContext({
        name: scopeName,
        scope: highlighted.scope,
        thisExpression: highlighted.thisExpression,
      })
    }

    if (endExecutionContext(highlighted)) {
      this.handleEndExecutionContext(scopeName)
    }

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
        this.setState(({ stack }) => ({
          stack: stack.filter((s) => s.closure !== true),
          disableButtons: true,
          currentOperation: 'Finished'
        }))
      }
    }
  }
  handleClear = (clearCode = true) => {
    this.setState(({ code }) => ({
      code: clearCode === true ? '' : code,
      currentOperation: null,
      scopes: {},
      stack: [],
      disableButtons: false,
    }))

    this.myInterpreter = getInterpreter(this.state.code)
    this.chosenColors = []
    this.markers = []
    this.previousHighlight = { node: { type: null } }
    this.createdExecutionContexts = {}
    this.closuresToCreate = {}
  }
  selectCodeSnipet = (type) => {
    console.log('AY', type) // todo
  }
  render() {
    const { code, currentOperation, stack, scopes, running, disableButtons } = this.state

    return (
      <Container>
        <Body>
          <div>
            <ButtonPanel
              currentOperation={currentOperation}
              step={this.handleStep}
              running={running}
              run={this.handleRun}
              clear={(e) => this.handleClear(true)}
              pause={this.handlePause}
              disabled={disableButtons}
              onStep={this.changeRunSpeed}
            />
            <CodeMirror
              ref={(cm) => this.cm = cm}
              value={code}
              options={{
                mode: 'javascript',
                theme: 'material',
                lineNumbers: true,
                lineWrapping: true,
              }}
              onBeforeChange={(editor, data, code) => {
                if (code === '') {
                  this.handleClear(true)
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
            ? <Welcome selectCodeSnipet={this.selectCodeSnipet} />
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
