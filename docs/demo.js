
let desc = window.location.hash.slice(1);
desc = decodeURIComponent(desc);

let disableGraphics = false;

if(desc === "vollgas") {
    disableGraphics = true;
    desc = "fast";
}

if(!desc || desc === "fast") {
    desc = (desc === "fast" ? "fast:" : "") + "681CEC00";
}

let fast = false;

if(desc.startsWith("fast:")) {
    desc = desc.substring("fast:".length);
    fast = true;
}

if(desc.match(/^[0-9A-Fa-f]+$/) && (desc.length % 8) === 0) {

    let params = "";
    let config = "";

    if(fast) {
        params = " instructionDelay=40 aluDelay=100 registersDelay=20";
        config = " delayPerWindowHeight=0 stepsPerSecond=2000";
    }

    desc = `height=1000${config}  x micro16 code=${desc}${params} @100:50`;

}

let vollgas;

if(desc.startsWith("json:")) {
    desc = desc.substring("json:".length);
    vollgas = Vollgas.from(JSON.parse(desc));
} else {
    vollgas = Vollgas.usingGrammar([desc]);
}

if(disableGraphics) {
    vollgas.parseResult.disableGraphics = true;
}

vollgas.init().then((view) => {

    if(view) {

        document.body.appendChild(view);

    } else {

        const cyclesPerStep = vollgas.parseResult.cyclesPerStep || 160;
        const iterations = Math.floor(10000 / cyclesPerStep);

        let f = () => {

            let t0 = performance.now();

            for(let i = 0; i < iterations; i++) {
                vollgas.manualStep(cyclesPerStep);
            }

            let t1 = performance.now();

            const ms = Math.floor(t1-t0);
            const seconds = ms/1000;
            const steps = cyclesPerStep * iterations;
            const stepsPerInstruction = 160;
            const instructions = Math.floor(steps/stepsPerInstruction);
            const instructionsPerSecond = Math.floor(instructions/seconds);

            console.log(`${ms} ms for ${steps} steps; ${steps}/${stepsPerInstruction} = ${instructions} instructions; ${instructions}/${seconds} = ${instructionsPerSecond} instructions per second`);

            let target = window.document.getElementById("ips");
            if(target) {
                target.innerHTML = `${instructionsPerSecond}`;
            }

            setTimeout(f, 0);

        }

        f();

    }

});
