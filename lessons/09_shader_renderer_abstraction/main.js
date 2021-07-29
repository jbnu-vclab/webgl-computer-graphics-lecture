"use strict";

import VertexBuffer from '../_classes/VertexBuffer.js';
import IndexBuffer from '../_classes/IndexBuffer.js';
import VertexArray  from '../_classes/VertexArray.js';
import simpleFragmentShader from '../_shaders/simpleFragment.js';
import simpleVertexShader from '../_shaders/simpleVertex.js';

// Shader 클래스 구현
class Shader{
    id;
    locations = {};

    constructor(gl, vsource, fsource)
    {
        this.id = webglUtils.createProgramFromSources(gl,[vsource, fsource]);
    }

    //Shader는 useProgram을 호출하지만 통일성을 위해 수정
    Bind(gl)
    {
        gl.useProgram(this.id); 
    }

    Unbind(gl)
    {
        gl.useProgram(null); 
    }

    GetUniformLocation(gl, name)
    {
        let location = 0;
        if(name in this.locations)
        {
            location = this.locations[name];
        }
        else
        {
            location = gl.getUniformLocation(this.id, name); 
            this.locations[name] = location;
        }
        return location;
    }

    //SetUniform 메소드들
    SetUniform4f(gl,name, v0,v1,v2,v3)
    {
        let location = this.GetUniformLocation(gl,name);
        gl.uniform4f(location, v0, v1, v2, v3); 
    }
}
  
// Renderer 클래스 구현
class Renderer{
    Clear(gl)
    {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    Draw(gl, va, ib, shader)
    {
        //무언가를 그릴때, 3가지가 기본적으로 필요함. vao, ibo, shader program
        shader.Bind(gl);
        va.Bind(gl);
                
        var primitiveType = gl.TRIANGLES;
        var indexcount = ib.getCount();
        var indexoffset = 0
        gl.drawElements(primitiveType, indexcount, gl.UNSIGNED_SHORT, 0);
    }
}

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

  let shader = new Shader(gl,simpleVertexShader,simpleFragmentShader);
    
  rectVA.Unbind(gl); // <-- 지난번 커밋에서 바꾸는건 깜박했습니다!
  rectangleVB.Unbind(gl);
  rectangleIB.Unbind(gl);

  let renderer = new Renderer();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  drawScene();

  //화면을 새로 그리기 위한 명령어들을 모아 함수로 구현하였음
  function drawScene()
  {
    renderer.Clear(gl);

    shader.Bind(gl); //Uniform 설정에 필요하기 때문에 바인딩
    shader.SetUniform4f(gl,"u_color", 0.0, 0.0, 1.0, 1.0);

    renderer.Draw(gl, rectVA, rectangleIB, shader);

    rectVA.Unbind(gl);
    shader.Unbind(gl);
  }
}

main();