"use strict";

import VertexBuffer from '../_classes/VertexBuffer.js';
import IndexBuffer from '../_classes/IndexBuffer.js';

class VertexArray{
    id;
    
    //VertexBuffer에는 vertex의 position 뿐만 아니라 다양한 vertex 관련 데이터가 들어올 수 있다.
    //이를 손쉽게 다루기 위해 VertexBuffer보다 상위 수준인 vao를 관리할 수 있는 클래스를 정의
    constructor(gl)
    {
      this.id = gl.createVertexArray(); //this.id == vao
      //vao의 바인딩은 AddBuffer 직전에 수행하도록 한다.
    }
    
    Bind(gl)
    {
      gl.bindVertexArray(this.id);
    }
    
    Unbind(gl)
    {
      gl.bindVertexArray(null);
    }
    
    AddBuffer(gl, vb, countArray, normalizedArray)
    {
      //countArray와 normalizedArray의 길이는 같아야 함
      console.assert(countArray.length == normalizedArray.length,
         "length of countArray and normalizedArray should match!");
      this.Bind(gl); //VAO binding
      vb.Bind(gl); //입력된 VertexBuffer binding
      
      var stride = 0;
      for(var i=0;i<countArray.length;i++)
      {
        stride += countArray[i] * 4;
      }
      
      var offset = 0;
      for(var i=0;i<countArray.length;i++) 
      {
          gl.enableVertexAttribArray(i); 
          gl.vertexAttribPointer(i, countArray[i], gl.FLOAT, normalizedArray[i], stride, offset);
          offset += 4*countArray[i];
      }
    }
}

var rectangleVertexShaderSource = 
`#version 300 es

layout(location=0) in vec4 a_position; 
layout(location=1) in vec4 a_color; // <-- 이제 1번 location에는 색상값이 할당되어야 한다.

out vec4 v_color; // <-- 색상을 결정하는 것은 fragment shader이므로, vertex의 색상값을 fragment shader로 넘겨주어야 한다.

void main() {
    gl_Position = a_position;
    v_color = a_color; // <-- 넘겨주기
}
`;

var rectangleFragmentShaderSource = 
`#version 300 es

precision highp float;

layout(location=0) out vec4 outColor;

in vec4 v_color; // <-- 넘겨받은 vertex 색상

void main() {
    outColor = v_color; // <--각 vertex의 색상은 vertex마다 가지고있는 color값이다.
}
`;

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
  
  //---------사각형 그리기 준비--------------//
  //코드가 굉장히 단순해 진 것을 볼 수 있다.
  let rectVA = new VertexArray(gl); 
  let rectangleVB = new VertexBuffer(gl,rectangleVertices);
  rectVA.AddBuffer(gl, rectangleVB, [2, 4], [false, false]); //버퍼를 추가할 때 각 attribute가 몇 개의 데이터로 이루어졌는지만 배열로 전달해주면 된다.
  let rectangleIB = new IndexBuffer(gl, rectangleIndices, 6);

  //---Shader Program 생성---//
  var program1 = webglUtils.createProgramFromSources(gl, [rectangleVertexShaderSource, rectangleFragmentShaderSource]);
  gl.useProgram(program1); 
  //---------사각형 그리기 준비 완료--------------//
  gl.bindVertexArray(null); 
  rectangleVB.Unbind(gl); // <-- VertexBuffer 클래스 멤버함수 사용
  rectangleIB.Unbind(gl); // <-- IndexBuffer 클래스 멤버함수 사용
  gl.useProgram(null);

  drawScene();

  //화면을 새로 그리기 위한 명령어들을 모아 함수로 구현하였음
  function drawScene()
  {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //---1. 사각형 그리기 준비
    rectVA.Bind(gl);
    gl.useProgram(program1); 
    //---2. 사각형 그리기(사각형의 경우 ui에서 받은 uniform도 shader에 보내 반영해 주어야 한다.)
    var primitiveType = gl.TRIANGLES;
    var indexcount = rectangleIB.getCount(); //<-- 인덱스 몇개를 그릴지 하드코딩하지 않고 IB로부터 얻어옵니다.
    var indexoffset = 0;
    gl.drawElements(primitiveType, indexcount, gl.UNSIGNED_SHORT, indexoffset);
    //---3. 사각형 관련 state 비활성화. 
    gl.bindVertexArray(null);
    gl.useProgram(null);
  }
}

main();