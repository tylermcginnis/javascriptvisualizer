import React, { Component } from 'react'
import styled from 'styled-components'

const colors = {
  darkBlue: '#162b35',
  pink: '#ce91c8',
  white: '#fff',
  blue: '#569bd1',
}

const ExecutionContextStyles = styled.div`
  padding: 15px;
  margin: ${({ isGlobal }) => isGlobal ? '0px' : '25px'};
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
  padding-left: 0;
`

const Variable = styled.li`
  display: table;
  margin: 15px;
  padding: 10px;
  border-radius: 5px;
  font-family: Consolas,Monaco,Andale Mono,Ubuntu Mono,monospace;
  color: ${colors.white};
  background: ${({ background }) => background};
  margin-left: 0;
`

const Identifier = styled.span`
  color: ${({ color }) => color}
`

const Value = styled.span`
  color: ${({ color }) => color}
`
const Scope = styled.h2`
  font-size: 28px;
  font-weight: 300
  text-decoration: underline;

  > b {
    font-weight: 600
  }
`

const Phase = styled.div`
  display: table;
  margin: 15px;
  padding: 10px;
  border-radius: 5px;
  font-family: Consolas,Monaco,Andale Mono,Ubuntu Mono,monospace;
  color: ${colors.white};
  background: rgba(255, 255, 255, 0.62);
  margin-left: 0;
  color: #162b35;
  font-size: 20px;
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
      return <Scope><b>Closure</b> Scope</Scope>
    }

    return <Scope><b>{context}</b> Execution Context</Scope>
  }
  render() {
    const { context, getColor, scopes, remainingStack, phase, closure } = this.props
    const variables = scopes[context]

    return (
      <ExecutionContextStyles id='execution-context' background={this.state.color} isGlobal={context ==='Global'}>
        {this.getHeader()}
        {closure === true ? null : <Phase>Phase: <b>{phase}</b></Phase>}
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