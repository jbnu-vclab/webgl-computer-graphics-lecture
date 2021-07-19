"use strict";

//Classes
import VertexBuffer from '../_classes/VertexBuffer.js';
import IndexBuffer from '../_classes/IndexBuffer.js';
import VertexArray  from '../_classes/VertexArray.js';
import Shader  from '../_classes/Shader.js';
import Renderer from '../_classes/Renderer.js';
import Camera from '../_classes/Camera.js';

//Shaders
import basicViewProjectionFragmentShader from '../_shaders/basicViewProjectionFragment.js';
import basicViewProjectionVertexShader from '../_shaders/basicViewProjectionVertex.js';

const {mat2, mat3, mat4, vec2, vec3, vec4} = glMatrix;

function main() {
  // Get A WebGL context
  let canvas = document.querySelector("#c");
  let gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }
  
  //--사각형 데이터
  let rectangleVertices = [ 
    //x     y    r    g    b    a
	  -0.5, -0.5, 1.0, 0.0, 0.0, 1.0, //0번 vertex
     0.5, -0.5, 0.0, 1.0, 0.0, 1.0, //1번 vertex
     0.5,  0.5, 0.0, 0.0, 1.0, 1.0, //2번 vertex
	  -0.5,  0.5, 0.8, 0.2, 0.3, 1.0, //3번 vertex
  ];
  
  let rectangleIndices = [
	  0, 1, 2, //0,1,2번 vertex로 이루어진 삼각형
	  2, 3, 0, //2,3,0번 vertex로 이루어진 삼각형
  ];
  
  let rectVA = new VertexArray(gl); 
  let rectangleVB = new VertexBuffer(gl,rectangleVertices);
  rectVA.AddBuffer(gl, rectangleVB, [2, 4], [false, false]); 
  let rectangleIB = new IndexBuffer(gl, rectangleIndices, 6);

  //이제는 키보드/마우스 입력에 따라 view matrix를 반환하는 Camera를 생성합니다.
  //WASD로 카메라의 eye 위치를 바꾸고, 마우스로 yaw-pitch 각 변경을 통해 
  //forward 벡터 방향을 변경한 뒤, at 위치를 계산하는데 사용합니다.
  let eye = [0.0, 0.0, 5.0];
  let up = [0.0, 1.0, 0.0];
  let yaw = -90.0;
  let pitch = 0.0;
  let movespeed = 0.05;
  let turnspeed = 0.5;
  let mainCamera = new Camera(eye,up,yaw,pitch,movespeed,turnspeed);
  
  //orthographc 대신 perspective projection matrix 사용
  let fovRadian = 90.0 * Math.PI / 180;
  let aspect = gl.canvas.clientWidth/gl.canvas.clientHeight;
  let proj = mat4.create();
  mat4.perspective(proj, fovRadian, aspect, 0.1, 100.0);

  let shader = new Shader(gl,basicViewProjectionVertexShader,basicViewProjectionFragmentShader);
    
  rectVA.Unbind(gl); 
  rectangleVB.Unbind(gl);
  rectangleIB.Unbind(gl);
  shader.Unbind(gl);

  let renderer = new Renderer();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  drawScene();

  function drawScene()
  {
  	webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    renderer.Clear(gl);

    shader.Bind(gl); //Uniform 설정에 필요하기 때문에 바인딩

    shader.SetUniform4f(gl,"u_color", 1.0, 0.0, 0.0, 1.0);

    let view = mainCamera.CalculateViewMatrix();
    shader.SetUniformMat4f(gl, "u_view", view);
    shader.SetUniformMat4f(gl, "u_projection", proj); 

    renderer.Draw(gl, rectVA, rectangleIB, shader);

    rectVA.Unbind(gl);
    shader.Unbind(gl);
  }

  window.addEventListener('keydown', KeyboardEventHandler);
  window.addEventListener('mousemove', MouseMoveEventHandler);

  //키보드 이벤트 핸들러 함수
  function KeyboardEventHandler(e)
  {
    mainCamera.KeyControl(e); // 카메라 클래스의 KeyControl로 이벤트 정보 전달
    drawScene(); // 값이 바뀔때마다 drawScene()으로 화면을 다시 그려야 한다는 것을 잊지 마세요.
  }

  //마우스 이벤트 핸들러 함수
  function MouseMoveEventHandler(e)
  {
    mainCamera.MouseControl(e); // 카메라 클래스의 MouseControl로 이벤트 정보 전달
    drawScene();
  }
}

main();