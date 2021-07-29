"use strict";

//Classes
import Shader  from '../_classes/Shader.js';
import Renderer from '../_classes/Renderer.js';
import OrbitCamera from '../_classes/OrbitCamera.js';
import Model from '../_classes/Model.js';
import Texture from '../_classes/Texture.js';
import Material from '../_classes/Material.js';
//import {DirectionalLight} from '../_classes/BasicLight.js';
import {DirectionalLight} from '../_classes/ShadowLight.js';


//Shaders
import dirLightVertexShader from '../_shaders/dirLightVertex.js';
import dirLightFragmentShader from '../_shaders/dirLightFragment.js';

const {mat2, mat3, mat4, vec2, vec3, vec4} = glMatrix;

//--Depth map을 생성하기 위한 shader
var dirDepthMapVertexShader = `#version 300 es
layout(location=0) in vec3 a_position; 

uniform mat4 u_model; //모델의 world공간 위치와 자세
uniform mat4 u_directionalLightViewProjection; //카메라의 VP 행렬

void main() {
  gl_Position = u_directionalLightViewProjection * u_model * vec4(a_position,1.0);
}
`;

var dirDepthMapFragmentShader = `#version 300 es
//프래그먼트 셰이더는 아무것도 하지 않아도 됩니다.
precision highp float;

void main()
{

}
`;

//--Depth map을 화면에 그려보기 위한 shader
var dirDepthMapVisualizationVertexShader = `#version 300 es

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
  gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);

  v_texcoord = a_texcoord;
  v_normal = a_normal;
}
`;

var dirDepthMapVisualizationFragmentShader = `#version 300 es

precision highp float;

layout(location=0) out vec4 outColor;

in vec2 v_texcoord;
in vec3 v_normal;

uniform sampler2D u_depthTexture;

void main() {
  float depthValue = texture(u_depthTexture, v_texcoord).r;
  outColor = vec4(depthValue,depthValue,depthValue,1.0);
}
`;

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
  let dullMat = new Material(5.0, 3.0); // 반사도가 낮은 머티리얼

  //---Camera(view) Initialize
  let eye = [0.0, 0.0, 5.0];
  let at = [0.0, 0.0, 0.0];
  let up = [0.0, 1.0, 0.0];
  let yaw = -90.0;
  let pitch = 0.0;
  let distance = 5.0;
  let turnspeed = 10.0;
  let mainCamera = new OrbitCamera(eye,at,up,yaw,pitch,distance,turnspeed);
  
  //---Projection Initialize
  let fovRadian = 60.0 * Math.PI / 180;
  let aspect = gl.canvas.clientWidth/gl.canvas.clientHeight;
  let proj = mat4.create();
  mat4.perspective(proj, fovRadian, aspect, 0.1, 100.0);

  //---Shader Initialize
  // 1) 이전 강의에서 만든 Lighting 셰이더(이번 강의에서는 사용 안함)
  let shader = new Shader(gl,dirLightVertexShader,dirLightFragmentShader);
  // 2) Depth map을 생성하는 shader
  let depthMapShader = new Shader(gl,dirDepthMapVertexShader,dirDepthMapFragmentShader);
  // 3) Depth map을 화면에 표시하기 위한 셰이더(디버그 용도)
  let textureShader = new Shader(gl,dirDepthMapVisualizationVertexShader,dirDepthMapVisualizationFragmentShader);

  //---Renderer Initialize
  let renderer = new Renderer();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  //---Options
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  //--------------------UI Setting---------------------//
  webglLessonsUI.setupSlider("#Light-X-direction", {slide: updateLightXDir, min: -10, max: 10, step: 0.1});
  webglLessonsUI.setupSlider("#Light-Y-direction", {slide: updateLightYDir, min: -10, max: 10, step: 0.1});
  webglLessonsUI.setupSlider("#Light-Z-direction", {slide: updateLightZDir, min: -10, max: 10, step: 0.1});
  webglLessonsUI.setupSlider("#Light-Far-plane", {slide: updateLightFarPlane, min: 0.1, max: 100, step: 0.1});
  webglLessonsUI.setupSlider("#Teapot-Y-Rotation", {slide: updateTeapotYRotation, min: -180, max: 180, step: 0.1});
  
  let teapotYRoatation = 0;
  //---------------------------------------------------//

  requestAnimationFrame(drawScene);

  function drawScene()
  {
    //그림자 효과 구현을 위해서는 장면을 두번 그려야 합니다. 
    //한번은 depth map 생성을 위해 조명 시점에서 그리고
    //두 번째는 실제 카메라 위치에서 그림자를 포함하는 장면을 그릴 겁니다. (다음 강의)
    //이번에는 두 번째에서 depth map이 잘 생성되었나 확인만 해볼겁니다.

    // --- 1st pass--- //
    {
      depthMapShader.Bind(gl);
      mainLight.UseLightForShadow(gl, depthMapShader);

      // 주전자 그리기
      let model = mat4.create();
      mat4.rotateY(model, model, teapotYRoatation * Math.PI / 180.0);
      mat4.scale(model, model, [0.1, 0.1, 0.1]);
      mat4.translate(model, model, [0.0, 1.0, 0.0]);
      depthMapShader.SetUniformMat4f(gl, "u_model", model);

      mainLight.depthMap.Bind(gl); // depth map 프레임버퍼 바인딩
      gl.viewport(0, 0, mainLight.depthMapWidth, mainLight.depthMapHeight); // depth map에 그리기 때문에 뷰포트도 그에 맞게 조정
      
      renderer.Clear(gl);

      teapot.RenderModel(gl, depthMapShader);
      
      mainLight.depthMap.Unbind(gl); //(주의!) depth map을 위한 FBO를 unbind하지 않으면 2nd pass에서 화면에 표시되는 프레임 버퍼가 그려지지 않음!
      depthMapShader.Unbind(gl);
    }

    {
      //화면 크기 재조정
  	  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      textureShader.Bind(gl); //depth map 가시화를 위한 shader입니다.
      mainLight.depthMap.Read(gl,0); //0번 슬롯에 depth map을 바인딩합니다.
      textureShader.SetUniform1i(gl, "u_depthTexture", 0);

      let modelMat = mat4.create();
      mat4.scale(modelMat, modelMat, [0.1, 0.1, 0.1]); //0.1 크기로 축소하는 model 행렬을 준비합니다. 
      mat4.rotateX(modelMat, modelMat, Math.PI/2); //plane을 x축으로 90도 회전하고,
      textureShader.SetUniformMat4f(gl, "u_model", modelMat);
      var view = mainCamera.CalculateViewMatrix();
      textureShader.SetUniformMat4f(gl, "u_view", view);
	    textureShader.SetUniformMat4f(gl, "u_projection", proj);

      renderer.Clear(gl);

      ground.RenderModel(gl, textureShader); //plane을 화면에 그립니다.

      textureShader.Unbind(gl);
    }
   
    requestAnimationFrame(drawScene);
  }

  //slider의 값이 변할 때마다 호출되는 함수
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

}

main();