import React, { Component } from 'react'
import styled from 'styled-components'
import { getParsedAST } from '../utils/parser'
import { Controlled as CodeMirror } from 'react-codemirror2'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/material.css'
import 'codemirror/theme/neat.css'
import 'codemirror/mode/javascript/javascript.js'

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

class App extends Component {
  state = {
    code: '',
  }
  chosenColors = []
  getColor = () => {
    const availableColors = Object.keys(flatColors)
      .filter((color) => !this.chosenColors.includes(color))

    const randomColor = getRandomItem(availableColors)

    this.chosenColors.push(randomColor)

    return flatColors[randomColor]
  }
  render() {
    return (
      <div>
        <CodeMirror
          value={this.state.code}
          options={{
            mode: 'javascript',
            theme: 'material',
            lineNumbers: true
          }}
          onBeforeChange={(editor, data, code) => {
            this.setState({
              code,
              submit: false
            })
          }}
        />
        <ExecutionContext
          context={'Global'}
          variables={getParsedAST(this.state.code)}
          getColor={this.getColor}
        />
      </div>
    )
  }
}

export default App
