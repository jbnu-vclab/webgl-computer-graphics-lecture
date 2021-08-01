# 4. Shader Uniform

이번에는 사각형의 색상을 바꿔 보겠습니다. 이전에 퀴즈로 내 드렸던 내용을 직접 해보신 분들은 아시겠지만, 프래그먼트 셰이더의 outColor에 대입한 색상이 바뀌면 화면에 표시되는 삼각형의 색상이 바뀌는 것을 볼 수 있었습니다.

그러면 꼭 이렇게 출력되는 색상을 셰이더에 하드코딩해서 넣는 방법만 존재할까요? 당연히 아닙니다!

JS 쪽으로부터 셰이더 프로그램으로 원하는 값을 그때그때 전달해 줄 수 있는 방법이 있는데, 바로 Uniform이라는 변수를 사용하는 것입니다.

두 번째 강의였던 Shader Attribute에서 말씀드렸는데요, (GPU에 있는)셰이더 프로그램에 (RAM으로부터) 데이터를 전달하는 방법은 세 가지가 있습니다.

1. Attribute: 정점의 위치 등 각 정점별로 다른 값을 갖는(per-vertex) 데이터 전달
2. Uniform: 변환 행렬 등 물체별로 다른 값을 갖는(per-object) 데이터 전달
3. Texture: 나중에 설명...

이번 자료에서는 Uniform에 대해 코드를 작성해 볼 것입니다. 우선 위에서 물체라는 것은 삼각형의 집합을 의미한다고 생각하시면 됩니다. `positions`는 각 정점의 위치값을 가지고 있습니다. 따라서 모든 정점이 다른 값을 가지므로, 이는 attribute로 전달했습니다. 

한편, 내가 사각형을 빨간색으로 칠하고 싶다면 물체(=사각형, 삼각형의 집합) 전체에 적용할 빨간색 데이터를 전달해 주어야 합니다. 이렇게 정점별로 다르지 않고 물체에 공통적으로 적용할 데이터를 우리는 Uniform이라는 변수를 사용해서 전달해 줄 수 있습니다.

잘 설명이 되었는지 모르겠는데요, 예제를 보시면 명확해 질 겁니다.

## How to

이번 코드를 시작하기에 앞서 이전에 설명을 위해 달아두었던 주석들을 정리하였으니 참고 하시기 바랍니다.

이전 코드에서 변화된 내용들을 보자면 아래와 같습니다.

---
1. 셰이더에 Uniform 변수 정의

    ```glsl
    var fragmentShaderSource = `#version 300 es
    precision highp float;
    layout(location=0) out vec4 outColor;

    uniform vec4 u_color; //CPU로부터 데이터를 받는 또다른 방법인 uniform 변수

    void main() {
        outColor = u_color; //uniform 변수에 저장된 색상으로 출력
    }
    `;
    ```

    프래그먼트 셰이더에 `u_color`라는 `vec4`타입의 변수를 선언하고, 그 앞에 `uniform`이라는 키워드를 붙여 두었습니다. 이렇게 하면 셰이더 프로그램에 uniform을 생성한 겁니다.

    그리고 `main()`함수에서는 하드코딩한 색상값을 넣는 대신에, `u_color`에 저장된 값을 출력하도록 해 두었습니다. 이제 `u_color`에 저장된 값으로 사각형이 표시될 것이라는 것을 예상할 수 있습니다.

2. Uniform에 데이터 전달

    ```js
    var location = gl.getUniformLocation(program, "u_color"); //u_color 변수 위치를 참조
    gl.uniform4f(location, 0.8, 0.3, 0.8, 1.0); //해당 위치에 0.2, 0.3, 0.8, 1.0 데이터를 전달
    ```

    이렇게 두 줄로 셰이더의 `u_color`변수에 RAM으로부터 데이터가 전달됩니다. 참 쉽죠?

    의미를 좀 뜯어서 보겠습니다. 먼저 `getUniformLocation()`함수에 첫 번째 인자로는 우리가 컴파일하여 준비해둔 셰이더 프로그램의 ID를 전달하고 있습니다. 셰이더 프로그램도 여러개가 있을 수 있기 때문에 어느 셰이더 안에 있는 uniform에 데이터를 전달할 것인지를 정확하려 얻어오려면 당연히 필요할겁니다. 두 번째 인자로는 그 셰이더 프로그램 내의 uniform 변수의 이름을 문자열로 전달합니다. 위에서 우리가 선언한 uniform변수 이름인 `u_color`를 전달하면 됩니다. 그 반환값으로 `u_color`의 위치가 반환됩니다. 앞으로 uniform 변수의 위치는 location이라고 영문 그대로 적겠습니다.

    이제 남은 것은 그 location에 데이터를 집어넣는 것입니다. `u_color`가 `vec4` 타입이기 때문에 `gl.uniform4f()`라는 API를 사용하고 있습니다. [링크](https://webgl2fundamentals.org/webgl/lessons/ko/webgl-shaders-and-glsl.html#uniforms)의 글 중간에 보시면 셰이더 내의 데이터 타입별로 다른 함수를 사용해 데이터를 전달해야 한다는 것을 아실 수 있습니다.

    예를들어 우리가 `uniform float a;`를 셰이더에 정의해 두었다면 여기에는 `gl.uniform1f()` API를 사용해 데이터를 전달해야 합니다. 이후 강의에서는 uniform을 전체적으로 관리하고, 데이터를 전달하는 인터페이스를 갖는 클래스를 만들 것입니다.

    어쨋든, `gl.uniform4f()`의 첫번째 인자로 우리가 데이터를 넣은 location을 알려주고, 2~5번째 인자에 `vec4`에 필요한 float 4개를 개별적으로 전달해 줍니다. 이 명령문이 실행되면, `u_color`에는 (0.8, 0.3, 0.8, 1.0) 네 개의 값이 저장됩니다. (`vec4`는 x,y,z,w 네 멤버를 갖는 구조체라고 말씀드린 바 있습니다.)

---

`http://localhost:8080/lessons/_current/contents.html`(또는 `http://localhost:8080/lessons/04_shader_uniform/contents.html`)에 접속해 보시면 화면에 보라색 사각형이 나오는 것을 보실 수 있습니다.

"그냥 이쪽(셰이더)에 작성하던 코드를 저쪽(CPU 사이드)으로 옮겼구나"라고 생각하실 수도 있지만 사실 Uniform이라는 것은 향후 우리가 작성해 볼 코드에서 굉장히 중요한 역할을 수행합니다. 특히 3차원 표현을 위한 Model/View/Projection 행렬을 전달하는데 사용되기 때문에 더 그러한데요, 지금 코드만 가지고는 감이 잘 안오실테니 얼른 uniform을 좀더 재미있게 활용하는 코드로 넘어가 보도록 합시다.

## Quiz

1. 정점 셰이더에도 `uniform vec4 offset;`을 선언하고, 셰이더 코드의 `main()`함수 내부를 아래와 같이 바꿔 보세요.

    ```
    gl_Position = a_position + offset;
    ```
    그리고 나서 JS쪽에서 offset uniform으로 값을 전달해서 결과가 어떻게 달라지는지 살펴보세요.

2. Uniform에 값을 전달하기 위해서는 셰이더 프로그램이 활성화(바인딩)되어 있어야 합니다. 코드의 주석을 따라서 프로그램을 비활성화(언바인딩)하고 제대로 동작하는지 그렇지 않은지 확인해 보세요.

## Useful Links

- [WebGL Shader와 GLSL](https://webgl2fundamentals.org/webgl/lessons/ko/webgl-shaders-and-glsl.html#uniforms)

---

[다음 강의](../05_shader_uniform_interactive/)

[목록으로](../)