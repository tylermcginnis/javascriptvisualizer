import React from 'react'
import styled from 'styled-components'

const Container = styled.div`
  width: 100%;
  height: 20%;
  background: #000;
`

export default function Prompt ({ children }) {
  return (
    <Container>
      {children}
    </Container>
  )
}