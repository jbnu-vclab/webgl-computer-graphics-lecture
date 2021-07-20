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
  //1. 빨간색으로 그리기
  outColor = vec4(1.0,0.0,0.0,1.0); 
  
  //2. normal값을 가지고 색상 칠해보기
  //vec3 normalColor = (v_normal + 1.0) / 2.0;
  //outColor = vec4(normalColor, 1.0);
  
  //3. texcoord값을 가지고 색상 칠해보기
  //outColor = vec4(v_texcoord, 0.0, 1.0);
}
`