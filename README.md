# gpsd-fake

This tool emulates a running instance of gpsd. It generates random movements based on a simple algorithm. Primary use case for it is testing of software which uses gpsd, but it can also be used for demonstration purposes. It is implemented in Javascript using nodejs.

## Usage

The software in configured in a configuration file named config.json. The content of it should be pretty self explanatory. You have to supply minimum and maximum values for latitude and longitude. Also you can configure the speed in kilometers per hour.

Run it as follows:

```bash
node main.js [port] [backup-file]
```

Where `[port]` ist the port to bind to, if not supplied it defaults to 8000, and `[backup-file]` is a file in which gpsd-fake will regulary save its state, so you can restart the tool and proceed at the same position.

## Contribute
If you are looking for a new feature or you found a bug, feel free to create a pull request or open a issue.
