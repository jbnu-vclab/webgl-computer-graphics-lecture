export default
`#version 300 es
layout(location=0) in vec3 a_position; 

uniform mat4 u_model; //모델의 world공간 위치와 자세
uniform mat4 u_directionalLightViewProjection; //카메라의 VP 행렬

void main() {
  gl_Position = u_directionalLightViewProjection * u_model * vec4(a_position,1.0);
}
`;