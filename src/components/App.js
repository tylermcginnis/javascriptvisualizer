import React, { Component } from 'react'
import { getInterpreter, parseAST } from '../utils/parser'
import { Controlled as CodeMirror } from 'react-codemirror2'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/material.css'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/addon/selection/mark-selection.js'
import ExecutionContext from './ExecutionContext'

const flatColors = {
  flatRed: '#fea3aa',
  flatOrange: '#f8b88b',
  flatPink: '#f2a2e8',
  flatGreen: '#baed91',
  flatYellow: '#faf884',
  flatBlue: '#b2cefe'
}

function getRandomItem (arr) {
  return arr[~~(arr.length * Math.random())];
}

function getTotalLineLengths (lengths, lineNumber) {
  let count = 0

  for (let i = 0; i < lineNumber; i++) {
    // this one weird trick solves off by one errors. (+ 1)
    count += lengths[i] + 1
  }

  return count
}

function formatCharLoc (code, charIndex) {
  const lineLengths = code.split('\n').map((line) => line.length)

  let line = 0;
  let ch = 0

  for (let i = 0; i < code.length + 1; i++) {
    if (i === charIndex) {
      return {
        line,
        ch: ch - getTotalLineLengths(lineLengths, line),
      }
    }

    if (code[i] === '\n') {
      line++
    }

    ch++
  }
}

const globalsToIgnore = {
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

function filterGlobals (properties) {
  return Object.keys(properties).reduce((result, prop) => {
    if (globalsToIgnore[prop] !== true) {
      result[prop] = properties[prop]
    }
    return result
  }, {})
}

function createNewExecutionContext (previousHighlight, currentHighlight) {
  return previousHighlight.node.type === 'CallExpression' && currentHighlight.node.type === 'BlockStatement'
}

function endExecutionContext (currentHighlight) {
  if (currentHighlight.node.type === 'CallExpression') {
    if (currentHighlight.doneCallee_ === true && currentHighlight.doneExec_ === true) {
      return true
    }
  }

  return false
}

function getCalleeName (callee) {
  if (callee.name) {
    return callee.name
  } else if (callee.property) {
    return callee.property.name
  } else {
    return 'Not handling this case 🙈'
  }
}

class App extends Component {
  state = {
    code: ``,
    highlight: {},
    scopes: {},
    stack: [],
  }
  myInterpreter = getInterpreter('')
  chosenColors = []
  markers = []
  previousHighlight = { node: { type: null}}
  clearMarkers = () => this.markers.forEach((m) => m.clear())
  getColor = () => {
    const availableColors = Object.keys(flatColors)
      .filter((color) => !this.chosenColors.includes(color))

    const randomColor = getRandomItem(availableColors)

    this.chosenColors.push(randomColor)

    return flatColors[randomColor]
  }
  handleStep = () => {
    const { stateStack } = this.myInterpreter

    if (stateStack.length) {
      const node = stateStack[stateStack.length - 1].node
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

    /*
      this.myInterpreter.getScope()
      this.myInterpreter.getValueFromScope('varName')

      this.myInterpreter.getScope() === this.myInterpreter.stateStack[this.myInterpreter.stateStack.length - 1].scope

      Get this -> stack[stack.length - 1].thisExpression.properties

      All methods - Object.getPrototypeOf(this.myInterpreter)
    */

    let ok
    try {
      const highlightStack = this.myInterpreter.stateStack
      const highlight = highlightStack[highlightStack.length - 1]
      this.setState({highlight: highlight.node})

      if (this.state.stack.length === 0) {
        this.setState({
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
        })
      }

      if (createNewExecutionContext(this.previousHighlight, highlight)) {
        const name = getCalleeName(this.previousHighlight.node.callee)

        this.setState(({ stack, scopes }) => {
          return {
            stack: stack.concat([{
              name,
              closure: false,
            }]),
            scopes: {
              ...scopes,
              [name]: {}
            }
          }
        })
      }

      if (endExecutionContext(highlight)) {
        // todo. handle closures
        const name = getCalleeName(highlight.node.callee)

        if (name === 'Global') return

        this.setState(({ stack }) => ({
          stack: stack.filter((s) => s.name !== name),
        }))
      }


      console.log('*******')
      console.log('\n')
      console.log('INTERPRETER', filterGlobals(this.myInterpreter))
      console.log('----------------')
      console.log('SCOPE', highlight.properties)
      console.log('----------------')
      highlightStack.forEach((s) => console.log(s.node.type))
      console.log(highlight)
      console.log('\n')
      console.log('*******')

      this.previousHighlight = highlight
      ok = this.myInterpreter.step()
    } finally {
      if (!ok) {
        // No more code to step through
        this.markers.forEach((m) => m.clear())
      }
    }
  }
  handleSlowRun = () => {
    // todo: make step speed an option
    const interval = window.setInterval(() => {
      const state = this.myInterpreter.stateStack[0]

      if (state.done === true) {
        this.clearMarkers()
        return window.clearInterval(interval)
      }

      this.handleStep()
    }, 500)
  }
  render() {
    const { code, highlight, stack, scopes } = this.state

    return (
      <div>
        <button onClick={this.handleStep}>STEP</button>
        <button onClick={this.handleSlowRun}>SLOW RUN</button>
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
        />
        {/*<pre>{JSON.stringify(highlight, null, 2) }</pre>*/}
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
