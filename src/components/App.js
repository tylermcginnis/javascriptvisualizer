import React, { Component } from 'react'
import styled from 'styled-components'
import get from 'lodash.get'
import omit from 'lodash.omit'
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
  overflow: scroll;
`

const RightContainer = styled.div`
  width: 50vw;
  height: 100vh;
  overflow: scroll;
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
    this.handlePause()

    // SHIPIT
    document.getElementById('execution-context')
      .style = `background: #fff`
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
  setScopeVariables = (scope, scopeHash, forThis) => {
    const globalsToIgnore = getGlobalsToIgnore()

    const frame = this.state.stack.find((s) => s.hash === scopeHash)
    if (frame && this.closuresToCreate[scopeHash] === true
    && !forThis) {
      return
    }

    if (forThis) {
      const { key, identifier, value } = forThis

      return this.setState(({ scopes }) => {
        const oldThis = JSON.parse(addQuotesToKeys(scopes[scopeHash].this))

        const newThis = removeQuotesFromKeys(JSON.stringify({
          ...oldThis,
          [key]: identifier ? scope.properties[identifier].data : value
        }, null, 2))

        return {
          scopes: {
            ...scopes,
            [scopeHash]: {
              ...scopes[scopeHash],
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
        [scopeHash]: {
          ...scopes[scopeHash],
          ...scopeArgs,
        }
      }
    }))
  }
  newExecutionContext = ({ name, hash, scope, thisExpression }) => {
    this.setState(({ stack, scopes }) => {
      return {
        stack: stack.concat([{
          name,
          hash,
          closure: false,
          phase: 'Creation'
        }]),
        scopes: {
          ...scopes,
          [hash]: {
            arguments: formatValue('Arguments', scope.properties.arguments.properties),
            this: formatValue('thisExpression', thisExpression),
          }
        }
      }
    })

    this.createdExecutionContexts[hash] = true
    this.setScopeVariables(scope, hash)
  }
  handleEndExecutionContext = (updateLocalScopeChain) => {
    const { stack } = this.state
    const stackLength = stack.length
    if (stackLength === 1) {
      return
    }

    const currentExeContext = stack[stackLength - 1]

    if (this.closuresToCreate[currentExeContext.hash] === true) {
      this.convertToClosure(currentExeContext.hash)
      this.createdExecutionContexts[currentExeContext.hash] = false
      updateLocalScopeChain()

      return
    }

    this.setState(({ stack, scopes }) => ({
      stack: stack.filter((f, i) => i !== stackLength - 1),
      scopes: omit(scopes, [currentExeContext.hash])
    }), updateLocalScopeChain)
  }
  toExecutionPhase = (scopeHash) => {
    this.setState(({ stack }) => ({
      stack: stack.map((pancake) => {
        return pancake.hash === scopeHash
          ? {
            ...pancake,
            phase: 'Execution'
          }
          : pancake
      })
    }))
  }
  convertToClosure = (scopeHash) => {
    this.setState(({ stack }) => ({
      stack: stack.map((f) => {
        return f.hash === scopeHash
          ? {
            ...f,
            closure: true
          }
          : f
      })
    }))
  }
  selectCodeSnippet = (type) => {
    const code = snippets[type]
    this.setState({
      code
    })

    this.myInterpreter = getInterpreter(code)
  }
  updateLocalScopeChain = () => {
    const ignore = {
      this: true,
      window: true,
      arguments: true,
    }

    const { scopes } = this.state

    const scopeKeys = Object.keys(scopes)

    scopeKeys.forEach((scopeKey) => {
      const scope = scopes[scopeKey]

      Object.keys(scope)
        .filter((property) => !ignore[property])
        .forEach((property, i) => {
          if (property === 'fn()') return false

          const value = this.myInterpreter.getValue(property)

          if (value === null) {
            // Trying to figure out a way to use this to see if there's even a reference
            // to the closure anymore. If not, we can remove it from React's state.
            // problem is getValue isn't checking closure scopes, just current and parent scopes.

            // const stack = this.state.stack
            // const stackLength = stack.length
            // this.closuresToCreate[stack[stackLength - 1].hash] = false
            // this.handleEndExecutionContext()
          } else {
            this.setState(({ scopes }) => ({
              scopes: {
                ...scopes,
                [scopeKey]: {
                  ...scopes[scopeKey],
                  [property]: argToString(value, scopeKey, true)
                }
              }
            }))
          }
        })
    })
  }
  handleStep = () => {
    const highlightStack = this.myInterpreter.stateStack
    const { scopeName, scopeHash } = getScopeName(highlightStack)
    const highlighted = highlightStack[highlightStack.length - 1]
    const scope = this.myInterpreter.getScope()
    const nodeType = highlighted.node.type
    const stackLength = this.state.stack.length

    this.highlightCode(highlighted.node)
    this.setState({currentOperation: nodeType})

    if (this.createdExecutionContexts[scopeHash] === true) {
      this.toExecutionPhase(scopeHash)
    }

    if (stackLength === 0) {
      this.setState(getFirstStepState())
      this.createdExecutionContexts.Global = true
    }

    if (createNewExecutionContext(this.previousHighlight.node, highlighted.node)) {
      this.newExecutionContext({
        name: scopeName,
        hash: scopeHash,
        scope,
        thisExpression: highlighted.thisExpression,
      })
    }

    if (stackLength > 1 && isFunction(nodeType)) {
      this.closuresToCreate[scopeHash] = true
    }

    this.setScopeVariables(
      scope,
      scopeHash,
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

    if (endExecutionContext(highlighted)) {
      this.handleEndExecutionContext(this.updateLocalScopeChain)
    } else {
      this.updateLocalScopeChain()
    }

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
            serialize={this.handleSerialize}
            pause={this.handlePause}
            disabled={disableButtons}
            onStep={this.changeRunSpeed}
            restart={() => this.handleClear(false)}
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
        <RightContainer id='execution-context'>
        {stack.length === 0
          ? <Welcome selectCodeSnippet={this.selectCodeSnippet} />
          : <ExecutionContext
              context={stack[0].name}
              scopeHash={stack[0].hash}
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
