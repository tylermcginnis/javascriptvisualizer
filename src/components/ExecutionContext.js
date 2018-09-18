import React, { Component } from 'react'
import styled from 'styled-components'

const colors = {
  darkBlue: '#162b35',
  pink: '#ce91c8',
  white: '#fff',
  blue: '#569bd1',
}

const ExecutionContextStyles = styled.div`
  padding: 10px;
  margin: ${({ isGlobal }) => isGlobal ? '0px' : '10px'};
  border-radius: ${({ isGlobal }) => isGlobal ? '0px' : '5px'};
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
  state = {
    color: this.color || this.props.getColor()
  }
  componentDidUpdate (prevProps) {
    if (this.props.closure !== prevProps.closure) {
      this.setState({
        color: '#fff'
      })
    }
  }
  getHeader = () => {
    const { context, closure } = this.props

    if (closure === true) {
      return 'Closure Scope'
    }

    if (context === 'Global') {
      return 'Global Scope'
    }

    return context + (context.charAt(context.length - 1) === 's' ? `' Execution Context` : `'s Execution Context`)
  }
  render() {
    const { context, getColor, scopes, remainingStack, phase, closure } = this.props
    const variables = scopes[context]

    return (
      <ExecutionContextStyles background={this.state.color} isGlobal={context ==='Global'}>
        <h1>{this.getHeader()}</h1>
        {closure === true ? null : <pre>{phase} Phase</pre>}
        <VariableEnvironment>
          {Object.keys(variables).map((identifier, index) => {
            return (
              <span key={index}>
                <Variable background={colors.darkBlue}>
                  <Identifier color={colors.pink}>{identifier}</Identifier>: <Value color={colors.white}>{`${variables[identifier]}`}</Value>
                </Variable>
              </span>
            )
          })}
          {remainingStack.length === 0
            ? null
            : <ExecutionContext
                context={remainingStack[0].name}
                phase={remainingStack[0].phase}
                closure={remainingStack[0].closure}
                scopes={scopes}
                remainingStack={remainingStack.slice(1)}
                getColor={getColor}
              />}
        </VariableEnvironment>
      </ExecutionContextStyles>
    )
  }
}

export default ExecutionContext