import React, { Component } from 'react'
import styled from 'styled-components'
import get from 'lodash.get'
import queryString from 'query-string'
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
import { getFlatColors, getRandomElement, addQuotesToKeys, removeQuotesFromKeys } from '../utils/index'
import { Controlled as CodeMirror } from 'react-codemirror2'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/material.css'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/addon/selection/mark-selection.js'
import ExecutionContext from './ExecutionContext'
import Welcome from './Welcome'
import ButtonPanel from './ButtonPanel'
import snippets from '../utils/snippets'

const Container = styled.div`
  display: flex;
`

const LeftContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh
  width: 50vw;
`

const RightContainer = styled.div`
  width: 50vw;
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
  componentDidMount() {
    const { code = '' } = queryString.parse(this.props.location.search)
    this.myInterpreter = getInterpreter(code)
    this.setState({code})
  }
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

    if (typeof start === 'undefined' || typeof end === 'undefined') {
      return
    }

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
    this.props.history.push('/javascript-visualizer')
  }
  handleSerialize = () => {
    this.props.history.push(
      '/javascript-visualizer/?' + queryString.stringify({ code: this.state.code})
    )
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
  updateScope = (scope, scopeName, forThis) => {
    const globalsToIgnore = getGlobalsToIgnore()

    const stackItem = this.state.stack.find((s) => s.name === scopeName)
    if (stackItem && this.closuresToCreate[scopeName] === true
    && !forThis) {
      return true
    }

    if (forThis) {
      const { key, identifier, value } = forThis

      return this.setState(({ scopes }) => {
        const oldThis = JSON.parse(addQuotesToKeys(scopes[scopeName].this))

        const newThis = removeQuotesFromKeys(JSON.stringify({
          ...oldThis,
          [key]: identifier ? scope.properties[identifier].data : value
        }, null, 2))

        return {
          scopes: {
            ...scopes,
            [scopeName]: {
              ...scopes[scopeName],
              this: newThis
            }
          }
        }
      })
    }

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
          ...scopeArgs,
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
  selectCodeSnippet = (type) => {
    const code = snippets[type]
    this.setState({
      code
    })

    this.myInterpreter = getInterpreter(code)
  }
  handleStep = () => {
    const highlightStack = this.myInterpreter.stateStack
    const anonCount = this.getAnonCount() // todo
    const scopeName = getScopeName(highlightStack, anonCount)
    const highlighted = highlightStack[highlightStack.length - 1]
    const scope = this.myInterpreter.getScope()

    this.highlightCode(highlighted.node)
    this.setState({currentOperation: highlighted.node.type})

    if (this.createdExecutionContexts[scopeName] === true) {
      this.toExecutionPhase(scopeName)
    }

    if (this.state.stack.length === 0) {
      this.setState(getFirstStepState())
      this.createdExecutionContexts.Global = true
    }

    if (createNewExecutionContext(this.previousHighlight.node, highlighted.node)) {

      this.newExecutionContext({
        name: scopeName,
        scope,
        thisExpression: highlighted.thisExpression,
      })
    }

    if (endExecutionContext(highlighted)) {
      this.handleEndExecutionContext(scopeName)
    }

    this.updateScope(
      scope,
      scopeName,
      get(highlighted, 'node.type') === 'AssignmentExpression'
        ? get(highlighted, 'node.left.object.type') === 'ThisExpression'
          ? {
              key: get(highlighted, 'node.left.property.name', null),
              identifier: get(highlighted, 'node.right.name', null),
              value: get(highlighted, 'node.right.type') === 'FunctionExpression'
                ? "fn()"
                : get(highlighted, 'node.right.value', null),
            }
          : null
        : null
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
  render() {
    const { code, currentOperation, stack, scopes, running, disableButtons } = this.state

    return (
      <Container>
        <LeftContainer>
          <ButtonPanel
            currentOperation={currentOperation}
            step={this.handleStep}
            running={running}
            run={this.handleRun}
            clear={(e) => this.handleClear(true)}
            serialize={this.handleSerialize}
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
        </LeftContainer>
        <RightContainer>
        {stack.length === 0
          ? <Welcome selectCodeSnippet={this.selectCodeSnippet} />
          : <ExecutionContext
              context={stack[0].name}
              phase={stack[0].phase}
              closure={stack[0].closure}
              scopes={scopes}
              remainingStack={stack.slice(1)}
              getColor={this.getColor}
            />}
          </RightContainer>
      </Container>
    )
  }
}

export default App
