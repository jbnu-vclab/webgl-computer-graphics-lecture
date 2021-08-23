export default
`#version 300 es
precision highp float;

layout(location=0) out vec4 outColor;

uniform vec2 u_resolution;

void main() {
    outColor = vec4((gl_FragCoord.xy / u_resolution), 0, 1);
}
`;