import React from 'react'
import styled from 'styled-components'

const Container = styled.div`
  margin: 120px auto 0 auto;
  position: relative;
  max-width: 900px;
  padding: 50px;

  @media (max-width: 1200px) {
    margin: 30px auto 0 auto;
    padding: 20px;
  }

  @media (max-width: 700px) {
    margin: 0 auto;
  }
`

const Header = styled.h1`
  text-align: center;
  font-weight: 300;
  font-size: 70px;
  letter-spacing: 1.8px;
  line-height: 75px;
  margin-top: 40px;
  border: none;
  margin-bottom: 20px;

  @media (max-width: 900px) {
    font-size: 50px;
    line-height: 50px;;
  }
`

const Subheader = styled.h3`
  text-align: center;
  font-weight: 300;
  width: 70%;
  margin: 0 auto;
  font-size: 25px;

  > span {
    font-weight: 500;
  }

  @media (max-width: 1200px) {
    width: 100%;
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

const DisclosureContainer = styled.div`
  background: #efefef;
  font-style: italic;
  margin:0 auto;
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 1rem;
  display: none;

  @media (min-height: 1000px) and (min-width: 700px) {
    display: block;
  }
`

const Disclosure = styled.div`
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  justify-content: space-around;
  align-items: center;
  text-align: center;
  font-size: 18px;
`

const MobileDisclosure = styled.div`
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  justify-content: space-around;
  align-items: center;
  text-align: center;
  font-size: 18px;
  display: none;

  @media (max-height: 999px), (max-width: 699px) {
    display: block;
  }
`

export default function Welcome ({ selectCodeSnippet }) {
  return (
    <div style={{position: 'relative'}}>
    <Container>
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
    </Container>
    <MobileDisclosure>
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
    </MobileDisclosure>
    <DisclosureContainer>
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
    </DisclosureContainer>
  </div>
  )
}