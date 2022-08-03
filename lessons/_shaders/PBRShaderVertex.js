// dirLightVertex와 동일한 Source

export default
`#version 300 es
  layout(location=0) in vec3 a_position; 
  layout(location=1) in vec2 a_texcoord;
  layout(location=2) in vec3 a_normal;

  uniform mat4 u_projection; 
  uniform mat4 u_view; //카메라를 통해 반환된 View행렬
  uniform mat4 u_model; //모델의 world공간 위치와 자세

  out vec2 v_texcoord;
  out vec3 v_normal; 
  out vec3 v_worldPosition; 

  void main() {
    gl_Position = u_projection * u_view * u_model * vec4(a_position,1.0); 
    v_texcoord = a_texcoord;

    v_normal = mat3(transpose(inverse(u_model))) * a_normal;

    v_worldPosition = (u_model * vec4(a_position, 1.0)).xyz; //<-- 모델 행렬만 곱하면 월드공간 좌표가 얻어집니다.
  }
`;