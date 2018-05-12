
MAIN -> description {% id %}

description -> (config whsp):? elements {% function(d) { return {config: d[0] !== null ? d[0][0] : [], elements: d[1]}; } %}


config -> config_entry (sep config):? {% function(d) { return [d[0]].concat(d[1] !== null ? d[1][1] : []); } %}

config_entry -> name "=" minus_string {% function(d) { return {key: d[0], value: d[2]}; } %}


elements -> element (whsp elements):? {% function(d) { return [d[0]].concat(d[1] ? d[1][1] : []); } %}

sep -> " " | "\t" | "*" | "\n"
optsep -> null | sep

whsp -> "  " | "**" | "\t\t" | "\n\n"

element -> name sep type params sep base outside_inputs outside_outputs wires {% function(d) {
	return {
		name: d[0],
		type: d[2],
		parameters: d[3],
		base: d[5],
		outsideInputs: d[6],
		externalOutputs: d[7],
		wires: d[8]
	};
} %}


name -> [a-z] string:? {% function(d) { return d[0] + (d[1] || ""); } %}
type -> name {% id %}


string -> [a-zA-Z0-9_]:+ {% function(d) { return d[0].join(""); } %}
minus_string -> [a-zA-Z0-9_-]:+ {% function(d) { return d[0].join(""); } %}


params -> (sep params_init {% function(d) { return d[1]; } %}):* {% id %}

params_init -> name optsep "=" optsep string {% function(d) { return {key: d[0], value: d[4]}; } %}


base -> local_connector:? "@" coordinates_remote {% function(d) { return d[0] ? {base: d[0], coordinates: d[2]} : d[2]; } %}


connector_type -> ("i" | "o") {% function(d) { return d[0][0] === "i" ? "input" : "output"; } %}

local_connector -> connector_type uint {% function(d) { return {connector: d[0], index: d[1] }; } %}

remote_connector -> name "/" local_connector {% function(d) { return {name: d[0], connector: d[2].connector, index: d[2].index}; } %}

coordinates_remote -> (coordinates_remote_separate | remote_connector) {% function(d) { return d[0][0]; } %}

coordinates_remote_separate -> (coordinate_remote ":" coordinate_remote) {% function(d) { return {x: d[0][0], y: d[0][2]}; } %}

coordinate_remote -> (coordinate | remote_connector | remote_connector_delta) {% function(d) { return d[0][0]; } %}

remote_connector_delta -> remote_connector coordinate_delta {% function(d) { return {delta: d[1], from: d[0]}; } %}

coordinates_reference -> (coordinates_reference_separate | remote_connector) {% function(d) { return d[0][0]; } %}

coordinates_reference_separate -> (coordinate_reference ":" coordinate_reference) {% function(d) { return {x: d[0][0], y: d[0][2]}; } %}

coordinate_reference -> (coordinate_remote | coordinate_reference_base | coordinate_reference_base_delta) {% function(d) { return d[0][0]; } %}

coordinate_reference_base_delta -> coordinate_reference_base coordinate_delta {% function(d) { return {delta: d[1], from: d[0]}; } %}

coordinate_reference_base -> ("p" | "n") {% function(d) { return d[0][0] === "n" ? "next" : "prev"; } %}

coordinate_delta -> ("+" | "-") uint {% function(d) { return d[0][0] === "-" ? -1*d[1] : d[1]; } %}

coordinate -> uint {% id %}



outside_inputs -> (sep outside_input_init {% function(d) { return d[1]; } %}):* {% id %}

outside_input_init -> (uint optsep):? "<" optsep uint ("+" uint):? {% function(d) { return {inputIndex: d[0] !== null ? d[0][0] : null, outputIndex: d[3], more: d[4] !== null ? d[4][1] : 0}; } %}



outside_outputs -> (sep outside_output_init {% function(d) { return d[1]; } %}):* {% id %}

outside_output_init -> uint ("+" uint):? optsep ">>" {% function(d) { return {outputIndex: d[0], more: d[1] !== null ? d[1][1] : 0}; } %}



wires -> (sep wire_init {% function(d) { return d[1]; } %}):* {% id %}

wire_init -> wire_output:? wire ("=" ("true" | "false")):? {% function(d) { return {outputIndex: d[0] && d[0].outputIndex, more: d[0] && d[0].more, coordinates: d[1], initialValue: d[2] && d[2][1][0] === "true"}; } %}

wire_output -> (uint ("+" uint):?):? (">" | "~") {% function(d) { return {outputIndex: d[0] && d[0][0], more: d[0] && d[0][1] !== null ? d[0][1][1] : 0}; } %}

wire -> (wire_point | wire_terminal) {% function(d) { return d[0][0]; } %}

wire_point -> coordinates_reference ("~" wire):? {% function(d) { return [d[0]].concat(d[1] ? d[1][1] : []); } %}

wire_terminal -> name {% function(d) { return [{name: d[0], connector: "input", index: null}]; } %}



uint -> [0-9]:+ {% function(d) { return parseInt(d[0].join("")); } %}