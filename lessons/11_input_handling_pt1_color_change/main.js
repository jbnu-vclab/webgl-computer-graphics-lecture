"use strict";

//Classes
import VertexBuffer from '../_classes/VertexBuffer.js';
import IndexBuffer from '../_classes/IndexBuffer.js';
import VertexArray  from '../_classes/VertexArray.js';
import Shader  from '../_classes/Shader.js';
import Renderer from '../_classes/Renderer.js';

//Shaders
import basicProjectionFragmentShader from '../_shaders/basicProjectionFragment.js';
import basicProjectionVertexShader from '../_shaders/basicProjectionVertex.js';

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

  //glMatrix의 함수를 사용해 orthographic projection matrix를 생성합니다.
  let proj = mat4.create();
  mat4.ortho(proj,-2.0, 2.0, -1.5, 1.5, -1.0, 1.0);

  let shader = new Shader(gl,basicProjectionVertexShader,basicProjectionFragmentShader);
    
  rectVA.Unbind(gl); 
  rectangleVB.Unbind(gl);
  rectangleIB.Unbind(gl);

  let renderer = new Renderer();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  //--Variables--//
  let red = 0.0;
  let green = 0.0;
  let mouseX = 0.0;
  let mouseY = 0.0;

  drawScene();

  function drawScene()
  {
  	webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    renderer.Clear(gl);

    shader.Bind(gl); //Uniform 설정에 필요하기 때문에 바인딩

    shader.SetUniform4f(gl,"u_color", red, green, 0.0, 1.0);
    shader.SetUniformMat4f(gl, "u_projection", proj); //proj 행렬을 shader로 넘깁니다. SetUniformMat4f 함수가 shader 클래스에 추가되어야 합니다.

    renderer.Draw(gl, rectVA, rectangleIB, shader);

    rectVA.Unbind(gl);
    shader.Unbind(gl);
  }

  // window.addEventListener()를 통해 어떤 윈도우 내에서 어떤 이벤트가 발생할 때 호출되는 함수를 구현합니다.
  // 'keydown'은 키보드가 눌렸을때 두번째 인자의 함수를 호출합니다.
  // Javascript KeyCode list 확인
  // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
  window.addEventListener('keydown', KeyboardEventHandler);
  
  // 'mousemove'는 윈도우 내에서 마우스가 움직이면 두번째 인자의 함수를 호출합니다.
  window.addEventListener('mousemove', MouseMoveEventHandler);

  //키보드 이벤트 핸들러 함수
  function KeyboardEventHandler(e)
  {
    if(e.code == "KeyA") // 'A' key down
    {
	    //console.log("A key down");
      red -= 0.1;
    }
    if(e.code == "KeyD") // 'D' key down
    {
    //console.log("D key down");
      red += 0.1;
    }
    if(e.code == "KeyW") // 'W' key down
    {
    //console.log("W key down");
      green += 0.1;
    }
    if(e.code == "KeyS") // 'S' key down
    {
    //console.log("S key down");
      green -= 0.1;
    }
    drawScene(); // 값이 바뀔때마다 drawScene()으로 화면을 다시 그려야 한다는 것을 잊지 마세요.
  }

  //마우스 이벤트 핸들러 함수
  function MouseMoveEventHandler(e)
  {
    mouseX = e.clientX;
    mouseY = e.clientY;
	  console.log("Mouse position : (" + mouseX + "," + mouseY + ")");
  }
}

main();