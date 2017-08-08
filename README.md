# gpsd-fake

This tool emulates a running instance of gpsd. It generates random movements based on a simple algorithm. Primary use case for it is testing of software which uses gpsd, but it can also be used for demonstration purposes. It is implemented in Javascript using nodejs.

## Usage as CLI

```bash
npm install -g gpsd-fake
```

Run it as follows:

```bash
gpsd-fake --port [port] --config-file [config-file] --tmp-file [tmp-file]
```

* `-port`: Is the port to bind to, if not supplied it defaults to 2947
* `-config-file`: Supply minimum and maximum values for latitude and longitude. You can configure the speed in kilometers per hour, also. See <https://github.com/loewexy/gpsd-fake/blob/master/config.json> for an example. Might be a just a filename, a relative or an absolute path.
* `-tmp-file`: Is a file in which gpsd-fake will regulary save its state, so you can restart the tool and proceed at the same position. Might be a just a filename, a relative or an absolute path. This feature is disabled by default.


Display the help screen via:

```bash
gpsd-fake --help
```

## Usage as library

```bash
npm install --save gpsd-fake
```

```js
var gpsdFake = require('gpsd-fake')

gpsdFake({
  port: 1234,
  tmpFile: 'gpsd-fake-last-session.json', // might be relative or absolute
  configFile: 'custom-config.json' // might be relative or absolute
})
```

## Contribute
If you are looking for a new feature or you found a bug, feel free to create a pull request or open a issue. If you do a pull request make shure that eslint is running without errors. You can run eslint using:

```bash
npm run-script lint
```
