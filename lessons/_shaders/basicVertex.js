export default  
`#version 300 es
//이제 일반적인 형태의 정점 셰이더를 구현합니다.
//각 정점은 position(위치 좌표), texcoord(텍스처 좌표), normal(법선) 데이터를 가집니다.

//--Attributes
layout(location=0) in vec3 a_position; 
layout(location=1) in vec2 a_texcoord; 
layout(location=2) in vec3 a_normal; 

//--Uniforms
uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_model;

//--Varyings
out vec2 v_texcoord;
out vec3 v_normal;

void main() {
  gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0); //이제 a_position이 vec3이기 때문에 vec4로 만들어 곱해줘야 합니다.

  //프래그먼트 셰이더로 값을 넘김
  v_texcoord = a_texcoord;
  v_normal = a_normal;
}
`;
