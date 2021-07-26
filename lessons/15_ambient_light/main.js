"use strict";

//Classes
import Shader  from '../_classes/Shader.js';
import Renderer from '../_classes/Renderer.js';
import Camera from '../_classes/Camera.js';
import Model from '../_classes/Model.js';
import Texture from '../_classes/Texture.js';

//Shaders
import basicVertexShader from '../_shaders/basicVertex.js';
//프래그먼트 셰이더는 아래 코드에 직접 구현했습니다.
//Ambient, Diffuse, Specular까지 구현이 완료된 이후에 별도 파일로 옮길겁니다.

const {mat2, mat3, mat4, vec2, vec3, vec4} = glMatrix;

var lightAmbientFragmentShader = `#version 300 es
  precision highp float;

  //GLSL은 C와 유사합니다. 구조체도 사용 가능합니다.
  //먼저 directional light 구조체를 정의합니다.
  struct DirectionalLight
  {
    vec3 lightColor;
    float ambientIntensity;
  };

  layout(location=0) out vec4 outColor;

  uniform sampler2D u_mainTexture;
  uniform DirectionalLight u_directionalLight; //DirectionalLight 구조체를 uniform으로 받을 겁니다.

  in vec2 v_texcoord; 
  in vec3 v_normal; 

  void main() {
    //우선 ambient term만 적용해 봅시다. ambient에 의한 빛의 양은 ambient 조명의 색상 * 강도도 계산됩니다.
    vec3 lightAmbient = u_directionalLight.lightColor * u_directionalLight.ambientIntensity;
    
    //ambient 조명에 의한 색상과 모델의 색상값을 곱하여 최종 색상으로 결정합니다.
    outColor = texture(u_mainTexture, v_texcoord) * vec4(lightAmbient,1.0);
  }
`;

// Light Class (Ambient)
class Light {
  lightColor;
  ambientIntensity;

  constructor(lightColor, aIntensity)
  {
    this.lightColor = lightColor;
	  this.ambientIntensity = aIntensity;
  }
  
  UseLight(gl,shader)
  {
    shader.SetUniform3f(gl,"u_directionalLight.lightColor", this.lightColor[0], this.lightColor[1], this.lightColor[2]);
	  shader.SetUniform1f(gl,"u_directionalLight.ambientIntensity", this.ambientIntensity);
  }
}

async function main() {
  // Get A WebGL context
  let canvas = document.querySelector("#c");
  let gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }
  
  //---Model Loading
  let cube = new Model();
  cube.LoadModel(gl, '../../resources/models/cube/cube.obj')

  let teapot = new Model();
  teapot.LoadModel(gl, '../../resources/models/teapot/teapot.obj')

  //--Texture loading
  let checkerTexture = new Texture(gl);
  checkerTexture.LoadeTextureFromImage(gl,'../../resources/uv-grid.png');

  let internetTexture = new Texture(gl);
  internetTexture.LoadeTextureFromImage(gl, 'https://c1.staticflickr.com/9/8873/18598400202_3af67ef38f_q.jpg')
  
  //--Light define
  let mainLight = new Light([1.0,1.0,1.0], 0.2); //Color=white, intensity=0.2

  //---Camera(view) Initialize
  let eye = [0.0, 0.0, 5.0];
  let up = [0.0, 1.0, 0.0];
  let yaw = -90.0;
  let pitch = 0.0;
  let movespeed = 0.05;
  let turnspeed = 0.5;
  let mainCamera = new Camera(eye,up,yaw,pitch,movespeed,turnspeed);
  
  //---Projection Initialize
  let fovRadian = 90.0 * Math.PI / 180;
  let aspect = gl.canvas.clientWidth/gl.canvas.clientHeight;
  let proj = mat4.create();
  mat4.perspective(proj, fovRadian, aspect, 0.1, 100.0);

  //---Shader Initialize
  let shader = new Shader(gl,basicVertexShader,lightAmbientFragmentShader);
  shader.Bind(gl);
  shader.SetUniformMat4f(gl, "u_projection", proj);
  shader.Unbind(gl);

  //---Renderer Initialize
  let renderer = new Renderer();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  //---Options
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  
  let rotationAngle = 0;

  requestAnimationFrame(drawScene);

  function drawScene()
  {
    //화면 크기 재조정
  	webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    renderer.Clear(gl);

    shader.Bind(gl); //Uniform 설정에 필요하기 때문에 바인딩
    {
      //---카메라 설정(현재는 모든 모델에 대해 동일한 뷰행렬 사용)
      let view = mainCamera.CalculateViewMatrix();
      shader.SetUniformMat4f(gl, "u_view", view);

      //Light 적용
	    mainLight.UseLight(gl, shader);
      
      //---육면체 그리기
      rotationAngle += Math.PI * 1 / 180;

      let model = mat4.create();
      mat4.fromXRotation(model, rotationAngle);
      shader.SetUniformMat4f(gl, "u_model", model);

      internetTexture.Bind(gl,0);
      shader.SetUniform1i(gl, "u_mainTexture", 0);

      cube.RenderModel(gl, shader);
      
      //---주전자 그리기
      model = mat4.create();
      mat4.translate(model, model, [3, 0, 0]);
      mat4.scale(model, model, [0.1, 0.1, 0.1]);
      shader.SetUniformMat4f(gl, "u_model", model);

      checkerTexture.Bind(gl,1);
      shader.SetUniform1i(gl, "u_mainTexture", 1);
      
      teapot.RenderModel(gl, shader);
    }
    
    shader.Unbind(gl);

    requestAnimationFrame(drawScene);
  }

  window.addEventListener('keydown', KeyboardEventHandler);
  window.addEventListener('mousemove', MouseMoveEventHandler);

  //키보드 이벤트 핸들러 함수
  function KeyboardEventHandler(e)
  {
    mainCamera.KeyControl(e); 
  }

  //마우스 이벤트 핸들러 함수
  function MouseMoveEventHandler(e)
  {
    mainCamera.MouseControl(e); 
  }
}

main();