import React from 'react'
import styled from 'styled-components'

const Container = styled.div`
  height: 100vh;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
`

const Info = styled.div`
  padding: 50px;
  flex: 1;
`

const Header = styled.h1`
  text-align: center;
  font-weight: 300;
  font-size: 4.5vmax;
  letter-spacing: 1.8px;
  margin-top: 40px;
  border: none;
  margin-bottom: 20px;
`

const Subheader = styled.h3`
  text-align: center;
  font-weight: 300;
  margin: 0 auto;
  font-size: 25px;

  > span {
    font-weight: 500;
  }
`

const Instructions = styled.ul`
  margin-top: 50px;
  display: block;
  font-size: 20px;
  padding-left: 0
`

const InstructionItem = styled.li`
  list-style-type: none;
  padding: 5px;
  margin: 10px;

  text-decoration: ${({ selectable }) => selectable ? 'underline' : 'none'};
  cursor: ${({ selectable }) => selectable ? 'pointer' : 'default'};
`

const Disclosure = styled.div`
  background: #efefef;
  font-style: italic;
  height: 10vh;
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  justify-content: space-around;
  align-items: center;
  text-align: center;
  font-size: 18px;

  > p {
    margin: 0
    padding: 0
  }
`

export default function Welcome ({ selectCodeSnippet }) {
  return (
    <Container>
      <Info>
        <Header>JavaScript Visualizer</Header>
        <Subheader>A tool for visualizing <span>Execution Context</span>, <span>Hoisting</span>, <span>Closures</span>, and <span>Scopes</span> in JavaScript</Subheader>
        <Instructions>
          Instructions:
          <InstructionItem>1. Type (ES5) JavaScript in the editor</InstructionItem>
          <InstructionItem>2. "Step" or "Run" through the code</InstructionItem>
          <InstructionItem>3. Visualize how your code is interpreted</InstructionItem>
        </Instructions>
        <div style={{margin: 50}} />
        <Instructions>
          Here are some of our favorite code snippets to visualize
          <InstructionItem
            selectable
            onClick={() => selectCodeSnippet('closures')}>
              Closures
          </InstructionItem>
          <InstructionItem
            selectable
            onClick={() => selectCodeSnippet('scopeChain')}>
              Scope Chain
          </InstructionItem>
          <InstructionItem
            selectable
            onClick={() => selectCodeSnippet('bubbleSort')}>
              Bubble Sort
          </InstructionItem>
          <InstructionItem
            selectable
            onClick={() => selectCodeSnippet('pseudoclassical')}>
              Pseudoclassical Pattern
          </InstructionItem>
        </Instructions>
      </Info>
      <div style={{width: '100%', background: '#efefef'}}>
        <Disclosure>
          <div>
            <p><b>This was created for our <a href='https://tylermcginnis.com/courses/advanced-javascript/'>Advanced JavaScript course</a>.</b></p>
            <p>It's Beta AF. I'm working on ES6 support and lots of <a href='https://github.com/tylermcginnis/noname/issues'>bug fixes</a>.</p>
          </div>
          <a href='https://tylermcginnis.com'>
            <img
              style={{width: 60, height: 60}}
              alt='TylerMcGinnis.com Logo'
              src='https://tylermcginnis.com/images/logo-only.png'
            />
          </a>
        </Disclosure>
      </div>
    </Container>
  )
}