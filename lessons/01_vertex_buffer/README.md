# 1. Vertex Buffer

(진짜) 첫 번째 내용으로, GPU에 데이터를 전달하는 방법을 배워 볼 것입니다.

WebGL은 여러분의 GPU를 사용해서 GPU가 여러가지 작업을 수행해서 이미지를 만들어 내도록 하고, 그 이미지를 웹 브라우저의 캔버스에 보여주도록 할 수 있는 도구입니다.

하지만 GPU에 직접(?) 프로그래밍을 하고 메모리를 할당하는 것이 아니라, CPU/RAM 쪽에 코드를 작성하거나 데이터를 정의한 뒤에 이를 WebGL API 호출을 통해 GPU로 전달하는 간접적인 방식으로 동작하게 됩니다.

WebGL 프로그래밍을 한다고 하면, (개념적으로) 여러분들이 해야 하는 작업은 크게 아래와 같습니다.

1. GPU에 넘겨야 할 데이터를 정의
2. GPU가 실행해야 할 프로그램 코드(Shader, 셰이더)를 정의
3. GPU에 실제로 데이터를 넘기고, 프로그램을 실행하도록 API를 호출

이 코드에서는 데이터를 정의(1.)하고 넘기는(3.) 짧은 코드를 우선 작성해 보았습니다.

기존 `contents.html`의 최하단에 있는 `<script>` 태그의 내용을 모두 지우고 새로 작성합니다.

아래 How to의 설명과, 코드 내 주석을 모두 읽어 보시길 추천 드립니다.

## How to

위에서부터 차례대로 보겠습니다. 첫 코드이니 모두 설명하고, 이후에는 주요 부분만을 설명할 것입니다. (이후에 상세 내용은 코드의 주석을 확인하세요.)

---
1. main 함수 선언

    ```js
    function main() {
        ...
    }
    ```

2. WebGL Context 얻어오기

    ```js
    var canvas = document.querySelector("#c");
    var gl = canvas.getContext("webgl2");
    if (!gl) {
        return;
    }
    ```

    HTML의 위쪽 부분을 보시면 `<body>`안에 `<canvas>`가 정의되어 있습니다. 이곳이 우리가 GPU를 사용해 그린 이미지를 표시할 부분입니다. 우리가 HTML에 만든 캔버스가 WebGL2를 사용해 그림을 표시할 수 있는지 `getContext()` 함수를 호출해 확인하고, 불가능한 경우(반환값이 `null`인 경우) 종료하도록 하는 코드입니다.

    현재는 위 코드를 정확히 이해하실 필요는 없습니다. 이 강의가 끝날때까지 위 코드는 그냥 그대로 바꾸지 않고 계속 사용할겁니다. 
    
    <span style="color:red">**향후 `gl.`을 통해 gl의 멤버를 호출하는 코드들이 모두 WebGL API를 호출하는 코드라는 사실만 기억하고 계시면 됩니다.**</span>

3. 메모리에 데이터 정의

    ```js
    var positions = [ //삼각형의 2차원 좌표 정보. 현재는 RAM에 저장되어 있는 상태
        -0.5, -0.5, // (-0.5, -0.5) 좌표에 점 하나
        0.0,  0.5,  // ( 0.0,  0.5) 좌표에 점 하나
        0.5, -0.5,  // ( 0.5, -0.5) 좌표에 점 하나
    ];
    ```

    `positions`이라는 6개의 숫자를 저장하고 있는 배열을 선언했습니다. 이 데이터는 메모리에 쓰여져 있는 상태입니다.

4. GPU에 버퍼 생성

    ```js
    var positionBuffer = gl.createBuffer(); 
    ```

    처음으로 WebGL API를 호출하는 코드가 나왔습니다. 즉, GPU에 명령을 내리는 것입니다.
    
    WebGL에 정의된 `createBuffer()`라는 API를 호출했습니다. 이 API를 호출하면 GPU는 내부에 데이터를 저장하기 위한 버퍼를 생성합니다. CPU로부터 데이터를 받을 준비를 하라는 의미로 이해하시면 됩니다.
    
    반환값은 `positionBuffer`에 저장해 두었습니다. GPU에 만들어둔 버퍼의 아이디를 저장해두는 겁니다.

5. 버퍼 바인딩

    ```js
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer); 
    ```

    방금 만들어둔 positionBuffer를 `ARRAY_BUFFER`로 바인딩하였습니다. 

    <span style="color:red">**바인딩은 활성화(Activation) 개념입니다. 이후에 버퍼 관련된 작업을 할때, 어떤 버퍼에 데이터를 넣으라고 타겟을 명시하는 것이 아니고 "데이터를 넣어라"라는 API만 호출하면 GPU는 현재 활성화된(바인딩된) 곳에 데이터를 넣게 됩니다.**</span>

    위 개념을 꼭 이해해 두시기 바랍니다. WebGL은 모두 이런 방식(State Machine)으로 설계되었기 때문에 이 개념이 명확하지 않으면 이후 내용이 모두 이해가 안될 수 있습니다.

    `gl.ARRAY_BUFFER`는 버퍼의 타입을 명시합니다. `positionBuffer`에 정점(Vertex) 정보가 들어갈 것이라고 알려줍니다.

6. 버퍼에 데이터 전달

    ```js
    var floatPositions = new Float32Array(positions);
    gl.bufferData(gl.ARRAY_BUFFER, 
				floatPositions,
				gl.STATIC_DRAW);
    ```

    이제 실제로 RAM에서 GPU로 데이터를 전달합니다.

    우선 `var floatPositions = new Float32Array(positions);`부터 보자면, 위의 3에서 선언한 `positions`배열은 JS 문법을 사용해 만든 것이라 타입이 명확하지 않습니다. WebGL에서는 명확한 타입이 필요하기 때문에 `var` 배열을 `Float32` 타입의 배열로 변환해 준 것으로 생각하시면 됩니다.

    위 API 호출의 의미는 "`gl.ARRAY_BUFFER`로 바인딩되어 있는 버퍼에 `floatPositions`에 저장된 데이터를 복사해 넣어라." 라는 명령입니다. 따라서, RAM에서 GPU의 메모리로 데이터를 복사해서 집어넣은 것입니다.

    세 번째 인자인 `gl.STATIC_DRAW`는 특별한 경우가 아니면 그냥 그대로 두셔도 됩니다. GPU 성능 최적화를 위해 필요한 힌트입니다.

7. 이미지 생성하기

    ```js
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    ```

    WebGL(및 OpenGL)에서 이미지를 그리는 명령을 내리는 API를 호출하는 것을 드로우 콜(Draw Call)이라 합니다. 위 코드가 드로우 콜이고 보시면 삼각형을 그리라고 하고 있습니다.

    첫 번째 인자인 `gl.TRIANGLES`는 삼각형을 그리라는 뜻입니다. 두번째 인자인 `0`은 그리기를 시작할 데이터입니다. `0`이므로 첫 번째 데이터고, `positions` 배열에 정의된 내용을 생각해 보면 (-0.5, -0.5)점이 될 겁니다. 세번째 인자인 `3`은 데이터 세개를 사용해 그리라는 뜻입니다.

8. main함수 호출

    ```js
    main();
    ```
    
    7\. 까지의 코드는 메인함수의 정의였고, 실제 웹 페이지를 띄우면 메인 함수를 호출하도록 명령문을 따로 작성해 주어야 합니다. JS는 C++과는 다릅니다!

---
`http://localhost:8080/lessons/practice/contents.html`(또는 `http://localhost:8080/lessons/01_vertex_buffer/contents.html`)에 접속해 보시면 화면에 아무 것도 나오지 않는 것을 보실 수 있습니다. 

지금은 아무 것도 나오지 않는 것이 정상입니다! 왜 아무 것도 나오지 않는지 생각해 보시고 다음 내용으로 넘어가시면 되겠습니다.

## Quiz

1. 화면에 아무 것도 나오지 않는 이유는 무엇일까요? (*힌트 1: 최상단에 우리가 해야 할 세 가지 작업 중 어느 것이 빠졌는지 생각해 보세요.*)(*힌트 2: F12로 브라우저 개발자 도구를 열어서 경고 메시지를 읽어 보세요.*)

2. `gl.drawArray()`의 인자에는 "삼각형을 그려라" "첫 번째 것부터 그려라" "세 개 데이터를 사용해 그려라"라는 내용만 전달되고 있습니다. 어떤 데이터를 가져와서 그리라는 인자가 없습니다. 왜 그런지 짐작해 보세요. (*힌트: 5,6번 설명 참고*)

3. 아래와 같은 코드가 있다고 해 봅시다. (1)과 (2)는 완전히 동일한 명령문입니다. (1)을 실행하면 어떤 버퍼로 데이터가 들어가는지, (2)를 실행하면 어떤 버퍼로 데이터가 들어가는지 생각해 보세요. (너무 쉽죠? 그래도 꼭 기억해 두십시오.)

```js
var buffer1 = gl.createBuffer(); 
var buffer2 = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, buffer1); 
gl.bufferData(gl.ARRAY_BUFFER, floatPositions, gl.STATIC_DRAW); //---(1)

gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
gl.bufferData(gl.ARRAY_BUFFER, floatPositions, gl.STATIC_DRAW); //---(2)
```

## Useful Links

- [WebGL2 기초(WebGL2 Fundamentals)](https://webgl2fundamentals.org/webgl/lessons/ko/webgl-fundamentals.html)
- [WebGL2 작동 원래(WebGL2 Fundamentals)](https://webgl2fundamentals.org/webgl/lessons/ko/webgl-how-it-works.html)
- [WebGL2 상태 다이어그램](https://webgl2fundamentals.org/webgl/lessons/resources/webgl-state-diagram.html)

---

[다음 강의](../02_shader_attribute/)

[목록으로](../)