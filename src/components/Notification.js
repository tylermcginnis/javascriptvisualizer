import React, { Component } from 'react'
import styled, { keyframes } from 'styled-components'

const slideUpDown = keyframes`
  0%, 100% {
    bottom: -50px;
  }
  10%, 90% {
    bottom: 25px;
  }
`

const Container = styled.div`
  background: #fff;
  position: fixed;
  padding: 10px;
  border-radius: 2px;
  left: 10px;
  bottom: -50px;
  z-index: 99;
  animation: ${slideUpDown} ${props => props.animationDuration || '2s'} ease;
`

export default class Notification extends Component {
  componentDidMount () {
    const { onDismiss, messageDuration } = this.props

    this.timeoutId = window.setTimeout(() => {
      onDismiss()
    }, messageDuration)
  }

  componentWillUnmount () {
    window.clearTimeout(this.timeoutId)
  }

  render () {
    const { message, animationDuration } = this.props

    return (
      <Container animationDuration={animationDuration}>
        {message}
      </Container>
    )
  }
}
