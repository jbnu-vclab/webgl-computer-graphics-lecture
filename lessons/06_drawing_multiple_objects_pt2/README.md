# 6. Drawing Multiple Objects - Part 2

이제 **VAO(Vertex Array Object)**를 사용해서 코드를 줄여 보겠습니다.

VAO는 말그대로 Vertex Array(정점 배열)를 저장하기 위한 객체입니다. 정점 배열은 제가 지금까지 데이터라고 불렀던, 정점의 위치와 인덱스에 대한 모든 정보를 가지고 있는 객체입니다. 

용어를 먼저 알려드려야 할 것 같네요. 정점의 위치를 저장하는 `gl.ARRAY_BUFFER`에 바인드된 버퍼는 보통 **VBO(Vertex Buffer Object)**, 삼각형의 인덱스를 저장하는 `gl.ELEMENT_ARRAY_BUFFER`에 바인드된 버퍼는 **IBO(Index Buffer Object)** 라고 불립니다. 즉, VAO는 VBO와 IBO에 대한 정보 플러스 데이터 해석 방법를 가지고 있는 것입니다.

GPU에서 일어나는 일들, 그 중 정점 데이터와 관련된 작업과 API을 리마인드를 해 보면 아래와 같습니다. 바로 이전 코드는 좀 길어졌으니 초반부 [2.Shader Attribute](../02_shader_attribute/contents.html)의 코드를 보시는 것도 좋겠습니다.

1. 버퍼 생성(`gl.createBuffer()`)
2. 버퍼 바인딩(`gl.bindBuffer()`)
3. 버퍼에 RAM으로부터 데이터 복사(`gl.bufferData()`)
4. Attribute 활성화 및 데이터 읽는방법 알려주기(`gl.enableVertexAttribArray()`, `gl.vertexAttribPointer()`)
5. 그리기(`gl.drawElements`)

VAO는 지금까지 숨겨져 있었는데요, <span style="color:red">사실 4번 과정의 결과는 VAO에 저장되고 있었습니다!</span> 무슨 말이냐면 우리가 버퍼에 데이터를 집어넣은 뒤 읽는 방법을 알려주면 GPU는 그 정보를 모두 VAO에 저장하고 있었다는 뜻입니다. 단지 그걸 우리에게 노출하지 않고 있었을 뿐입니다. 지난 [Part 1](../06_drawing_multiple_objects_pt1/contents.html)에서 우린 그걸 몰랐기 때문에 렌더링 시점에 다시 버퍼를 바인딩하고 읽는방법을 알려줬던 겁니다.

우리가 명시적으로 VAO를 만들어 주지 않으면, GPU에는 기본값으로 만들어져있는 하나의 VAO만을 사용하게 됩니다.(일반적으로 VAO 0라 부릅니다.) 따라서 이번에 우리는 사각형을 위한 VAO1, 삼각형을 위한 VAO2를 직접 만들어 준 뒤에 사각형에 대해 1-4과정을 거쳐 VAO1에 사각형 관련 데이터를 읽는 방법을 저장해 두고, 삼각형에 대해 1-4과정을 거쳐 VAO2에 데이터를 읽는 방법을 저장해 둘겁니다. (여기서 읽는 방법이란 단순히 바이트를 어떻게 끊어 읽을것인가가 아니라 어떤 버퍼들에서 데이터를 가져올 것인지도 포함됩니다.) 그리고 나서 렌더링 시점에는 다른 것 필요없이 VAO1을 바인딩한 후 렌더링하여 사각형을 그리고 VAO2를 바인딩한 후 렌더링하여 삼각형을 그릴겁니다.

VAO에 대한 설명을 좀 더 보고 싶으시다면 다시한번 [WebGL2 상태 다이어그램](https://webgl2fundamentals.org/webgl/lessons/resources/webgl-state-diagram.html)을 보시거나, [이 유튜브 영상](https://www.youtube.com/watch?v=WMiggUPst-Q)을 한번 보시면 좋을겁니다.

유의하셔야 할 것은 VAO는 이름 그대로 정점 데이터와 관련한 정보만을 저장한다는 것입니다. 셰이더 프로그램과는 관련이 없습니다!

## How to

이전 코드에서 변화된 내용들을 보자면 아래와 같습니다.

---
1. [초기화]사각형 VAO(=`vao1`) 생성

    ```js
    var vao1 = gl.createVertexArray();
    gl.bindVertexArray(vao1); 
    ```
    
    여전히 어렵지 않습니다. VAO를 만들라고 GPU에 API를 사용해 명령을 내려주면 되고, 사용하는 API는 `gl.createVertexArray()`입니다. 이 명령을 통해 GPU는 VAO를 하나 만들어 두고 그 ID를 반환해 주기 때문에 우리는 이를 `vao1` 변수에 저장해 둘겁니다.

    중요한 것은 이렇게 만든 VAO를 "바인딩한 뒤에" 나머지 작업을 해 줘야 한다는 것입니다. 여기서 나머지 작업이라 함은 아래 세 가지입니다. 

    * `gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,...)`
    * `gl.vertexAttribPointer(...)`
    * `gl.enableVertexAttribArray(...)`
    * (필요하다면) `gl.disableVertexAttribArray(...)`

    VBO는 나중에 바인딩해도 되는데요, 상세한 내용은 아래 Advanced 링크를 참고하세요.지금은 그냥 **"VAO를 먼저 바인딩한 뒤에 정점 관련한 모든 작업을 해야 한다"** 정도로 기억해 두시는 걸로 충분합니다.

    이후 VBO와 IBO를 만들어 복사해 넣고, 데이터를 읽는법을 알려주는 것은 동일합니다.

2. [초기화]사각형 VAO 언바인딩

    ```js
    gl.bindVertexArray(null); //나머지보다 먼저 언바인딩 해야 합니다!
    gl.bindBuffer(gl.ARRAY_BUFFER,null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,null);
    gl.useProgram(null);
    ```

    VAO를 언바인딩하는것도 나머지와 비슷합니다. `gl.bindVertexArray(null)`을 호출해 주면 됩니다. <span style="color:red">주의하셔야 할 것은 VAO 언바인딩을 먼저 하고 IBO를 언바인딩 해야 한다는 겁니다!</span> VBO는 먼저 언바인딩 해도 상관없는데 역시나 그냥 **"VAO를 가장 먼저 언바인딩 한다"** 정도로 기억해 두십시오.

3. [초기화]삼각형 VAO(=`vao2`) 생성

    ```js
    var vao2 = gl.createVertexArray();
    gl.bindVertexArray(vao2);
    ```

    1번 과정과 동일합니다. 먼저 `vao2`를 생성 후 바인딩해 두고, 이후 라인을 통해 VBO, IBO 및 데이터를 읽는법을 `vao2`에 알려줍시다.

4. [초기화]삼각형 VAO 언바인딩

    이후 렌더링에서 사각형부터 그릴 것이므로 2와 유사하게 `vao2`를 일단 언바인딩 해둡니다.

---

이제 아래는 렌더링 시점(`drawScene()` 함수 내부)의 바뀐 코드입니다.

---

5. [렌더링]사각형 정점 데이터 바인딩

    ```js
    gl.bindVertexArray(vao1);
    gl.useProgram(program1); 
    ```

    여기가 핵심이겠죠. 이전처럼 사각형 VBO를 바인딩하고, 읽는법을 알려주고, IBO를 바인딩하고 할 필요가 없습니다! VAO에 모든 정보가 들어있으니까요. 아주 간단해 졌습니다. 

    다시한번 말씀드리지만 (그리고 코드를 보면 아시겠지만) VAO는 이름 그대로 정점 데이터와 관련한 정보만을 저장한다는 것입니다. 셰이더 프로그램과는 관련이 없습니다! 셰이더 프로그램을 사용할 때는 따로 `gl.useProgram()`을 사용해 바인딩 해주어야 합니다.

6. [렌더링]사각형 정점 데이터 언바인딩 

    ```js
    gl.bindVertexArray(null);
    gl.useProgram(null);
    ```
    
    삼각형을 그리기 이전에 사각형 관련 데이터/프로그램을 언바인딩 해줍니다. 이제 데이터는 모두 VAO에 들어있으므로 VAO와 셰이더 프로그램 두 개만 언바인딩 해주면 됩니다.

7. & 8. [렌더링] 삼각형 정점 데이터 바인딩 및 드로우콜 후 언바인딩

    삼각형을 그리기 위해서는 삼각형과 동일하게 vao2만 바인딩해서 그리면 되고, 다음 `drawScene()` 호출을 대비해 안전하게 사용이 완료된 VAO와 셰이더 프로그램을 언바인딩 합니다.

---

`http://localhost:8080/lessons/practice/contents.html`(또는 `http://localhost:8080/lessons/06_drawing_multiple_objects_pt2/contents.html`)에 접속해서 우측 상단의 슬라이더를 움직여 보세요.  이전과 동일한 장면을 더 짧은 코드로 볼 수 있게 되었습니다.

코드가 절반 정도로 줄었다면 더 좋았을텐데 사실 그렇지는 않죠 ^^; 그런데 사실 우리는 간단한 것들을 그리고 있어서 그렇지 실제로 좀더 복잡한 것들을 그리게 된다면 굉장히 효과가 있습니다. 

코드가 많이 짧아지지 않아서 실망하셨다면 이후 몇 개 강의 내용이 아주 흥미로우실 겁니다. 지금은 명령문들을 쭉 나열해서 그리고 있지만 이제는 관련이 있는 것들을 클래스 단위로 관리할 수 있도록 코드를 좀 추상화 해볼 예정입니다. 

[첫 페이지](../../README.md)에서도 말씀 드렸지만 C++ 기준의 코드를 그냥 컨버팅한 것이라 좋은 스타일은 아닐겁니다. 웹 프로그래밍에 관심이 있으신 분은 JS 표준 스타일이나 TypeScript을 사용해 제가 보여드리는 예제 코드를 바꾸어 코딩해 보시는 것도 좋은 연습이 될 것입니다. 스스로 만든 다른 스타일의 코드를 이 Repository에 공유해서 후배들에게 도움이 되고 싶으신 분이 있으시다면 언제든지 연락 주세요!

## Quiz

1. 코드를 수정해서 슬라이더가 삼각형의 색상을 바꾸고, 사각형은 초록색으로 그려지도록 만들어 보세요. (*힌트: 두 물체를 그리기 위해 사용하는 셰이더를 바꾸면 되겠죠?*)

2. offset을 적용한 것을 응용해서, 화면에 사각형 두개와 삼각형 한개가 보이도록 코드를 수정 해보세요. 두 개의 사각형을 그리기 위해 별도의 정점 데이터를 추가하지 말고, 이미 만들어져 있는 사각형의 VAO만을 활용해야 합니다.

## Advanced

1. VAO를 VBO이후에 바인딩하는 것은 문제가 없습니다. 그런데 IBO이후에 바인딩하면 올바로 동작하지 않습니다. [왜 IBO이후에 바인딩하면 제대로 동작하지 않는지](https://stackoverflow.com/questions/31176226/when-using-ibo-ebo-program-only-works-when-i-call-glbindbuffer-to-bind-the-ibo), [왜 VBO 이후에 바인딩한 것은 상관이 없는지](https://stackoverflow.com/questions/26552642/when-is-what-bound-to-a-vao)까지 이해하시면 완벽합니다.

2. VBO는 VAO와 관련해서 `bufferData()`시점이 VAO 언바인딩 이후여도 상관이 없습니다. 반면 IBO는 언바인딩 이전에 `bufferData()`가 이루어져야 합니다. 예를 들어 예제 코드를 아래와 같이 바꿔도 잘 동작합니다.

    ```js
    var vao1 = gl.createVertexArray();
    
    //---GPU에 Vertex 데이터 전달---//
    var positionBuffer1 = gl.createBuffer(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer1); 
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rectanglePositions), gl.STATIC_DRAW);
    
    //---GPU에 Index 데이터 전달---//
    var indexBuffer1 = gl.createBuffer(); 
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer1); 
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(rectangleIndices), gl.ATIC_DRAW);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null); //IBO 언바인딩
    gl.bindVertexArray(vao1); 
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer1); //VAO가 바인딩 된 뒤에 IBO가 바인딩되었으므로 OK! 데이터는 이미 들어가있음!

    //---Shader Program 생성---//
    var program1 = webglUtils.createProgramFromSources(gl,	ectangleVertexShaderSource,   rectangleFragmentShaderSource]);
    gl.useProgram(program1); 
    ```

## Useful Links

- [WebGL2 상태 다이어그램](https://webgl2fundamentals.org/webgl/lessons/resources/webgl-state-diagram.html)
- [VAO 설명 영상](https://www.youtube.com/watch?v=WMiggUPst-Q)
- [VAO에 대한 상세 설명](https://stackoverflow.com/questions/26552642/when-is-what-bound-to-a-vao)

---

[다음 강의](../07_buffer_abstraction/)

[목록으로](../)
