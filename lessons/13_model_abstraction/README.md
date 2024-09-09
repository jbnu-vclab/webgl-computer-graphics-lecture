# 13. Model Abstraction

이번 장에서는 간단하게 모델 클래스를 구현한 내용을 설명 드리겠습니다.

특별히 크게 변경된 것은 없고, 여러 모델을 손쉽게 로딩하고 그릴 수 있도록 모델 클래스를 구현했습니다. 실제로 여러 모델들을 하나의 장면 안에 배치하는 것이 얼마나 쉬워졌는지 한번 보도록 하겠습니다.

## How to

이전 코드에서 변화된 내용들을 보자면 아래와 같습니다. 해당하는 파일은 번호 목록의 앞에 써 놓았습니다.

---
1. [`_classes/Model.js`] Model 클래스 정의

    ```js
    import VertexBuffer from '../_classes/VertexBuffer.js';
    import IndexBuffer from '../_classes/IndexBuffer.js';
    import VertexArray  from '../_classes/VertexArray.js';
    import Renderer from '../_classes/Renderer.js';

    //Model class
    export default class Model {
        VAO;
        VBO;
        IBO;

        //경로의 모델을 읽어오고, VAO, IBO에 저장
        async LoadModel(gl, path)
        {
            ... //이전과 동일하게 비동기적으로 모델 파일을 요청해 읽고 정점 버퍼 생성
            
            //--모델 정의
            ... //이전과 동일하게 VAO, VBO, IBO 생성

            this.VAO.Unbind(gl);
            this.VBO.Unbind(gl);
            this.IBO.Unbind(gl);
        }
        
        RenderModel(gl,shader)
        {
            if(this.VAO)
            {
                let renderer = new Renderer();
                renderer.Draw(gl, this.VAO, this.IBO, shader);
            }
        }
    }
    ```
    
    이전 강의와 동일한 부분은 생략 하였습니다. 전체 코드가 궁금하시면 해당 파일을 보시기 바랍니다.

    위쪽에서는 Model 클래스에서 사용할 다른 모듈들을 import하고 있습니다.

    Model 클래스는 VAO, VBO, IBO를 가지고 있습니다. 이들은 우리가 만든 VertexArray, VertexBuffer, IndexBuffer 클래스의 객체를 저장하고 있을겁니다.

    모델을 로딩하는 부분은 `LoadModel()` 메소드에 구현되어 있습니다. 모델을 비동기적으로 로드하고 VAO, VBO, IBO를 저장하는 부분은 이전과 동일합니다. 좀더 명시적으로 현재 상태를 관리하기 위해 여기서는 로딩 이후에 언바인딩을 해두는게 좋다고 생각되어서 해당 코드들을 추가 하였습니다. (*참고로 생성자에서 모델을 비동기적으로 로딩하는 것은 불가능합니다.*)

    `RenderModel()` 메소드는 이름 그대로 모델을 그리기 위한 메소드입니다. 이전 코드에서는 `drawScene()`안에서 `renderer.Draw()`를 호출해 우리가 로드한 모델의 VAO와 IBO를 가지고 화면을 그리도록 했습니다. 이제는 모델이 VAO를 들고 있으므로 `RenderModel()` 호출을 통해 화면을 그리면 훨씬 쉬워집니다. `renderer`객체는 아무 데이터도 들고 있지 않으므로 생성하는데 그리 부담은 없습니다. (static method로 구현해도 되겠네요.) `if(this.VAO)` 조건을 통해 모델이 아직 로드가 완료되지 않았을때는 그리지 않도록 한 것에 주목하세요.

    또한 인자로 `shader`, 즉 셰이더 프로그램을 받고 있다는 것에 주목하세요. 물체를 그리는 데에는 정점 데이터 + 셰이더 프로그램이 기본적으로 필요합니다. 정점 데이터는 VAO에 있으니, 셰이더 프로그램을 인자로 받아야 합니다.

    > <p><h2> delete에 관하여 </h2></p>
    > <p>혹시 OpenGL 코드를 병행해서 보고있으신 분은 제가 만들고있는 JS코드에서 `deleteBuffer`, `deleteVertexArray` 같은 API를 아무데서도 호출하지 않는것에 의문을 가지실 수 있습니다. C++ 버전에서는 프로그램이 종료되거나 해서 소멸자가 호출되는 시점에 GPU에 저장된 버퍼 등의 리소스를 해제하도록 `deleteBuffer`를 호출하도록 하였습니다.</br>
    > 여기서 그렇게 하지 않는 두 가지 이유가 있는데요, 첫번째는 약한 이유로, JS의 GC(Garbage Collector)를 통해서 참조되지 않는 WebGL 리소가 자동으로 해제되기 때문입니다. 따라서 어떤 이유로 인해 제가 만들어둔 버퍼가 아무데서도 사용되지 않으면 언젠가는 알아서 리소스가 자동으로 해제됩니다.</br>
    > 두 번째는 강한 이유인데, 지금 제가 만들고 있는 프로그램에서 리소스를 해제할 시점이 없기 때문입니다. 화면은 계속해서 그려지고 있고, 페이지가 닫히거나 웹브라우저를 종료하기 전까지는 계속 리소스를 사용해야 합니다. 그리고 페이지가 닫히면 알아서 GC가 동작해 WebGL 리소스도 해제될겁니다.</br>
    > 만일 여러분이 WebGL이 포함된 페이지 내에서 특정 리소스의 사용 유무를 스위칭할 경우가 생긴다면 직접 리소스를 해제해 주는것이 좋습니다.</p>
    

2. [`main.js`] Model 클래스 사용

    ```js
    import Model from '../_classes/Model.js';
    ...

    async function main() {
        ...
        //---Model Loading
        let cube = new Model();
        cube.LoadModel(gl, '../../resources/models/cube/cube.obj')

        let teapot = new Model();
        teapot.LoadModel(gl, '../../resources/models/teapot/teapot.obj')
    ```

    이제 모델 로드후에 버퍼를 설정하는 등의 코드는 모두 `LoadModel()` 메소드 안에 들어있습니다. `main()`에서는 이를 호출해 주기만 하면 됩니다. 코드들이 얼마나 간단해졌는지 보여드리기 위해서 이번 예제에서는 주전자 모델까지 한번에 화면에 그려보도록 하겠습니다.

3. [`main.js`] 투영행렬 uniform 입력

    ```js
    //---Shader Initialize
    let shader = new Shader(gl,basicVertexShader,basicFragmentShader);
    shader.Bind(gl);
    shader.SetUniformMat4f(gl, "u_projection", proj); 
    shader.Unbind(gl);
    ```

    `drawScene()`을 최대한 단순화 하기위해 `proj` uniform의 설정 부분도 이곳으로 가져와 봤습니다. 투영 행렬의 값이 렌더링 도중에 바뀌지 않기 때문에 이렇게도 가능하다는 것을 보여드리기 위함입니다.

4. [`main.js`] drawScene 함수

    ```js
    function drawScene()
    {
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
    ```

    `drawScene()` 함수 전체를 봐도 두 물체를 그리는데 그리 많은 코드가 필요하지는 않다는 것을 알 수 있습니다. 셰이더 dependent한 내용들을 좀더 쉽게 보여드리기 위해 중간에 scope와 indent를 넣어 두었습니다.

    셰이더를 바인딩한 이후에는 키보드 및 마우스 입력에 따른 뷰 행렬을 셰이더로 넘겨줍니다. 이후 회전하는 육면체에 필요한 데이터를 업데이트하고(rotationAngle 값 변경) 업데이트된 모델 행렬을 셰이더에 넘겨준 뒤 육면체 그리기를 수행합니다.

    그 상태에서 주전자를 (3, 0, 0)위치로 이동하고 크기를 1/10으로 변경하는 모델 행렬을 셰이더로 넘겨준 뒤 그립니다. 이때, 뷰 행렬은 두 물체에 대해 동일한 행렬을 사용하기 때문에 다시 넘겨줄 필요가 없습니다.

    glMatrix 사용에 익숙하지 않으신 분들은 [glMatrix 문서](https://glmatrix.net/docs/index.html)를 보면서 다양한 변환을 적용시켜 보세요.

---

`http://localhost:8080/lessons/practice/contents.html`(또는 `http://localhost:8080/lessons/13_model_abstraction/contents.html`)에 접속해 보시면 가운데에 빨간색 육면체가 회전하고 있고, 오른쪽에는 주전자가 위치해 있는것을 보실 수 있습니다.

어렵지 않으셨을 것으로 생각됩니다. 다음 강의에서는 이미지를 로딩하고, 그 이미지를 텍스처링 기법을 사용해 물체에 입히는 방법에 대해 알아보겠습니다. 내용을 배우셨으니 입힌다는 것은 그냥 비유적인 표현이고, 색상값을 이미지로부터 샘플링해 픽셀로 그린다는 것은 알고 계시리라 믿습니다.

## Quiz

1. 주전자에 Y축 방향으로 회전하는 애니메이션을 구현해 보세요.

2. 두 물체를 다른 뷰행렬 또는 다른 투영행렬을 적용해 그리도록 구현해 보세요.

3. 같은 물체를 다른 뷰행렬을 적용해 그려야 하는 경우는 어떤 경우가 있을까요? 여러분이 사용해본 3D 응용 프로그램들에 대한 기억을 떠올려서 한번 예시를 찾아보세요.

## Advanced

1. 두 물체에 대해 다른 셰이더를 사용하여 그리도록 확장해 보세요.

2. 설계에 단 하나의 정답만이 존재하지는 않습니다. 여기서 제가 구현한 Abstraction 방식과, 여러분이 GitHub의 다른 저장소에서 찾아볼 수 있는 Abstraction 방식이 어떻게 다른지 스스로 한번 분석해 보시고, 가능하다면 실제 사용시에 어떤 장단점이 있을지도 생각해 보세요.

## Useful Links

- [glMatrix 문서](https://glmatrix.net/docs/index.html)

---

[다음 강의](../14_texture/)

[목록으로](../)
