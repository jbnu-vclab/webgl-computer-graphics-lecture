export default  
`#version 300 es

precision highp float;

layout(location=0) out vec4 outColor;

uniform vec4 u_color;

void main() {
    outColor = u_color;
}
`