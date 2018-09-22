import React from 'react'
import styled from 'styled-components'
import Slider from 'rc-slider/lib/Slider'
import 'rc-slider/assets/index.css'

const ButtonPanelContainer = styled.div`
  background: #333333;
  height: 8%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 105px;
`

const Top = styled.div`
  height: 65%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px;
`

const Buttons = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  align-self: flex-start;
  height: 100%;

  > button {
    border: none;
    background: none;
    color: #fff;
    font-size: 20px;
  }

  > button:hover {
    color: #fff;
    cursor: pointer;
  }

  > button:disabled {
    color: #919191;
  }
`

const SliderContainer = styled.div`
  text-align: center;
  color: #fff;
  height: 100%;
  margin: 8px;

  > p {
    margin: 3px;
  }
`

const Status = styled.div`
  background: #dfe1e9;
  height: 35%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  font-weight: 300
  font-size: 14px;
  padding-left: 10px;
  margin-bottom: 5px;

  > span {
    font-weight: 500;
    margin-left: 10px;
  }
`

export default function ButtonPanel ({ onStep, step, run, clear, currentOperation = 'NA', running, pause, disabled, serialize }) {
  return (
    <ButtonPanelContainer>
      <Top>
        <Buttons>
          <button disabled={disabled} onClick={step}>Step</button>
          {running === true
            ? <button onClick={pause}>Pause</button>
            : <button disabled={disabled} onClick={run}>Run</button>}
          <button onClick={clear}>Clear</button>
          <button onClick={serialize}>Serialize</button>
        </Buttons>
        <SliderContainer>
          <p>Run Speed</p>
          <Slider
            style={{width: 150, marginRight: 20}}
            min={0}
            max={10}
            step={1}
            defaultValue={5}
            included={false}
            onChange={onStep}
            handleStyle={{
              borderColor: '#C3392A',
              backgroundColor: '#C3392A'
            }}
            marks={{
              0: 'Slow',
              5: 'Fast',
              10: 'Faster',
            }}
          />
        </SliderContainer>
      </Top>
      <Status>
        Current Operation: <span>{currentOperation}</span>
      </Status>
    </ButtonPanelContainer>
  )
}