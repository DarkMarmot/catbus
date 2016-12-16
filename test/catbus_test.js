//run mocha from project root

var sinon = require('sinon');

var events = require('events');


var dice = new events.EventEmitter();

var assert = require('assert');
var Catbus = require('../src/catbus.js');


var msgLog, sourceLog, packetLog;


var log = function(msg, source, packet){

    console.log('::', msg, source, '\n');
    msgLog.push(msg);
    sourceLog.push(source);
    packetLog.push(packet);

};


var reset = function(){

    sourceLog = [];
    msgLog = [];
    packetLog = [];

};

reset();
//
//
//var b = Catbus.fromEvent(emitter, 'boo');
//b.transform(function(msg){ return msg + '-cat';});
//b.run(log);


describe('Catbus', function(){

    describe('Bus', function(){




        describe('basic sync flow', function() {


            beforeEach(reset);

            it('creates an event bus', function () {

                var b = Catbus.fromEvent(dice, 'roll');
                b.run(log);

                dice.emit('roll', 5);
                dice.emit('roll', 3);
                dice.emit('drop', 1);
                dice.emit('roll', 0);

                b.destroy();

                assert.equal(msgLog.length, 3);
                assert.equal(msgLog[1], 3);
                assert.equal(msgLog[2], 0);
                assert.equal(sourceLog[2], 'roll');

            });

            it('destroys an event bus', function () {

                var b = Catbus.fromEvent(dice, 'roll');
                b.run(log);

                dice.emit('roll', 5);

                b.destroy();

                dice.emit('roll', 3);
                dice.emit('drop', 1);
                dice.emit('roll', 0);


                assert.equal(msgLog.length, 1);
                assert.equal(msgLog[0], 5);

            });


            it('transforms messages', function () {

                reset();

                var b = Catbus.fromEvent(dice, 'roll');
                b.transform(function(msg){ return msg * 2});
                b.run(log);

                dice.emit('roll', 5);
                dice.emit('roll', 3);
                dice.emit('drop', 1);
                dice.emit('roll', 0);

                b.destroy();

                assert.equal(msgLog.length, 3);
                assert.equal(msgLog[1], 6);
                assert.equal(msgLog[2], 0);
                assert.equal(sourceLog[2], 'roll');

            });

            it('filters messages', function () {

                reset();

                var b = Catbus.fromEvent(dice, 'roll');
                b.transform(function(msg){ return msg * 2});
                b.filter(function(msg){ return msg < 6});
                b.run(log);

                dice.emit('roll', 5);
                dice.emit('roll', 3);
                dice.emit('drop', 1);
                dice.emit('roll', 0);
                dice.emit('roll', 2);

                b.destroy();

                assert.equal(msgLog.length, 2);
                assert.equal(msgLog[0], 0);
                assert.equal(msgLog[1], 4);
                assert.equal(sourceLog[1], 'roll');

            });

            it('can skip duplicate messages', function () {

                reset();

                var b = Catbus.fromEvent(dice, 'roll');
                b.transform(function(msg){ return msg * 2});
                b.skipDupes();
                b.run(log);

                dice.emit('roll', 5);
                dice.emit('drop', 1);
                dice.emit('roll', 5);
                dice.emit('roll', 3);
                dice.emit('roll', 3);
                dice.emit('roll', 3);
                dice.emit('roll', 5);

                b.destroy();

                assert.equal(msgLog.length, 3);
                assert.equal(msgLog[0], 10);
                assert.equal(msgLog[1], 6);
                assert.equal(msgLog[2], 10);
                assert.equal(sourceLog[1], 'roll');

            });

            it('can keep multiple messages using last', function () {

                reset();

                var b = Catbus.fromEvent(dice, 'roll');
                b.transform(function(msg){ return msg * 2});
                b.last(3);
                b.run(log);

                dice.emit('roll', 5);
                dice.emit('drop', 1);
                dice.emit('roll', 5);
                dice.emit('roll', 3);
                dice.emit('roll', 3);
                dice.emit('roll', 3);
                dice.emit('roll', 7);

                b.destroy();

                var lastMsg = msgLog[msgLog.length-1];

                assert.equal(lastMsg.length, 3);
                assert.equal(lastMsg[2], 14);


            });

            it('can keep multiple messages using first', function () {

                reset();

                var b = Catbus.fromEvent(dice, 'roll');
                b.transform(function(msg){ return msg * 2});
                b.first(2);
                b.run(log);

                dice.emit('roll', 5);
                dice.emit('drop', 1);
                dice.emit('roll', 4);
                dice.emit('roll', 3);
                dice.emit('roll', 3);
                dice.emit('roll', 3);
                dice.emit('roll', 7);

                b.destroy();

                var lastMsg = msgLog[msgLog.length-1];

                assert.equal(lastMsg.length, 2);
                assert.equal(lastMsg[1], 8);


            });

            it('can keep all messages using all', function () {

                reset();

                var b = Catbus.fromEvent(dice, 'roll');
                b.transform(function(msg){ return msg * 2});
                b.all();
                b.run(log);

                dice.emit('roll', 5);
                dice.emit('drop', 1);
                dice.emit('roll', 4);
                dice.emit('roll', 3);
                dice.emit('roll', 3);
                dice.emit('roll', 3);
                dice.emit('roll', 7);

                b.destroy();

                var lastMsg = msgLog[msgLog.length-1];

                assert.equal(lastMsg.length, 6);
                assert.equal(lastMsg[5], 14);


            });


            it('can delay messages', function () {

                reset();

                this.clock = sinon.useFakeTimers();

                var b = Catbus.fromEvent(dice, 'roll');
                b.transform(function(msg){ return msg * 2});
                b.delay(100);
                b.run(log);

                dice.emit('roll', 5);
                dice.emit('drop', 1);
                dice.emit('roll', 4);
                dice.emit('roll', 3);
                dice.emit('roll', 3);
                dice.emit('roll', 3);
                dice.emit('roll', 7);

                assert.equal(msgLog.length, 0);

                this.clock.tick(50);

                assert.equal(msgLog[0], undefined);

                this.clock.tick(110);

                b.destroy();

                assert.equal(msgLog[0], 10);
                assert.equal(msgLog[5], 14);

                this.clock.restore();
            });


            it('can batch messages', function () {

                reset();

                this.timeout(1000);

                this.clock = sinon.useFakeTimers();

                var b = Catbus.fromEvent(dice, 'roll');
                b.transform(function(msg){ return msg * 2});
                b.delay(100);
                b.hold();
                b.last(2);
                b.batch();
                b.run(log);

                dice.emit('roll', 5);
                dice.emit('drop', 1);
                dice.emit('roll', 4);
                dice.emit('roll', 3);
                dice.emit('roll', 3);
                dice.emit('roll', 3);
                dice.emit('roll', 7);

                this.clock.tick(1);

                assert.equal(msgLog.length, 0);

                this.clock.tick(110);

                Catbus.flush();

                assert.equal(msgLog.length, 1);
                assert.equal(msgLog[0][0], 6);
                assert.equal(msgLog[0][1], 14);

                b.destroy();

                this.clock.restore();
            });


            it('can add buses together', function () {

                reset();

                var b1 = Catbus.fromEvent(dice, 'roll');
                b1.transform(function(msg){ return msg * 2});

                var b2 = Catbus.fromEvent(dice, 'drop');
                b2.transform(function(msg){ return -msg});

                b1.add(b2);
                b1.run(log);

                dice.emit('roll', 5);
                dice.emit('drop', 1);
                dice.emit('roll', 4);
                dice.emit('roll', 3);
                dice.emit('roll', 3);
                dice.emit('roll', 3);
                dice.emit('roll', 7);

                b1.destroy();
                b2.destroy();

                assert.equal(msgLog.length, 7);
                assert.equal(msgLog[1], -1);
                assert.equal(msgLog[6], 14);


            });

            it('can group by source', function (done) {

                reset();

                console.log('groupies\n');
                this.timeout(1000000);


                var b1 = Catbus.fromEvent(dice, 'roll');
                b1.transform(function(msg){ return msg * 2});

                var b2 = Catbus.fromEvent(dice, 'drop');
                b2.transform(function(msg){ return -msg});

                b1.add(b2);
                b1.merge();
                b1.group();
                b1.last(3);
                b1.batch();
                b1.run(log);

                console.log('b2 DESTROY');

                //b2.destroy();
                dice.emit('roll', 5);
                dice.emit('drop', 1);
                dice.emit('roll', 4);
                dice.emit('roll', 3);
                dice.emit('roll', 3);
                dice.emit('roll', 3);
                dice.emit('roll', 7);


                function assertLater(){

                    Catbus.flush();
                    assert.equal(msgLog.length, 1);
                    assert.equal(msgLog[0].roll[2], 14);
                    assert.equal(msgLog[0].drop[0], -1);

                }

                setTimeout(function(){

                    assertLater();
                    b1.destroy();
                    b2.destroy();
                    done();

                }, 200);



            });

        });




        // todo activate/deactivate bus

        // todo ready, clear, latch



    });


});


