export default
`#version 300 es
  precision highp float;

  struct Light
  {
      vec3 lightColor;
      float ambientIntensity;
      float diffuseIntensity;
  };

  //Directional Light는 Light의 상속으로 정의한것처럼,
  //shader code 안에서는 composition 관계로 정의합니다.
  struct DirectionalLight
  {
    Light base;   
    vec3 direction;
  };

  struct Material
  {
    float specularIntensity;
    float shininess; // == sh
  };

  layout(location=0) out vec4 outColor;

  uniform sampler2D u_mainTexture;
  uniform DirectionalLight u_directionalLight; 
  uniform vec3 u_eyePosition; // v벡터를 구하기 위해서는 카메라 위치가 필요
  uniform Material u_material; // material 객체

  in vec2 v_texcoord; 
  in vec3 v_normal; 
  in vec3 v_worldPosition; // 정점 셰이더의 worldPosition varying

  //CalculateLight 함수를 별도로 분리했습니다.
  vec3 CalculateLight(Light light, vec3 direction)
  {
      //normalize normal first
      vec3 normal = normalize(v_normal);
      
      //ambient
      vec3 lightAmbient = light.lightColor * light.ambientIntensity;
      
      //diffuse
      vec3 lightDir = normalize(-direction);
      float diffuseFactor = max(dot(normal, lightDir), 0.0);
      vec3 lightDiffuse = light.lightColor * light.diffuseIntensity * diffuseFactor;
      
      //specular
      vec3 vVec = normalize(u_eyePosition - v_worldPosition);
      vec3 rVec = 2.0 * normal * dot(normal, lightDir) - lightDir;
      vec3 lightSpecular = pow(max(dot(rVec,vVec),0.0),u_material.shininess) * light.lightColor * u_material.specularIntensity;
      
      return (lightAmbient + lightDiffuse + lightSpecular);
  }

  vec3 CalculateDirectionalLight()
  {
      return CalculateLight(u_directionalLight.base, u_directionalLight.direction);
  }

  void main() {
    vec3 lightColor = CalculateDirectionalLight();

    outColor = texture(u_mainTexture, v_texcoord) * vec4(lightColor,1.0);
  }
`;