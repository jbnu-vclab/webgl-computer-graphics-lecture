export default
`#version 300 es
layout(location=0) in vec3 a_position; 
layout(location=1) in vec2 a_texcoord;
layout(location=2) in vec3 a_normal;

uniform mat4 u_projection; 
uniform mat4 u_view; 
uniform mat4 u_model;
uniform mat4 u_directionalLightViewProjection; //light space transform matrix

out vec2 v_texcoord;
out vec3 v_normal; 
out vec3 v_worldPosition; 
out vec4 v_lightSpacePos; //fragment의 light space 기준 좌표가 필요

void main() {
  gl_Position = u_projection * u_view * u_model * vec4(a_position,1.0); 

  v_texcoord = a_texcoord;
  v_normal = mat3(transpose(inverse(u_model))) * a_normal;
  
  //정점의 world공간 좌표. specular 계산에 사용
  v_worldPosition = (u_model * vec4(a_position,1.0)).xyz;

  //정점의 조명 공간 좌표. shadow 계산에 사용
  v_lightSpacePos = u_directionalLightViewProjection * u_model * vec4(a_position,1.0);
}
`