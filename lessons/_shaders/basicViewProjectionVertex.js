export default  
`#version 300 es

layout(location=0) in vec4 a_position; 
layout(location=1) in vec4 a_color; 

uniform mat4 u_projection;
uniform mat4 u_view; //Camera 클래스에서 반환된 view행렬

void main() {
  gl_Position = u_projection * u_view * a_position; //proj * view * (model) * position
}
`;
