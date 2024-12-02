"use strict";

//Classes
import Shader  from '../_classes/Shader.js';
import Renderer from '../_classes/Renderer.js';
//import Camera from '../_classes/Camera.js';
import OrbitCamera from '../_classes/OrbitCamera.js';
import Model from '../_classes/Model.js';
import Texture from '../_classes/Texture.js';
import Material from '../_classes/Material.js';
import {DirectionalLight} from '../_classes/BasicLight.js';
//Light는 BasicLight.js로 이동하였습니다.
//BasicLight.js에는 Light(base), DirectionalLight(derived)가 있습니다.

//Shaders
import dirLightVertexShader from '../_shaders/dirLightVertex.js';
import dirLightFragmentShader from '../_shaders/dirLightFragment.js';

const {mat2, mat3, mat4, vec2, vec3, vec4} = glMatrix;

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

  //--Texture Loading
  let checkerTexture = new Texture(gl);
  checkerTexture.LoadTextureFromImage(gl,'../../resources/uv-grid.png');

  let internetTexture = new Texture(gl);
  internetTexture.LoadTextureFromImage(gl, 'https://c1.staticflickr.com/9/8873/18598400202_3af67ef38f_q.jpg')
  
  //--Light Define
  let mainLight = new DirectionalLight([1.0,1.0,1.0], 0.1, //<--Ambient Data
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
  let shader = new Shader(gl,dirLightVertexShader,dirLightFragmentShader);
  shader.Bind(gl);
  shader.SetUniformMat4f(gl, "u_projection", proj);
  shader.Unbind(gl);

  //---Renderer Initialize
  let renderer = new Renderer();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  //---Options
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  //--------------------UI Setting---------------------//
  webglLessonsUI.setupSlider("#shininess", {slide: updateShininess, min: 0, max: 200, step: 0.1});
  webglLessonsUI.setupSlider("#camera-yaw", {slide: updateCameraYaw, min: -180, max: 180, step: 0.5});
  webglLessonsUI.setupSlider("#camera-pitch", {slide: updateCameraPitch, min: -90, max: 90, step: 0.5});
  webglLessonsUI.setupSlider("#camera-distance", {slide: updateCameraDistance, min: 0, max: 10, step: 0.1});
  //---------------------------------------------------//

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

      //(중요!) specular 효과를 위해서는 카메라 eye 위치를 전달해 주어야 함!
	    var eyePos = mainCamera.eye;
	    shader.SetUniform3f(gl,"u_eyePosition", eyePos[0], eyePos[1],eyePos[2]);

      //Light 적용
	    mainLight.UseLight(gl, shader);
      
      //---왼쪽 주전자, dullMat으로 그리기
      let model = mat4.create();
      mat4.translate(model, model, [-1.5, 0, 0]);
      mat4.scale(model, model, [0.1, 0.1, 0.1]);
      shader.SetUniformMat4f(gl, "u_model", model);

      checkerTexture.Bind(gl,0);
      shader.SetUniform1i(gl, "u_mainTexture", 0);

      dullMat.UseMaterial(gl, shader);

      teapot.RenderModel(gl, shader);
      
      //---오른쪽 주전자, shineMat으로 그리기
      model = mat4.create();
      mat4.translate(model, model, [1.5, 0, 0]);
      mat4.scale(model, model, [0.1, 0.1, 0.1]);
      shader.SetUniformMat4f(gl, "u_model", model);

      shineMat.UseMaterial(gl, shader);

      teapot.RenderModel(gl, shader);
    }
    
    shader.Unbind(gl);

    requestAnimationFrame(drawScene);
  }

  //slider의 값이 변할 때마다 호출되는 함수
  function updateShininess(event, ui)
  {
    shineMat.shininess = ui.value;
  }
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

}

main();