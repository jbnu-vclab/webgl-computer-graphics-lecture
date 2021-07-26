"use strict";

//Classes
import Shader  from '../_classes/Shader.js';
import Renderer from '../_classes/Renderer.js';
import Camera from '../_classes/Camera.js';
import Model from '../_classes/Model.js';
import Texture from '../_classes/Texture.js';

//Shaders
//두 셰이더 모두 아래 코드에 직접 구현했습니다.
//Ambient, Diffuse, Specular까지 구현이 완료된 이후에 별도 파일로 옮길겁니다.

const {mat2, mat3, mat4, vec2, vec3, vec4} = glMatrix;

var lightDiffuseVertexShader = `#version 300 es
  layout(location=0) in vec3 a_position; 
  layout(location=1) in vec2 a_texcoord;
  layout(location=2) in vec3 a_normal;

  uniform mat4 u_projection; 
  uniform mat4 u_view; //카메라를 통해 반환된 View행렬
  uniform mat4 u_model; //모델의 world공간 위치와 자세

  out vec2 v_texcoord;
  out vec3 v_normal; 

  void main() {
    gl_Position = u_projection * u_view * u_model * vec4(a_position,1.0); 
    v_texcoord = a_texcoord;

    //normal vector는 특별한 변환법이 필요합니다.
    //https://www.youtube.com/watch?v=d3EUd2HxsO4
    v_normal = mat3(transpose(inverse(u_model))) * a_normal;
  }
`;

var lightDiffuseFragmentShader = `#version 300 es
  precision highp float;

  struct DirectionalLight
  {
    vec3 lightColor;
    float ambientIntensity;
    // Diffuse 계산을 위해 필요한 추가 데이터
    vec3 direction;
    float diffuseIntensity;
  };

  layout(location=0) out vec4 outColor;

  uniform sampler2D u_mainTexture;
  uniform DirectionalLight u_directionalLight; 

  in vec2 v_texcoord; 
  in vec3 v_normal; 

  void main() {
    //--Ambient
    vec3 lightAmbient = u_directionalLight.lightColor * u_directionalLight.ambientIntensity;

    //--Diffuse
    float cosAngle = dot(normalize(v_normal), normalize(-u_directionalLight.direction));
    float diffuseFactor = max(cosAngle, 0.0);
    vec3 lightDiffuse = u_directionalLight.lightColor * u_directionalLight.diffuseIntensity * diffuseFactor;

    //조명에 의한 색상과 모델 머티리얼 색상값을 곱하여 최종 색상으로 결정합니다.
    outColor = texture(u_mainTexture, v_texcoord) * vec4(lightAmbient + lightDiffuse,1.0);
  }
`;

// Light Class (Ambient + Diffuse)
class Light {
  lightColor;
  ambientIntensity;
  // Diffuse계산을 위해 필요한 추가 데이터
  direction;
  diffuseIntensity;

  constructor(lightColor, aIntensity, dir, dIntensity)
  {
    this.lightColor = lightColor;
	  this.ambientIntensity = aIntensity;
    this.direction = dir;
    this.diffuseIntensity = dIntensity;
  }
  
  UseLight(gl,shader)
  {
    shader.SetUniform3f(gl,"u_directionalLight.lightColor", this.lightColor[0], this.lightColor[1], this.lightColor[2]);
	  shader.SetUniform1f(gl,"u_directionalLight.ambientIntensity", this.ambientIntensity);

    shader.SetUniform3f(gl,"u_directionalLight.direction", this.direction[0], this.direction[1], this.direction[2]);
	  shader.SetUniform1f(gl,"u_directionalLight.diffuseIntensity", this.diffuseIntensity);
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
  let mainLight = new Light([1.0,1.0,1.0], 0.0, //<--Ambient Data
                            [2.0, -1.0, -2.0], 1.0); //<--light direction, diffuse intensity

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
  let shader = new Shader(gl,lightDiffuseVertexShader,lightDiffuseFragmentShader);
  shader.Bind(gl);
  shader.SetUniformMat4f(gl, "u_projection", proj);
  shader.Unbind(gl);

  //---Renderer Initialize
  let renderer = new Renderer();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

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