import React, { Component } from 'react'
import styled from 'styled-components'
import { getInterpreter, parseAST } from '../utils/parser'
import { Controlled as CodeMirror } from 'react-codemirror2'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/material.css'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/addon/selection/mark-selection.js'

function getRandomItem (arr) {
  return arr[~~(arr.length * Math.random())];
}

const colors = {
  darkBlue: '#162b35',
  pink: '#ce91c8',
  white: '#fff',
  blue: '#569bd1',
}

const flatColors = {
  flatRed: '#fea3aa',
  flatOrange: '#f8b88b',
  flatPink: '#f2a2e8',
  flatGreen: '#baed91',
  flatYellow: '#faf884',
  flatBlue: '#b2cefe'
}

const ExecutionContextStyles = styled.div`
  padding: 10px;
  margin: 10px;
  border-radius: 5px;
  background: ${({ background }) => background};
  color: ${({ color }) => color};

  > h1 {
    margin: 0;
    font-size: 40px;
  }
`

const VariableEnvironment = styled.ul`
  font-size: 24px;
  list-style-type: none;
`

const Variable = styled.li`
  display: table;
  margin: 10px;
  padding: 10px;
  border-radius: 5px;
  font-family: Consolas,Monaco,Andale Mono,Ubuntu Mono,monospace;
  color: ${colors.white};
  background: ${({ background }) => background};
`

const Identifier = styled.span`
  color: ${({ color }) => color}
`

const Value = styled.span`
  color: ${({ color }) => color}
`

class ExecutionContext extends Component {
  color = this.color || this.props.getColor()
  render() {
    const { context, variables, getColor } = this.props

    return (
      <ExecutionContextStyles background={this.color}>
        <h1>{context}'s Execution Context</h1>
        <VariableEnvironment>
          {variables.map(({ identifier, type, value, variables }, index) => {
            return (
              <span key={index}>
                <Variable background={colors.darkBlue}>
                  <Identifier color={colors.pink}>{identifier}</Identifier>: <Value color={colors.white}>{value}</Value>
                </Variable>
                {type === 'function' && (
                  <ExecutionContext
                    context={identifier}
                    variables={variables}
                    getColor={getColor}
                  />
                )}
              </span>
            )
          })}
        </VariableEnvironment>
      </ExecutionContextStyles>
    )
  }
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

class App extends Component {
  state = {
    code: ``,
  }
  myInterpreter = getInterpreter('')
  chosenColors = []
  getColor = () => {
    const availableColors = Object.keys(flatColors)
      .filter((color) => !this.chosenColors.includes(color))

    const randomColor = getRandomItem(availableColors)

    this.chosenColors.push(randomColor)

    return flatColors[randomColor]
  }
  markers = []
  clearMarkers = () => this.markers.forEach((m) => m.clear())
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

    */

    try {
      var ok = this.myInterpreter.step();
      console.log('SCOPE', this.myInterpreter.getScope())
      console.log('Current Scope (I think)', this.myInterpreter.stateStack[this.myInterpreter.stateStack.length - 1].thisExpression)
    } finally {
      if (!ok) {
        // No more code to step through
        this.markers.forEach((m) => m.clear())
      }
    }
  }
  handleSlowRun = () => {
    // make step speed an option
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
    return (
      <div>
        <button onClick={this.handleStep}>STEP</button>
        <button onClick={this.handleSlowRun}>SLOW RUN</button>
        <CodeMirror
          ref={(cm) => this.cm = cm}
          value={this.state.code}
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
        <ExecutionContext
          context={'Global'}
          variables={this.myInterpreter ? parseAST(this.myInterpreter.ast) : []}
          getColor={this.getColor}
        />
      </div>
    )
  }
}

export default App
