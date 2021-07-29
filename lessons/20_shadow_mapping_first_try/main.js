"use strict";

//Classes
import Shader  from '../_classes/Shader.js';
import Renderer from '../_classes/Renderer.js';
import OrbitCamera from '../_classes/OrbitCamera.js';
import Model from '../_classes/Model.js';
import Texture from '../_classes/Texture.js';
import Material from '../_classes/Material.js';
import {DirectionalLight} from '../_classes/ShadowLight.js';


//Shaders
//깊이맵 생성 셰이더
import dirDepthmapVertexShader from '../_shaders/dirDepthmapVertex.js';
import dirDepthmapFragmentShader from '../_shaders/dirDepthmapFragment.js';

//깊이맵 사용 그림자 셰이더
var dirShadowVertexShader = `#version 300 es
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
`;

var dirShadowFragmentShader = `#version 300 es
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

  //z는 현재 그리려는 픽셀 위치의 depth map에 저장된 깊이값
  float z = texture(u_depthMap, projCoords.xy).r;
  //d는 light로부터 현재 그리려는 픽셀까지의 깊이값
  float d = projCoords.z; 

  //실제 거리가 depth map에 저장된 값보다 크면 1.0을, 작으면 0.0을 반환
  float shadowFactor = d > z ? 1.0 : 0.0;

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

const {mat2, mat3, mat4, vec2, vec3, vec4} = glMatrix;

async function main() {
  // Get A WebGL context
  let canvas = document.querySelector("#c");
  let gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }
  
  //---Model Loading
  let ground = new Model();
  ground.LoadModel(gl, '../../resources/models/plane/SubdividedPlane_100.obj')

  let teapot = new Model();
  teapot.LoadModel(gl, '../../resources/models/teapot/teapot.obj')

  //--Texture Loading
  let checkerTexture = new Texture(gl);
  checkerTexture.LoadeTextureFromImage(gl,'../../resources/uv-grid.png');

  let internetTexture = new Texture(gl);
  internetTexture.LoadeTextureFromImage(gl, 'https://c1.staticflickr.com/9/8873/18598400202_3af67ef38f_q.jpg')
    
  //--Light Define
  let mainLight = new DirectionalLight(gl, 512, 512, //<--Depth map data
                                      [1.0,1.0,1.0], 0.1, //<--Ambient Data
                                      [2.0, -1.0, -2.0], 1.0); //<--light direction, diffuse intensity

  //--Material Define
  let shineMat = new Material(5.0, 32.0); // 반사도가 높은 머티리얼
  let dullMat = new Material(0.5, 3.0); // 반사도가 낮은 머티리얼

  //---Camera(view) Initialize
  let eye = [0.0, 0.0, 5.0];
  let at = [0.0, 0.0, 0.0];
  let up = [0.0, 1.0, 0.0];
  let yaw = -90.0;
  let pitch = -45.0;
  let distance = 5.0;
  let turnspeed = 10.0;
  let mainCamera = new OrbitCamera(eye,at,up,yaw,pitch,distance,turnspeed);
  
  //---Projection Initialize
  let fovRadian = 60.0 * Math.PI / 180;
  let aspect = gl.canvas.clientWidth/gl.canvas.clientHeight;
  let proj = mat4.create();
  mat4.perspective(proj, fovRadian, aspect, 0.1, 100.0);

  //---Shader Initialize
  // Depth map을 생성하는 shader (1st pass)
  let depthMapShader = new Shader(gl,dirDepthmapVertexShader,dirDepthmapFragmentShader);
  // Depth map을 사용해 그림자를 포함하여 장면을 그리는 shader (2nd pass)
  let shadowShader = new Shader(gl,dirShadowVertexShader,dirShadowFragmentShader);
  
  //---Renderer Initialize
  let renderer = new Renderer();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  //---Options
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  //--------------------UI Setting---------------------//
  webglLessonsUI.setupSlider("#camera-yaw", {slide: updateCameraYaw, min: -180, max: 180, step: 0.1});
  webglLessonsUI.setupSlider("#camera-pitch", {slide: updateCameraPitch, min: -90, max: 90, step: 0.1});
  webglLessonsUI.setupSlider("#camera-distance", {slide: updateCameraDistance, min: 0, max: 100, step: 0.1});
  
  webglLessonsUI.setupSlider("#Light-X-direction", {slide: updateLightXDir, min: -10, max: 10, step: 0.1});
  webglLessonsUI.setupSlider("#Light-Y-direction", {slide: updateLightYDir, min: -10, max: 10, step: 0.1});
  webglLessonsUI.setupSlider("#Light-Z-direction", {slide: updateLightZDir, min: -10, max: 10, step: 0.1});
  webglLessonsUI.setupSlider("#Light-Far-plane", {slide: updateLightFarPlane, min: 0.1, max: 100, step: 0.1});
  
  webglLessonsUI.setupSlider("#Teapot-Y-Rotation", {slide: updateTeapotYRotation, min: -180, max: 180, step: 0.1});
  webglLessonsUI.setupSlider("#Ground-Y-Position", {slide: updateGroundYPosition, min: -10, max: 5, step: 0.1});
  
  let teapotYRoatation = 0;
  let groundYPosition = 0;
  //---------------------------------------------------//

  requestAnimationFrame(drawFrame);

  function drawScene(shader)
  {
    // 주전자 1 그리기
    let modelMat = mat4.create();
    mat4.scale(modelMat, modelMat, [0.05, 0.05, 0.05]);
    mat4.translate(modelMat, modelMat, [20.0, 10.0, 0.0]);
    mat4.rotateY(modelMat, modelMat, teapotYRoatation * Math.PI / 180.0);
    shader.SetUniformMat4f(gl, "u_model", modelMat);

    checkerTexture.Bind(gl,0);
    shader.SetUniform1i(gl, "u_mainTexture", 0);
    shineMat.UseMaterial(gl, shader);

    teapot.RenderModel(gl, shader);

    // 주전자 2 그리기
    modelMat = mat4.create();
    mat4.scale(modelMat, modelMat, [0.05, 0.05, 0.05]);
    mat4.translate(modelMat, modelMat, [-20.0, 10.0, 0.0]);
    mat4.rotateY(modelMat, modelMat, teapotYRoatation * Math.PI / 180.0);
    shader.SetUniformMat4f(gl, "u_model", modelMat);

    dullMat.UseMaterial(gl, shader);

    teapot.RenderModel(gl, shader);

    // 바닥면 그리기
    modelMat = mat4.create();
    mat4.translate(modelMat, modelMat, [0, groundYPosition, 0]);
    mat4.scale(modelMat, modelMat, [0.1, 0.1, 0.1]); 
    
    shader.SetUniformMat4f(gl, "u_model", modelMat);

    internetTexture.Bind(gl,0);
    shader.SetUniform1i(gl, "u_mainTexture", 0);
    dullMat.UseMaterial(gl, shader);

    ground.RenderModel(gl, shader);
  }

  function drawFrame()
  {
    //그림자 효과 구현을 위해서는 장면을 두번 그려야 합니다. 
    //한번은 depth map 생성을 위해 조명 시점에서 그리고
    //두 번째는 실제 카메라 위치에서 그림자를 포함하는 장면을 그릴 겁니다. 
    
    // --- 1st pass--- //
    {
      mainLight.depthMap.Bind(gl); 
      gl.viewport(0, 0, mainLight.depthMapWidth, mainLight.depthMapHeight); 
      
      renderer.Clear(gl);
      
      depthMapShader.Bind(gl); //depth map 생성 shader
      mainLight.UseLightForShadow(gl, depthMapShader); //View Projection 설정

      drawScene(depthMapShader); // 각 모델의 Model 설정 후 Depth map에 그리기
      
      mainLight.depthMap.Unbind(gl); //(주의!) depth map을 위한 FBO를 unbind하지 않으면 2nd pass에서 화면에 표시되는 프레임 버퍼가 그려지지 않음!
      depthMapShader.Unbind(gl);
    }

    // --- 2nd pass--- //
    {
      //화면 크기 재조정
  	  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      renderer.Clear(gl);

      shadowShader.Bind(gl); //장면 그리기 shader
      mainLight.depthMap.Read(gl,1); //1번 슬롯에 depth map을 바인딩합니다.
      shadowShader.SetUniform1i(gl, "u_depthMap", 1);

      var view = mainCamera.CalculateViewMatrix();
      shadowShader.SetUniformMat4f(gl, "u_view", view);
	    shadowShader.SetUniformMat4f(gl, "u_projection", proj);

      var eyePos = mainCamera.eye;
	    shadowShader.SetUniform3f(gl,"u_eyePosition", eyePos[0], eyePos[1],eyePos[2]);

      mainLight.UseLight(gl, shadowShader);

      drawScene(shadowShader);

      shadowShader.Unbind(gl);
    }
   
    requestAnimationFrame(drawFrame);
  }

  //slider의 값이 변할 때마다 호출되는 함수
  function updateCameraYaw(event, ui)
  {
    mainCamera.yaw = ui.value;
    mainCamera.Update();
  }
  function updateCameraPitch(event, ui)
  {
    mainCamera.pitch = ui.value;
    mainCamera.Update();
  }
  function updateCameraDistance(event, ui)
  {
    mainCamera.distance = ui.value;
    mainCamera.Update();
  }

  function updateLightXDir(event, ui)
  {
    mainLight.SetLightXDir(ui.value);
  }
  function updateLightYDir(event, ui)
  {
    mainLight.SetLightYDir(ui.value);
  }
  function updateLightZDir(event, ui)
  {
    mainLight.SetLightZDir(ui.value);
  }
  function updateLightFarPlane(event, ui)
  {
    mainLight.SetFarPlane(ui.value);
  }

  function updateTeapotYRotation(event, ui)
  {
    teapotYRoatation = ui.value;
  }
  function updateGroundYPosition(event, ui)
  {
    groundYPosition = ui.value;
  }

}

main();