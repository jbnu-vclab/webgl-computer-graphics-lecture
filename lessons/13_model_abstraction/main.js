"use strict";

//Classes
import Shader  from '../_classes/Shader.js';
import Renderer from '../_classes/Renderer.js';
import Camera from '../_classes/Camera.js';
import Model from '../_classes/Model.js';

//Shaders
import basicVertexShader from '../_shaders/basicVertex.js';
import basicFragmentShader from '../_shaders/basicFragment.js';

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
  let shader = new Shader(gl,basicVertexShader,basicFragmentShader);
  shader.Bind(gl);
  shader.SetUniformMat4f(gl, "u_projection", proj); //<-- 특별한 경우가 아니면 proj는 실행도중 변경되지 않으므로 이곳으로 이동
  shader.Unbind(gl);

  //---Renderer Initialize
  let renderer = new Renderer();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  
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
      
      //---육면체 그리기
      rotationAngle += Math.PI * 1 / 180;

      let model = mat4.create();
      mat4.fromXRotation(model, rotationAngle);
      shader.SetUniformMat4f(gl, "u_model", model);

      cube.RenderModel(gl, shader);

      //---주전자 그리기
      model = mat4.create();
      mat4.translate(model, model, [3, 0, 0]);
      mat4.scale(model, model, [0.1, 0.1, 0.1]);
      shader.SetUniformMat4f(gl, "u_model", model);

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