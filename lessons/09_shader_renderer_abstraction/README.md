# 9. Shader and Renderer Abstraction

이제 마지막 Abstraction을 통해 코드를 추상화 해보겠습니다. 완전히 마지막은 아니고, 나중에 Model, Light 클래스 등을 더 만들거긴 합니다만 기본적인 렌더링 과정에서는 이 부분이 마지막이라고 생각하시면 됩니다. 이번에는 Shader와 Renderer 클래스를 구현해서 코드를 구조화해볼겁니다.

### Shader Abstraction

Shader와 관련해서는 우리는 셰이더 소스(코드)를 받아서 컴파일, 링킹을 통해 프로그램을 만들어야 한다는 것을 배웠습니다. 단, 이 작업을 우리가 직접 구현하지는 않았고 `webgl-utils.js`안에 구현된 함수를 호출해서 사용했습니다. 

이렇게 셰이더의 준비 과정 말고 또 셰이더와 관련한 주요 사항은 uniform을 설정하는 부분입니다. 이렇게  1) 셰이더 초기화, 2) 셰이더 uniform 설정의 두 기능을 Shader 클래스 안에 구현해 둘겁니다.

### Renderer Abstraction

"렌더링"이라는 것이 무엇인지는 배웠지만 여기서 Renderer 라는것은 처음 언급하는 것 같네요. 별다른 것은 아니고 화면을 그리는 나머지 작업을 이 Renderer 클래스가 담당하도록 할 것입니다. 지금은 두 가지 기능을 갖도록 할건데, 1) 화면을 지우는 기능, 2) 화면을 그리는 기능입니다. 화면을 그리는 기능은 당연히 드로우콜을 이야기 하는 것입니다.

구현은 간단합니다. 한번 보시죠.

## How to

이전 코드에서 변화된 내용들을 보자면 아래와 같습니다.

---
0. VertexBuffer/IndexBuffer 클래스 import

    ```js
    import VertexArray  from '../_classes/VertexArray.js';
    import simpleFragmentShader from '../_shaders/simpleFragment.js';
    import simpleVertexShader from '../_shaders/simpleVertex.js';
    ```
    
    우선 이전에 구현해둔 VertexArray를 외부 모듈로 분리하고 import하도록 했습니다.

    또한 셰이더 코드를 `_shaders/` 하위에 파일로 분리하고 import하도록 했습니다. 

1. Shader 클래스 구현

    ```js
    class Shader{
        id;
        locations = {};

        constructor(gl, vsource, fsource)
        {
            this.id = webglUtils.createProgramFromSources(gl,[vsource, fsource]);
        }

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

        SetUniform4f(gl,name, v0,v1,v2,v3)
        {
            let location = this.GetUniformLocation(gl,name);
            gl.uniform4f(location, v0, v1, v2, v3); 
        }
    }
    ```

    이제는 패턴이 익숙하시죠? 바인딩/언바인딩 인터페이스를 만들기 위해서 생성한 프로그램의 ID를 저장해 둘 두 있도록 필드를 만들어두었습니다. 생성자에서는 이전과 같이 `webglUtils.createProgramFromSources()` 함수 호출을 통해 셰이더 프로그램 컴파일/링킹을 통한 프로그램 생성을 수행합니다. 만들어진 프로그램 ID는 `id` 필드에 저장합니다. 그리고 간단한 바인딩/언바인딩을 위한 메소드를 제공합니다.

    아래쪽 두 메소드인 `GetUniformLocation()`와 `SetUniform4f()`는 uniform에 값을 설정해 주기 위해 사용하는 메소드들입니다. 사실 이전에는 아래와 같은 패턴으로 구현했었는데요,

    ```js
    let location = gl.getUniformLocation(this.id, name); 
    gl.uniform4f(location, v0, v1, v2, v3);
    ```

    이 두 줄을 그냥 `SetUniform()` 메소드에 구현하는 것은 비효율적입니다. 매번 uniform에 값을 설정해줄때마다 uniform의 location을 찾아야 하기 때문이죠. 그래서 `locations{}` 라는 dictionary를 캐시로 만들어서 한번 찾은 location은 다시 조회할 필요 없이 바로 가져올 수 있도록 해 두었습니다. 좀더 간단히 말하면 name에 해당하는 location이 캐시에 등록되어 있다면 저장된 값을 사용하고(true조건), 캐시에 등록되어 있지 않다면(else조건) `gl.getUniformLocation()`을 사용해 조회하여 값을 캐시에 저장해두는 것입니다.

2. Renderer 클래스 구현

    ```js
    class Renderer{
        Clear(gl)
        {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }

        Draw(gl, va, ib, shader)
        {
            shader.Bind(gl);
            va.Bind(gl);
                    
            var primitiveType = gl.TRIANGLES;
            var indexcount = ib.getCount();
            var indexoffset = 0
            gl.drawElements(primitiveType, indexcount, gl.UNSIGNED_SHORT, 0);
        }
    }
    ```
    
    Renderer 클래스는 두 가지 기능을 제공하는 간단한 클래스입니다. `Clear()`는 `gl.clear()` API를 호출해 버퍼(지금은 화면 또는 이미지라고 생각하면 됩니다.)을 지웁니다. 지운다는 것은 단색으로 칠한다는 것과 같은 의미인데요, 이전부터 계속 사용하던 `gl.clearColor(0, 0, 0, 0);`가 칠할 색상을 설정하는 API였습니다. (RGB가 0,0,0인데 왜 흰색으로 지워졌냐고요? A값(alpha)이 0이기 때문에 사실은 투명색(?)으로 지워졌기 때문입니다. 투명색으로 지워졌다는 것이 물리적으로는 말이 안되는 이야기 같긴 하지만 뭐 그렇습니다 ^^;)

    이제는 `gl.clearColor()`와 `gl.clear()`를 분리해 두었습니다. 렌더러를 "화면을 지우는 기능", "화면을 그리는 기능"만을 하도록 만들고 싶어서 입니다. "지우는 색을 설정하는 기능"은 후보에서 제외되었습니다. 원하신다면 기능을 포함시켜도 상관은 없습니다.

    두 번째인 그리는 기능은 `Draw()` 메소드에 구현되어 있습니다. 셰이더 프로그램과 VAO를 바인딩하고 드로우콜을 호출합니다. 지금은 삼각형만을 그리고, IBO의 전체 인덱스 정보를 가지고 그리도록 되어 있는데 필요하다면 좀더 기능을 확장할 수도 있을겁니다.

3. 프래그먼트 셰이더 수정(`../_shaders/simpleFragment.js`)

    ```glsl
    #version 300 es

    precision highp float;

    layout(location=0) out vec4 outColor;

    uniform vec4 u_color;

    void main() {
        outColor = u_color;
    }
    ```

    Shader 클래스 객체의 setUniform이 올바로 동작하는지 보기 위해서 [7. Buffer Abstraction](../7_buffer_abstraction/contents.html)의 셰이더처럼 사각형의 색상을 uniform으로 입력받아서 그리는 셰이더로 다시 되돌려놓았습니다.

4. Shader 객체 생성

    ```js
    let shader = new Shader(gl,rectangleVertexShaderSource,rectangleFragmentShaderSource);
    ```

    뭐 원래도 긴 코드는 아니었죠? 이렇게 바뀌었습니다. 하지만 Shader 클래스를 만들어 둔 덕분에 특정 셰이더 프로그램에 uniform을 설정하는 작업이 훨씬 명료하고 쉬워질겁니다.

5. Renderer 객체 생성

    ```js
    let renderer = new Renderer();
    ```

    `renderer` 객체는 API 호출만을 수행하고 특별히 데이터가 없기 때문에 생성자에 인자도 필요없었습니다.

6. `drawScene()` 함수

    ```js
    function drawScene()
    {
        renderer.Clear(gl);

        shader.Bind(gl); //Uniform 설정에 필요하기 때문에 바인딩
        shader.SetUniform4f(gl,"u_color", 0.0, 0.0, 1.0, 1.0);

        renderer.Draw(gl, rectVA, rectangleIB, shader);

        rectVA.Unbind(gl);
        shader.Unbind(gl);
    }
    ```

    <img src="https://media.vlpt.us/post-images/rajephon/c9322c30-5913-11e9-8a43-033dcf59c588/banner-image.jpg" alt="" width="256">

    아주 간단해졌습니다! 알아보기도 쉽죠. `drawScene()`을 호출할 때마다,

    1) 화면을 지우고
    2) uniform을 설정하고
    3) VAO와 셰이더로 그림을 그리고
    4) 언바인딩.

    명료합니다.

---

`http://localhost:8080/lessons/_current/contents.html`(또는 `http://localhost:8080/lessons/09_shader_renderer_abstraction/contents.html`)에 접속해 보시면 uniform에 설정한 파란색으로 사각형이 표시되는 것을 보실 수 있습니다.

이제 본격적으로 좀 더 재미있는 작업을 할 준비가 된 것 같습니다. 이렇게 사전 준비 작업을 해 놓지 않으면 코드가 너무 번잡스러워져서 굉장히 보기 싫으셨을겁니다. 또한 이러한 작업을 통해 초반에 설명했던 기본적인 WebGL의 동작방식을 다시한번 복습하는 계기가 되었을 것이라고 생각합니다.

## Quiz

1. 현재 만들어둔 클래스들을 활용하여 [6. Drawing Multiple Objects - Part 2](../6_drawing_multiple_objects_pt2/contents.html)에서처럼 삼각형 하나와 사각형 하나, 두 개의 물체를 화면에 표시하는 코드를 작성해 보세요.

## Useful Links

- [C++ 버전의 VertexArray 클래스](https://github.com/diskhkme/OpenGL_Lecture_Material/commit/e20e563338fedc146edc8407f378313128943f09)
- [vertexAttribPointer 레퍼런스 문서](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer)

---

[다음 강의](../10_using_matrix/)

[목록으로](../)