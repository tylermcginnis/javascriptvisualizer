import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './components/App'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import { JSHINT } from 'jshint'

window.JSHINT = JSHINT

ReactDOM.render((
  <Router>
    <Route path='/' component={App} />
  </Router>
), document.getElementById('root'))
