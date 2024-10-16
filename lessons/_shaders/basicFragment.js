export default  
`#version 300 es

precision highp float;

layout(location=0) out vec4 outColor;

//정점 셰이더로부터 전달받은 varying
//각 프래그먼트에 대해 보간된 값이 저장되어 있음
in vec2 v_texcoord;
in vec3 v_normal;

uniform vec4 u_color;

void main() {
  outColor = vec4(1.0,0.0,0.0,1.0); 
}
`