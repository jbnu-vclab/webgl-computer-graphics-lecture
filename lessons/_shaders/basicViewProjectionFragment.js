export default  
`#version 300 es

precision highp float;

layout(location=0) out vec4 outColor;

uniform vec4 u_color;

void main() {
  outColor = u_color; //Shader 클래스의 동작 확인을 위해 uniform 색상으로 그리도록 수정
}
`