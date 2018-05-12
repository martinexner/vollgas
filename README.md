# vollgas

## What

vollgas is a very basic, completely browser-based simulator for logic gates and circuits thereof.
It compiles circuits to [WebAssembly](https://webassembly.org/) modules (version 1.0 a.k.a. [MVP](https://webassembly.org/docs/mvp/)) for faster execution and can visualize their simulation using WebGL (via [PixiJS](http://www.pixijs.com/)).
The non-graphical part can also be run in [Node.js](https://nodejs.org/).

## Where

Demos are available at <https://martinexner.github.io/vollgas/>.

## Why

Because I wanted to verify that it is possible to completely simulate the circuit of the Micro16 microprocessor ([slow demo](https://martinexner.github.io/vollgas/demo.html), [fast demo](https://martinexner.github.io/vollgas/demo.html#fast)) as taught in [Technische Grundlagen der Informatik](https://tiss.tuwien.ac.at/course/courseDetails.xhtml?courseNr=183579) on the [TU Wien](https://www.tuwien.ac.at/) (minus the external memory access).
As it turns out it is, with non-graphical performance ([demo](https://martinexner.github.io/vollgas/demo.html#vollgas)) ranging from around 50 instructions simulated per second on a [Nexus 5](https://en.wikipedia.org/wiki/Nexus_5) to up to 800 on modern computers.

## How

### Building

To build the demo:
1. Get [npm](https://www.npmjs.com/)
2. `cd` into the project's root directory
3. Install dependencies by running `npm install`
4. Build the project by running `npm run build` (or `npm run build-prod` for a production build)

Step 4 will first compile the typescript files to javascript and then bundle them together via [webpack](https://webpack.js.org/). The resulting javascript bundle will be written to `docs/demo.js`. Open `docs/demo.html` in a browser to run the default demo or `docs/index.html` to see all demo circuits.

### Using the demo

By default, the demo will slowly simulate running `R0 = R0 + 1` in an endless loop on the Micro16 microprocessor. Different simulations can be run by appending a fragment identifier to the URI that is used to open `docs/demo.html` in a browser:

1. `R0 = R0 + 1` endless loop, fast: `docs/demo.html#fast` \
   This is the same simulation as the default (when no fragment identifier is given), but with zero-delay wires and executed much faster.

2. Slow microcode simulation: `docs/demo.html#<hexdigits>` \
   By appending a multiple of 8 hex digits as fragment identifier, any Micro16-microcode can be simulated. For example, `docs/demo.html#081CED00681BBE00` will run `R0 = -1 + 1; R1 = 1 + R1` in an endless loop. See [Microcode](#microcode) for details.

3. Fast microcode simulation: `docs/demo.html#fast:<hexdigits>` \
   Like the above, but with zero-delay wires and faster.

4. Circuit description: `docs/demo.html#<grammar>` \
   Simulates any circuit described using the circuit description grammar. See [Grammar](#grammar) for details.

### Microcode

The Micro16 microcode consist of one or more microinstructions, each 32 bits in length. The microinstruction layout is the original Micro16 microinstruction layout with those bits responsible for external memory access ignored:

| bit | usage                 | bit | usage             |
|----:|:----------------------|----:|:------------------|
| 0   | unused                | 16  | B register        |
| 1   | conditional branching | 17  | B register        |
| 2   | conditional branching | 18  | B register        |
| 3   | ALU operation         | 19  | B register        |
| 4   | ALU operation         | 20  | A register        |
| 5   | shift                 | 21  | A register        |
| 6   | shift                 | 22  | A register        |
| 7   | unused                | 23  | A register        |
| 8   | unused                | 24  | branching address |
| 9   | unused                | 25  | branching address |
| 10  | unused                | 26  | branching address |
| 11  | unused                | 27  | branching address |
| 12  | S register            | 28  | branching address |
| 13  | S register            | 29  | branching address |
| 14  | S register            | 30  | branching address |
| 15  | S register            | 31  | branching address |

### Grammar

There is a grammar defined in `src/grammar/grammar.ne` which can be used to describe any circuit for simulation. For example, the [circular NOR demo](https://martinexner.github.io/vollgas/demo.html#n0*nor*@100:100*p+50:p~p:p+50~n:p~n-50:n~n0) is described as `n0*nor*@100:100*p+50:p~p:p+50~n:p~n-50:n~n0`, which translates to:
- a gate with identifier `n0`
- of type `nor`
- located at `(100, 100)` in the visualization canvas
- with a wire going from the coordinates of output 0 ...
  1. ... to `(p+50, p)`, which means the new X coordinate will be the previous X coordinate plus 50 and the Y coordinate stays the same (= go 50 pixels to the right), ...
  2. ... to `(p, p+50)` (= go 50 pixels down) ...
  3. ... to `(n, p)`, which means the new X coordinate is the same as the X coordinate after that and the Y coordinate stays the same (= go to the left), ...
  4. ... to `(n-50, n)`, which means the new X coordinate is the same as the X coordinate after that minus 50 and the new Y coordinate is the same as the Y coordinate after that (= go up), ...
  5. ... and finally into the next free input of the gate with identifier `n0`

### Internals

In vollgas, circuits consist of logic gates connected through wires:

#### Wires

Wires are just ring buffers delaying some output of some gate before forwarding it as input to some other gate.
They are useful for visualizing slow circuit simulations, because you can "watch" the output signal of one gate travel through the wire towards the input of another gate.

For fast simulation, wire delays can be set to zero, in which case gates read other gates' outputs directly and wires just visualize their gate's current output signal which they would normally be delaying (if graphical visualization is enabled at all), resulting in zero simulation cost for wires.

#### Logic gates

Logic gates have zero or more inputs and zero or more outputs.
Typically, gates calculate their output(s) based on their input(s).

Every logic gate is one of the following two things:
1. Either a `NOR` gate, or
2. a circuit of one or more connected, other logic gates.

Therefore, every circuit ultimately consists of `NOR` gates only.

The simplest example for this is the `OR` gate. Based on the equivalence of `(a OR b) = (not (a NOR b))`, the `OR` gate simply consists of two connected `NOR` gates: A `NOR` gate with one or more inputs, whose output is connected to a second, single-input `NOR` gate. The `OR` gate's inputs are passed through to the inputs of the first `NOR` gate and the `OR` gate's output is taken from the second `NOR` gate's output. This can be seen [here](https://martinexner.github.io/vollgas/demo.html#autoSource=true**s0*source*@75:50*>p:n~o0**o0*or*detailed=true*@100:100*<1).

#### Simulation

Because of this design, simulation of the logic gates boils down to repeating this over and over again:
1. For every `NOR` gate in the circuit,
   1. copy relevant signals from other gates' outputs or from wires' ends and store them locally
2. Again for every `NOR` gate in the circuit,
   1. NOR the previously copied signals
   2. Write the result as new output

If there are wires with non-zero delays, the following has to be done additionally every time the above is repeated:
1. For every wire in the circuit,
   1. copy relevant signals from gates' outputs or from other wires' ends and store them locally
2. Again for every wire in the circuit,
   1. Pop the oldest signal(s) from the ring buffer and write them as new output(s)
   2. Queue the previously copied signal(s) into the start of the ring buffer

#### Circuit compilation

Luckily, both the updating of the gates and the updating of the wires can be done pretty fast by compiling the steps for every gate and every wire into a WebAssembly module and running that module.

For example, the following is the compiled WebAssembly code that is used to update a circuit that consists of one `NOR` gate having its output connected to its own input via a zero-delay wire ([demo](https://martinexner.github.io/vollgas/demo.html#delayPerWindowHeight=0*stepsPerSecond=1**n0*nor*@100:100*p+50:p~p:p+50~n:p~n-50:n~n0)):

```
   # copy relevant output signals (= the own output in this case) and
   # store them locally:

0: i32.const 0                   # at address 0 ...
1: i32.const 0                   #   | from address 0 ...
2: i32.load8_u offset=9 align=1  #   | ... with offset 9 read one byte
3: i32.store8 offset=8 align=1   # ... with offset 8 write the byte from line 2

   # calculate the new output signal based on the input signal previously
   # copied and stored locally:

4: i32.const 0                   # at address 0 ...
5: i32.const 0                   #   | from address 0 ...
6: i32.load8_u offset=8 align=1  #   | ... with offset 8 read one byte ...
7: i32.eqz                       #   | ... and return 1 if it equals zero,
                                 #   |     return 0 otherwise (= NOT)
8: i32.store8 offset=9 align=1   # ... with offset 9 write the byte from line 7
```

For the same circuit but with a delaying wire, see the [circular NOR demo](https://martinexner.github.io/vollgas/demo.html#n0*nor*@100:100*p+50:p~p:p+50~n:p~n-50:n~n0).

## License

This project is released under the GNU Affero General Public License version 3, see the `LICENSE` file.