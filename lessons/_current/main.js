"use strict";

//Classes
import Renderer  from '../_classes/Renderer.js';
import Shader  from '../_classes/Shader.js';
import VertexBuffer from '../_classes/VertexBuffer.js';
import IndexBuffer from '../_classes/IndexBuffer.js';
import VertexArray  from '../_classes/VertexArray.js';

//Shaders
import raytracingVertex from './raytracingVertex.js';
import raytracingFragment from './raytracingFragment.js';

function main() {
    // Get A WebGL context
    var canvas = document.querySelector("#c");
    var gl = canvas.getContext("webgl2");
    if (!gl) {
        return;
    }
  
    //--사각형 데이터
    var rectangleVertices = [ 
      //x     y   
      -1.0, -1.0, 
       1.0, -1.0, 
       1.0,  1.0, 
      -1.0,  1.0, 
    ];
  
    var rectangleIndices = [
        0, 1, 2, //0,1,2번 vertex로 이루어진 삼각형
        2, 3, 0, //2,3,0번 vertex로 이루어진 삼각형
    ];
  
    //---------사각형 그리기 준비--------------//
    //코드가 굉장히 단순해 진 것을 볼 수 있다.
    let rectVA = new VertexArray(gl); 
    let rectangleVB = new VertexBuffer(gl,rectangleVertices);
    rectVA.AddBuffer(gl, rectangleVB, [2], [false]); //버퍼를 추가할 때 각 attribute가 몇 개의 데이터로 이루어졌는지만 배열로 전달해주면 된다.
    let rectangleIB = new IndexBuffer(gl, rectangleIndices, 6);

    let shader = new Shader(gl,raytracingVertex,raytracingFragment);
    
    //---Renderer Initialize
    let renderer = new Renderer();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    let resolutionLocation = gl.getUniformLocation(shader.id, "u_resolution");
    let timeLocation = gl.getUniformLocation(shader.id, "time");
    let timerStart = Date.now();
    let camFovLoation = gl.getUniformLocation(shader.id, "u_fov");

    //--------------------UI Setting---------------------//
    webglLessonsUI.setupSlider("#camera-fov", {slide: updateCameraFov, min: 10, max: 120, step: 10, value: 90});
    
    let camFov = 90;
    //---------------------------------------------------//

    drawScene();

    //화면을 새로 그리기 위한 명령어들을 모아 함수로 구현하였음
    function drawScene()
    {
        //화면 크기 재조정
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        //여기서만 임시로 사용하므로 vec2f uniform입력은 따로 추가 안함
        shader.Bind(gl);

        gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
        gl.uniform1f(timeLocation, Date.now() - timerStart);
        gl.uniform1f(camFovLoation, camFov);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        renderer.Draw(gl,rectVA,rectangleIB,shader);

        //---3. 사각형 관련 state 비활성화. 
        gl.bindVertexArray(null);
        gl.useProgram(null);

    }
    //slider의 값이 변할 때마다 호출되는 함수
    function updateCameraFov(event, ui)
    {
        camFov = ui.value;
        drawScene();
    }
}
main();