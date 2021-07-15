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
  var canvas = document.querySelector("#c");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }
  
  //--사각형 데이터
  var rectangleVertices = [ 
    //x     y    r    g    b    a
	-0.5, -0.5, 1.0, 0.0, 0.0, 1.0, //0번 vertex
     0.5, -0.5, 0.0, 1.0, 0.0, 1.0, //1번 vertex
     0.5,  0.5, 0.0, 0.0, 1.0, 1.0, //2번 vertex
	-0.5,  0.5, 0.8, 0.2, 0.3, 1.0, //3번 vertex
  ];
  
  var rectangleIndices = [
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

  drawScene();

  //화면을 새로 그리기 위한 명령어들을 모아 함수로 구현하였음
  function drawScene()
  {
    //정확한 사이즈를 보기 위해서는 아래 두 줄 코드를 추가해야 합니다.
	//Viewport의 경우 이후 강의의 viewport transform에서 살펴볼 것입니다.
	webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    renderer.Clear(gl);

    shader.Bind(gl); //Uniform 설정에 필요하기 때문에 바인딩

    let blueColor = vec4.fromValues(0.0, 0.0, 1.0, 1.0);
    shader.SetUniform4f(gl,"u_color", blueColor[0], blueColor[1], blueColor[2], blueColor[3]);
    shader.SetUniformMat4f(gl, "u_projection", proj); //proj 행렬을 shader로 넘깁니다. SetUniformMat4f 함수가 shader 클래스에 추가되어야 합니다.

    renderer.Draw(gl, rectVA, rectangleIB, shader);

    rectVA.Unbind(gl);
    shader.Unbind(gl);
  }
}

main();