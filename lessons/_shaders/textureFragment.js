export default  
`#version 300 es

precision highp float;

layout(location=0) out vec4 outColor;

in vec2 v_texcoord;
in vec3 v_normal;

uniform sampler2D u_mainTexture;

void main() {
    outColor = texture(u_mainTexture, v_texcoord);
}
`