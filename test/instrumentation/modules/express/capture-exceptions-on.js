'use strict'

const agent = require('../../../..').start({
  captureExceptions: true,
  metricsInterval: 0,
  centralConfig: false
})

const { exec } = require('child_process')

const express = require('express')
const test = require('tape')

const mockClient = require('../../../_mock_http_client')

test('use given error handler middleware if captureExceptions: true', function (t) {
  t.plan(7)

  onAPMData(function (data) {
    t.equal(data.transactions.length, 1, 'has a transaction')
    t.equal(data.errors.length, 1, 'has an error')
    t.equal(data.errors[0].exception.message, err.message)
  })

  const err = new Error('foo')

  const app = express()
  app.get('/', function (req, res) {
    throw err
  })
  app.use(function (_err, req, res, next) {
    t.equal(_err, err)
    res.send('hello from error handler')
  })

  const server = app.listen(function () {
    get(server, (err, stdout, stderr) => {
      t.error(err)
      t.equal(stdout, 'hello from error handler')
      t.equal(stderr, '')
      server.close()
    })
  })
})

function get (server, cb) {
  // use curl instead of http.get so the agent doesn't try to track the outgoing request
  // -s: Silent mode. Don't output progress on stderr
  exec(`curl -s localhost:${server.address().port}`, cb)
}

function onAPMData (cb) {
  agent._transport = mockClient(2, cb)
}
