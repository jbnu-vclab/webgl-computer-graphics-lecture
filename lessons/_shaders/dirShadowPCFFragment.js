export default
`#version 300 es
precision highp float;

struct Light
{
  vec3 lightColor;
  float ambientIntensity;
  float diffuseIntensity;
};

struct DirectionalLight
{
  Light base;
  vec3 direction;
};

struct Material
{
  float specularIntensity;
  float shininess; //sh
};

layout(location=0) out vec4 outColor;

uniform sampler2D u_mainTexture;
uniform DirectionalLight u_directionalLight; 
uniform vec3 u_eyePosition; 
uniform Material u_material; 
uniform sampler2D u_depthMap; //depth map

in vec2 v_texcoord; 
in vec3 v_normal; 
in vec3 v_worldPosition; 
in vec4 v_lightSpacePos; //light 공간 좌표


float CalculateShadowFactor(DirectionalLight light)
{
  //varying은 perspective division을 자동으로 해주지 않기 때문에 직접 해주어야 함
  vec3 projCoords = v_lightSpacePos.xyz / v_lightSpacePos.w;

  //위에서 계산한 projCoord는 NDC상 좌표. 이를 [0,1]로 변환 (xy는 texture 좌표, z는 depth로 사용)
  projCoords = (projCoords * 0.5) + 0.5; 

  //d는 light로부터 현재 그리려는 픽셀까지의 깊이값
  float d = projCoords.z; 

  //Shadow acne를 해결하기 위해 bias를 추가해 보겠습니다.
  //강의 자료에서보다 발전한 알고리즘을 사용합니다.
  vec3 normal = normalize(v_normal);
  vec3 lightDir = normalize(-light.direction);
  float bias = max(0.05*(1.0 - dot(normal,lightDir)), 0.0005);

  //Percentage Close Filtering(PCF)
  //이제 shadowFactor 0 또는 1이 아닌, 중간값을 가질 수 있습니다.
  //주변 9개의 그림자 영역 여부를 계산하여 평균냅니다.
  float shadowFactor = 0.0;
  float texelSizeX = 1.0 / float(textureSize(u_depthMap,0).x);
  float texelSizeY = 1.0 / float(textureSize(u_depthMap,0).y);
  vec2 texelSize = vec2(texelSizeX, texelSizeY);
  for(int x=-1;x<=1;x++)
  {
    for(int y=-1;y<=1;y++)
    {
      float z = texture(u_depthMap, projCoords.xy + vec2(x,y) * texelSize).r;
      shadowFactor += d - bias > z ? 1.0 : 0.0;
    }
  }
  shadowFactor /= 9.0;

  if(d > 1.0)
  {
    shadowFactor = 0.0;
  }

  if(projCoords.x > 1.0 || projCoords.y > 1.0 || projCoords.x < 0.0 || projCoords.y < 0.0)
  {
    shadowFactor = 0.0;
  }

  return shadowFactor;
}

vec3 CalculateLight(Light light, vec3 direction, float shadowFactor) //shadow Factor가 추가됨
{
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
  
  //ambient는 그림자에 영향을 받지 않지만 diffuse와 specular는 그림자 여부에 영향을 받음
  return (lightAmbient + (1.0-shadowFactor) * (lightDiffuse + lightSpecular));
  
}

vec3 CalculateDirectionalLight()
{
  float shadowFactor = CalculateShadowFactor(u_directionalLight);
  return CalculateLight(u_directionalLight.base, u_directionalLight.direction, shadowFactor);
  
}

void main() {
  vec3 lightColor = CalculateDirectionalLight();
  outColor = texture(u_mainTexture, v_texcoord) * vec4(lightColor,1.0);
}
`;