/*
 * Copyright 2016 Lukas Metzger <developer@lukas-metzger.com>.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var net = require('net');
var fs = require('fs');
var path = require('path');
var Vector = require('victor');

//Get port, if no command line argument was supplied use 8000
var port = parseInt(process.argv[2]) || 8000;

//Get tmp file if supplied
var tmpFile = process.argv[3];
var backup;
try {
    backup = JSON.parse(fs.readFileSync(tmpFile));
} catch(e) {
    backup = {};
}

//Read config file
var config = JSON.parse(fs.readFileSync(__dirname + "/config.json"));

////////////////////////////////////////////////////////////////////////////////
//Socket handling
////////////////////////////////////////////////////////////////////////////////

//List with active sockets
var sockets = [];
//Create server
var server = net.createServer(function(socket) {

    //Add new socket to socket list
    sockets.push(socket);

    //If socket is closed remove from list
    socket.on("close", function() {
        var index = sockets.indexOf(socket);
        sockets.splice(index, 1);
    });

    //On error remove from list
    socket.on("error", function() {
       var index = sockets.indexOf(socket);
       sockets.splice(index, 1);
    });

    //If some data is received assume it the watch enable command and send some responses
    socket.on("data", function(data) {
        socket.write('{"class":"DEVICES","devices":[{"class":"DEVICE","path":"/dev/pts/4","driver":"NMEA0183","activated":"2016-08-20T10:00:12.934Z","flags":1,"native":0,"bps":4800,"parity":"N","stopbits":1,"cycle":1.00}]}' + "\r\n");
        socket.write('{"class":"WATCH","enable":true,"json":true,"nmea":false,"raw":0,"scaled":false,"timing":false,"split24":false,"pps":false}' + "\r\n");
        socket.write('{"class":"DEVICE","path":"/dev/pts/4","driver":"NMEA0183","activated":"2016-08-20T10:12:11.296Z","native":0,"bps":4800,"parity":"N","stopbits":1,"cycle":1.00}' + "\r\n");
    });

    socket.write('{"class":"VERSION","release":"3.16","rev":"3.16","proto_major":3,"proto_minor":11}' + "\r\n");
});
//Listen to Port
server.listen(port);

////////////////////////////////////////////////////////////////////////////////
//GPS Simulation
////////////////////////////////////////////////////////////////////////////////

var movement;
var position;
var goal;
var direction;

//1km long latitude
var distancePerSecond = 0.011134839 * config.speed / 3600;

//Get initial movement vector
if(backup.movement) {
    movement = Vector.fromArray(backup.movement);
} else {
    movement = new Vector(distancePerSecond, 0).rotateDeg(360*Math.random());
}

//Get initial position
if(backup.position) {
    position = Vector.fromArray(backup.position);
} else {
    position = new Vector();
    position.x = (config.area.lat.max-config.area.lat.min)*Math.random() + config.area.lat.min;
    position.y = (config.area.lon.max-config.area.lon.min)*Math.random() + config.area.lon.min;
}

//Get initial goal
if(backup.goal) {
    goal = Vector.fromArray(backup.goal);
} else {
    goal = new Vector();
    goal.x = (config.area.lat.max-config.area.lat.min)*Math.random() + config.area.lat.min;
    goal.y = (config.area.lon.max-config.area.lon.min)*Math.random() + config.area.lon.min;
}

//Get initial direction
if(backup.direction) {
    direction = backup.direction;
} else {
    direction = Math.random() > 0.5 ? 1 : -1;
}

setInterval(function() {
    //Rotate random ammount in current direction
    movement.rotateDeg(Math.pow(Math.random(), 4) * 1 * direction);

    //Add current movement vector to position
    position.add(movement);

    //If goal is reached, use new goal
    if(position.distance(goal) < distancePerSecond*300) {
        goal = new Vector();
        goal.x = (config.area.lat.max-config.area.lat.min)*Math.random() + config.area.lat.min;
        goal.y = (config.area.lon.max-config.area.lon.min)*Math.random() + config.area.lon.min;
    }

    //If course is very wrong correct it
    if(Math.acos(goal.clone().subtract(position).dot(movement)) > Math.PI/2) {
        var newMov = goal.clone().subtract(position).normalize().multiply(new Vector(distancePerSecond, distancePerSecond));
        newMov.rotateDeg(Math.pow(Math.random(), 4) * -5 * direction);
        movement = newMov;
    }

    //Generate data package
    var data = {
        class: "TPV",
        device: "/dev/pts/4",
        mode: 3,
        time: new Date().toISOString(),
        ept: 0.005,
        lat: position.x,
        lon: position.y,
        alt: 1000,
        epx: 2.234,
        epy: 2.454,
        epv: 5.345,
        track: movement.verticalAngleDeg(),
        speed: config.speed/3.6,
        climb: 0.000
    };

    //Send messages to each socket
    sockets.forEach(function(socket) {
        //Send TPV data
        socket.write(JSON.stringify(data) + "\r\n");

        //Send some sattelite state
        socket.write('{"class":"SKY","device":"/dev/pts/4","xdop":0.55,"ydop":0.72,"vdop":0.90,"tdop":1.00,"hdop":1.00,"gdop":2.09,"pdop":1.30,"satellites":[{"PRN":82,"el":37,"az":123,"ss":30,"used":false},{"PRN":67,"el":46,"az":40,"ss":29,"used":false},{"PRN":68,"el":68,"az":178,"ss":28,"used":false},{"PRN":74,"el":7,"az":296,"ss":0,"used":false},{"PRN":75,"el":9,"az":344,"ss":0,"used":false},{"PRN":69,"el":18,"az":203,"ss":0,"used":false},{"PRN":84,"el":23,"az":314,"ss":0,"used":false},{"PRN":83,"el":0,"az":0,"ss":0,"used":false}]}' + "\r\n");
    });

    //Backup data to disk
    if(tmpFile) {
        fs.writeFile(tmpFile, JSON.stringify({
                position: position.toArray(),
                movement: movement.toArray(),
                goal: goal.toArray(),
                direction: direction
            }));
    }
}, 1000);

//Every 30 seconds
setInterval(function() {
    //change current direction with chance of 80 percent
    if(Math.random() > 0.7) {
        var random = Math.random();
        if(random < 0.2) {
            direction = -1;
        } else if(random < 0.4) {
            direction = 1;
        } else {
            var newMov = goal.clone().subtract(position).normalize().multiply(new Vector(distancePerSecond, distancePerSecond));
            newMov.rotateDeg(Math.pow(Math.random(), 4) * -5 * direction);
            movement = newMov;
        }
    }

    //turn randomly
    if(Math.random() > 0.95) {
        if(Math.random() < 0.5) {
            movement.rotateDeg(-90);
        } else {
            movement.rotateDeg(90);
        }
    }
}, 30000);
