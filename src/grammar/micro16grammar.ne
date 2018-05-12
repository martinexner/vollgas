
MAIN -> line:+ {% id %}


line -> instruction "\n" {% function(d) { var i = d[0]; return (((i.logic << 5) | (i.alu << 3) | (i.shifter << 1)).toString(16).padStart(2, "0") + "1" + i.s.toString(16) + i.b.toString(16) + i.a.toString(16) + i.goto.toString(16).padStart(2, "0")).toUpperCase(); } %}


instruction -> sbus_configuration " = " alu_configuration ("; " logic_configuration):? {% function(d) { return { s: d[0], alu: d[2].alu, a: d[2].a, b: d[2].b, shifter: d[2].shifter, logic: (d[3] && d[3][1].logic) || 0, goto: (d[3] && d[3][1].goto) || 0 }; } %}


sbus_configuration -> writable_register {% id %}

abus_configuration -> readable_register {% id %}

bbus_configuration -> readable_register {% id %}


writable_register -> ("R0" | "R1" | "R2" | "R3" | "R4" | "R5" | "R6" | "R7" | "R8" | "R9" | "R10" | "R11" | "R12") {% function(d) { return 12-parseInt(d[0][0].substr(1)); } %}

readable_register -> (fixedvalue_register | writable_register) {% function(d) { return d[0][0]; } %}

fixedvalue_register -> (register_0000 | register_0001 | register_ffff) {% function(d) { return d[0][0]; } %}

register_0000 -> "0" {% function(d) { return 15; } %}
register_0001 -> "1" {% function(d) { return 14; } %}
register_ffff -> "-1" {% function(d) { return 13; } %}


alu_configuration -> (leftshift_alu_configuration | rightshift_alu_configuration | noshift_alu_configuration) {% function(d) { return d[0][0]; } %}

leftshift_alu_configuration -> "lsh(" alu_calculation ")" {% function(d) { return { shifter: 1, alu: d[1].alu, a: d[1].a, b: d[1].b }; } %}

rightshift_alu_configuration -> "rsh(" alu_calculation ")" {% function(d) { return { shifter: 2, alu: d[1].alu, a: d[1].a, b: d[1].b }; } %}

noshift_alu_configuration -> alu_calculation {% function(d) { return { shifter: 0, alu: d[0].alu, a: d[0].a, b: d[0].b }; } %}


alu_calculation -> (alu_passthrough_calculation | alu_add_calculation | alu_and_calculation | alu_not_calculation) {% function(d) { return d[0][0]; } %}

alu_passthrough_calculation -> abus_configuration {% function(d) { return {a: d[0], b: 15, alu: 0}; } %}

alu_add_calculation -> abus_configuration " + " bbus_configuration {% function(d) { return {a: d[0], b: d[2], alu: 1}; } %}

alu_and_calculation -> abus_configuration " & " bbus_configuration {% function(d) { return {a: d[0], b: d[2], alu: 2}; } %}

alu_not_calculation -> "~" abus_configuration {% function(d) { return {a: d[1], b: 15, alu: 3}; } %}


logic_configuration -> (logic_negative_configuration | logic_zero_configuration | logic_unconditional_configuration) {% function(d) { return d[0][0]; } %}

logic_negative_configuration -> "if N goto " goto_address {% function(d) { return {logic: 1, goto: d[1]}; } %}

logic_zero_configuration -> "if Z goto " goto_address {% function(d) { return {logic: 2, goto: d[1]}; } %}

logic_unconditional_configuration -> "goto " goto_address {% function(d) { return {logic: 3, goto: d[1]}; } %}


goto_address -> uint {% id %}


uint -> [0-9]:+ {% function(d) { return parseInt(d[0].join("")); } %}
