#!/usr/bin/env node

var path = require('path')
var yargs = require('yargs')

var gpsdFake = require('../main')

var config = yargs
  .usage([
    '',
    'gpsd-fake emulates a running gpsd deamon. Useful for testing software which uses gpsd to read gps data.',
    '',
    'Usage: gpsd-fake [args]'
  ].join('\r\n'))
  .help('h')
  .alias('h', 'help')
  .options({
    'port': {
      alias: 'p',
      describe: 'Defines the port of the gpsd fake deamon',
      default: 2947
    },
    'config-file': {
      alias: ['c', 'config'],
      describe: [
        'Path to the config file for min/max of latitude and longitude and the movement speed',
        'Find the default config file at:',
        path.resolve(__dirname, '..', 'config.json')
      ].join('\r\n')
    },
    'tmp-file': {
      alias: ['t', 'tmp'],
      describe: 'Path to the backup file which gpsd-fake uses to restore the last session'
    }
  })
  .wrap(yargs.terminalWidth())
  .argv

gpsdFake(config)
