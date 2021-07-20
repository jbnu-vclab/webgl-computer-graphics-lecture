"use strict";

//Classes
import VertexBuffer from '../_classes/VertexBuffer.js';
import IndexBuffer from '../_classes/IndexBuffer.js';
import VertexArray  from '../_classes/VertexArray.js';
import Shader  from '../_classes/Shader.js';
import Renderer from '../_classes/Renderer.js';
import Camera from '../_classes/Camera.js';

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
  
  //이제 모델의 정점 데이터를 직접 정의하지 않고, 외부 파일에서 가져옴
  //모델을 로딩하는 과정에서 freeze가 걸리지 않도록 async/await로 obj 파일을 읽어옵니다. (main함수 앞의 async 주목)  
  //const response = await fetch('../../resources/models/cube/cube.obj'); 
  const response = await fetch('../../resources/models/cube/cube.obj'); 
  const text = await response.text();
  let mesh = new OBJ.Mesh(text); //라이브러리의 Mesh 메소드로 obj를 파싱합니다.
  
  let meshVertexData = []
  
  let vertexCount = mesh.vertices.length/3;
  for(let i=0; i<vertexCount; i++)
  {
    //각 vertex마다 x,y,z,u,v,nx,ny,nz로 데이터가 나열되어 있는 하나의 큰 배열을 생성합니다.
    meshVertexData.push(mesh.vertices[3*i], mesh.vertices[3*i+1], mesh.vertices[3*i+2]);
    meshVertexData.push(mesh.textures[2*i], mesh.textures[2*i+1]);
    meshVertexData.push(mesh.vertexNormals[3*i], mesh.vertexNormals[3*i+1], mesh.vertexNormals[3*i+2]);
  }
  
  let cubeVA = new VertexArray(gl); 
  let cubeVB = new VertexBuffer(gl,meshVertexData);
  //이제 addbuffer에서 position(3개 값), texcoord(2개 값), normal(3개 값)으로 끊어서 읽도록 알려줍니다.
  cubeVA.AddBuffer(gl, cubeVB, [3, 2, 3], [false, false, false]); 
  let cubeIB = new IndexBuffer(gl, mesh.indices, mesh.indices.length);

  let eye = [0.0, 0.0, 5.0];
  let up = [0.0, 1.0, 0.0];
  let yaw = -90.0;
  let pitch = 0.0;
  let movespeed = 0.05;
  let turnspeed = 0.5;
  let mainCamera = new Camera(eye,up,yaw,pitch,movespeed,turnspeed);
  
  let fovRadian = 90.0 * Math.PI / 180;
  let aspect = gl.canvas.clientWidth/gl.canvas.clientHeight;
  let proj = mat4.create();
  mat4.perspective(proj, fovRadian, aspect, 0.1, 100.0);

  let shader = new Shader(gl,basicVertexShader,basicFragmentShader);
    
  cubeVA.Unbind(gl); 
  cubeVB.Unbind(gl);
  cubeIB.Unbind(gl);
  shader.Unbind(gl);

  let renderer = new Renderer();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  let rotationAngle = 0;

  requestAnimationFrame(drawScene);

  function drawScene()
  {
  	webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    renderer.Clear(gl);

    shader.Bind(gl); //Uniform 설정에 필요하기 때문에 바인딩
    shader.SetUniform4f(gl,"u_color", 1.0, 0.0, 0.0, 1.0);

    //이제 vertex shader에는 model matrix도 필요하므로 전달해 줍니다.
    //매 프레임 회전각을 0.05씩 증가시켜 이를 cube 정점에 곱하도록 합니다.(셰이더에서)
    rotationAngle += Math.PI * 1 / 180;

    let model = mat4.create();
    mat4.fromXRotation(model, rotationAngle);
    shader.SetUniformMat4f(gl, "u_model", model);

    let view = mainCamera.CalculateViewMatrix();
    shader.SetUniformMat4f(gl, "u_view", view);

    shader.SetUniformMat4f(gl, "u_projection", proj); 

    renderer.Draw(gl, cubeVA, cubeIB, shader);

    cubeVA.Unbind(gl);
    shader.Unbind(gl);

    requestAnimationFrame(drawScene);
  }

  window.addEventListener('keydown', KeyboardEventHandler);
  window.addEventListener('mousemove', MouseMoveEventHandler);

  //키보드 이벤트 핸들러 함수
  function KeyboardEventHandler(e)
  {
    mainCamera.KeyControl(e); 
    //drawScene();
  }

  //마우스 이벤트 핸들러 함수
  function MouseMoveEventHandler(e)
  {
    mainCamera.MouseControl(e); 
    //drawScene();
  }
}

main();