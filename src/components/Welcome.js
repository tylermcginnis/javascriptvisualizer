import React from 'react'
import styled from 'styled-components'
import SocialBadges from './SocialBadges'

const Container = styled.div`
  height: 100vh;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
`

const Info = styled.div`
  padding: 50px;
  flex: 1;

  @media (max-width: 700px) {
    padding: 8px;
  }

  @media (max-height: 800px) {
    padding: 8px;
  }
`

const Logo = styled.img`
  margin: 0 auto;
  display: block;

  @media (max-width: 800px) {
    width: 80px;
    height: 80px;
  }
`

const Header = styled.h1`
  text-align: center;
  font-weight: 300;
  font-size:calc(12px + 4vw);
  letter-spacing: 1.8px;
  margin-top: 40px;
  border: none;
  margin-bottom: 20px;

  @media (max-width: 700px) {
    margin-top: 10px;
    font-size:calc(12px + 2vw);
  }
`

const Subheader = styled.h3`
  text-align: center;
  font-weight: 300;
  margin: 0 auto;
  font-size:calc(8px + 1vw);

  > span {
    font-weight: 500;
  }
`

const Instructions = styled.ul`
  margin-top: 50px;
  display: block;
  font-size:calc(6px + .75vw);
  padding-left: 0

  @media (max-width: 700px) {
    margin-top: 10px;
  }
`

const InstructionItem = styled.li`
  list-style-type: none;
  padding: 5px;
  margin: 10px;
  text-decoration: ${({ selectable }) => selectable ? 'underline' : 'none'};
  cursor: ${({ selectable }) => selectable ? 'pointer' : 'default'};

  @media (max-width: 700px) {
    margin: 3px;
    padding: 1px;
  }
`

const Disclosure = styled.div`
  background: #efefef;
  font-style: italic;
  height: 10vh;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  justify-content: space-around;
  align-items: center;
  text-align: center;
  font-size: 18px;
  padding: 5px;

  > p {
    margin: 0
    padding: 0
  }

  @media (max-width: 1200px) {
    font-size: 15px;
  }

  @media (max-width: 700px) {
    font-size: 9px;
  }
`


const Img = styled.img`
  height: 60px;
  width: 60px;

  @media (max-width: 700px) {
    height: 30px;
    width: 30px;
  }
`

export default function Welcome ({ selectCodeSnippet }) {
  return (
    <Container>
      <Info>
        <a href='https://tylermcginnis.com'>
          <Logo src='https://tylermcginnis.com/images/logo-only.png' alt='TylerMcGinnis.com logo' />
        </a>
        <Header>JavaScript Visualizer</Header>
        <Subheader>A tool for visualizing <span>Execution Context</span>, <span>Hoisting</span>, <span>Closures</span>, and <span>Scopes</span> in JavaScript</Subheader>
        <SocialBadges />
        <Instructions>
          Instructions:
          <InstructionItem>1. Type <b>(ES5)</b> JavaScript in the editor</InstructionItem>
          <InstructionItem>2. "Step" or "Run" through the code</InstructionItem>
          <InstructionItem>3. Visualize how your code is interpreted</InstructionItem>
        </Instructions>
        <Instructions>
          Here are some of our favorite code snippets to visualize
          <InstructionItem
            selectable
            onClick={() => selectCodeSnippet('simpleClosure')}>
              Simple Closure
          </InstructionItem>
          <InstructionItem
            selectable
            onClick={() => selectCodeSnippet('complexClosures')}>
              Complex Closures
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
          <InstructionItem
            selectable
            onClick={() => selectCodeSnippet('thisKeyword')}>
              The this Keyword
          </InstructionItem>
        </Instructions>
      </Info>
      <div style={{width: '100%', background: '#efefef'}}>
        <Disclosure>
          <div>
            <p><b>This was created for our <a href='https://tylermcginnis.com/courses/advanced-javascript/'>Advanced JavaScript course</a>.</b></p>
            <p>It's Beta AF. I'm working on ES6 support and lots of <a href='https://github.com/tylermcginnis/noname/issues'>bug fixes</a>.</p>
          </div>
        </Disclosure>
      </div>
    </Container>
  )
}