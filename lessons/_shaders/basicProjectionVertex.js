export default  
`#version 300 es

layout(location=0) in vec4 a_position; 
layout(location=1) in vec4 a_color; 

uniform mat4 u_projection; // <-- 4x4 투영 행렬을 uniform으로 받을 겁니다. (즉, CPU로부터 전달받을 겁니다.)

void main() {
  gl_Position = u_projection * a_position; //이제 position은 u_projection에 의해 변환됩니다.
}
`;
