"use strict";

//Classes
import Shader  from '../_classes/Shader.js';
import Renderer from '../_classes/Renderer.js';
import OrbitCamera from '../_classes/OrbitCamera.js';
import Model from '../_classes/Model.js';
import Texture from '../_classes/Texture.js';
import Material from '../_classes/Material.js';
import {DirectionalLight} from '../_classes/BasicLight.js';

//Shaders
import PBRVertexShader from '../_shaders/PBRShaderVertex.js';
import PBRFragmentShader from '../_shaders/PBRShaderFragment.js';

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
  // 이번 예제에서는 텍스처 없음
  
  //--Light Define
  // 이번 예제에서는 4개의 Point Light를 가정, Point light는 광원의 위치, 색상(irradiance)을 가짐
  let lightPositions = [[-10.0,  10.0, 10.0],
                        [ 10.0,  10.0, 10.0],
                        [-10.0, -10.0, 10.0],
                        [ 10.0, -10.0, 10.0],]
  let lightColors = [ [300.0, 300.0, 300.0],
                      [300.0, 300.0, 300.0],
                      [300.0, 300.0, 300.0],
                      [300.0, 300.0, 300.0],]

  //--Material Define
  // 이번 예제에서는 Albedo/Metallic/Roughness/AO 4개 값만 지정하므로 Material Abstraction 생략
  // 해당 값들을 Abstraction해서 구현하는 것은 스스로 해 보실 수 있겠죠?

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
  let shader = new Shader(gl,PBRVertexShader,PBRFragmentShader);
  shader.Bind(gl);
  shader.SetUniformMat4f(gl, "u_projection", proj);
  shader.Unbind(gl);

  //---Renderer Initialize
  let renderer = new Renderer();
  gl.clearColor(0.1, 0.1, 0.1, 1.0);

  //---Options
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  //--------------------UI Setting---------------------//
  // webglLessonsUI.setupSlider("#shininess", {slide: updateShininess, min: 0, max: 200, step: 0.1});
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

      //카메라 eye 위치를 전달해 주어야 함! (view vector 계산을 위해)
	    let eyePos = mainCamera.eye;
	    shader.SetUniform3f(gl,"u_eyePosition", eyePos[0], eyePos[1],eyePos[2]);

      //Light 적용
	    // 이번 예제에서는 4개 point light의 위치와 색상을 매뉴얼하게 전달
      for(let i=0;i<lightPositions.length;i++)
      {
        shader.SetUniform3f(gl, "u_lightPositions[" + i + "]", lightPositions[i][0], lightPositions[i][1], lightPositions[i][2])
        shader.SetUniform3f(gl, "u_lightColors[" + i + "]", lightColors[i][0], lightColors[i][1], lightColors[i][2])
      }
      
      //--- 5 x 5 주전자 그리기 
      //--- 가로, 세로 spacing 간격으로 놓인 주전자들을 metallic, roughness값을 바꾸어가며 그리기
      let spacing = 0.3;
      let numRow = 5;
      let numCol = 5;

      for(let row=0;row<numRow;row++)
      {
        for(let col=0;col<numCol;col++)
        {
          let model = mat4.create();
          mat4.translate(model, model, [(col - numCol/2) * spacing, (row - numRow/2) * spacing, 0]);
          mat4.scale(model, model, [0.01, 0.01, 0.01]);
          shader.SetUniformMat4f(gl, "u_model", model);
    
          //   ---material parameter 입력
          shader.SetUniform3f(gl, "u_albedo", 0.5, 0.0, 0.0);
          shader.SetUniform1f(gl, "u_metallic", parseFloat(row)/parseFloat(numRow));

          // (주의!) Roughness 가 exactly 0.0인 경우 직접 조명에서는 문제가 있으므로(왜?) 아주 작은 값을 갖도록 함
          const clampNumber = (num, a, b) => Math.max(Math.min(num, Math.max(a,b)), Math.min(a,b));
          shader.SetUniform1f(gl, "u_roughness", clampNumber(parseFloat(col)/parseFloat(numCol), 0.05, 1.0));
          shader.SetUniform1f(gl, "u_ao", 1.0);          

          teapot.RenderModel(gl, shader);
        }
      }

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