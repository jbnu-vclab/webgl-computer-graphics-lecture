# 3. Draw from Index

이번에는 삼각형이 아닌 사각형을 그리면서 정점 인덱스를 사용하는 방법에 대해 알아보겠습니다.

사각형을 화면에 표시하기 위해서는 삼각형이 두 개가 필요합니다. 삼각형이 두개이니 정점은 6개가 필요하지만 실제로 6개 중 두 개의 정점은 동일한 좌표값을 가지므로 Unique한 좌표 값만을 생각해보면 4개의 정점만 있으면 됩니다.

이렇게 중복되는 정점을 여러 삼각형에서 공유하여 사용하려면 인덱스를 활용해서 삼각형을 정의해야 합니다. 코드로 직접 보시죠.

## How to

이전 코드에서 변화된 내용들을 보자면 아래와 같습니다.

---
1. 정점 4개 정의

    ```js
    var positions = [ //사각형의 4개 점들을 우선 정의
        -0.5, -0.5, //0번 vertex
         0.5, -0.5, //1번 vertex
         0.5,  0.5, //2번 vertex
        -0.5,  0.5, //3번 vertex
    ];
    ```

2. 인덱스 정의

    ```js
    var indices = [
        0, 1, 2, //0,1,2번 vertex로 이루어진 삼각형
        2, 3, 0, //2,3,0번 vertex로 이루어진 삼각형
    ];
    ```

    이제 사각형을 이루는 두 개의 삼각형이 어떤 정점들로 이루어져 있는지를 `indices`라는 배열에 정의합니다. 이전과 마찬가지로 6개의 숫자 데이터일 뿐이지만 우리는 삼각형을 그리도록 데이터를 정의한 것이기 때문에 알아보시기 쉽도록 3개씩 끊어서 주석을 적어 두었습니다.

    위의 네 개 정점의 위치를 노트에 그려보고, (0, 1, 2 / 2, 3, 0) 인덱스로 어떻게 두 개의 삼각형을 만들 수 있는지를 먼저 확인해 보세요.

3. 인덱스 데이터 GPU로 전달

    ```js
    var indexBuffer = gl.createBuffer(); //1. 버퍼 만들기
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); //2. 버퍼 바인딩
    var uintIndices = new Uint16Array(indices); 
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, //3. 데이터 복사해 넣기
                uintIndices, 
				gl.STATIC_DRAW);
    ```

    `positions` 데이터를 GPU로 전달한 것과 동일한 과정을 거칩니다. 
    
    1. 인덱스 정보를 저장할 버퍼를 GPU에 만들어 두고, 
    2. `gl.ELEMENT_ARRAY_BUFFER`로 해당 버퍼를 바인딩해서, 이후 데이터를 집어넣을 때 우리가 만든 버퍼에 데이터가 들어가도록 준비해 둡니다. 
    3. 마지막으로 `gl.ELEMENT_ARRAY_BUFFER`에 `bufferData()`를 사용해 데이터를 집어넣으면 1에서 우리가 만들어둔 버퍼가 `gl.ELEMENT_ARRAY_BUFFER`에 바인딩되어 있으므로 그 곳에 데이터가 들어가게 됩니다.

    `positions`처럼, JS 배열을 `Uint16` 타입으로 명시된 배열로 바꾸기 위해 먼저 생성해 둔 것도 잊지 마세요.

4. 인덱스를 사용하는 드로우콜

    ```js
    gl.drawElements(gl.TRIANGLES,  // 삼각형을 그려라
                    6, //6개의 index를 그려라
                    gl.UNSIGNED_SHORT, //index는 unsigned short 타입으로 정의되어 있다
                    0); //0번 위치부터 데이터를 읽어라
    ```

    인덱스를 사용해 그릴 때에는 `drawArrays()` 대신 `drawElements()` 함수를 호출해야 합니다. `drawArrays()`와 비교해 보면 인자를 하나 더 전달해 주어야 하는 것을 볼 수 있습니다.

    연습 겸 해서 [레퍼런스 문서](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements)를 한번 읽어 보시고, 아래 설명을 보시면 좋을 것 같네요.

    * `gl.TRIANGLES`: (mode) 현재 그리려고 하는 것이 무엇인지를 명시합니다. 우리는 삼각형을 그리려는 것이고, 문서를 보면 아시겠지만 다른 것들도 그릴 수 있습니다.
    * `6`: (count) 몇 개의 데이터를 그릴 것인지를 명시합니다. 삼각형 두 개에 해당하는 인덱스 6개가 있으므로 6을 인자로 넘겨줍니다.
    * `gl.UNSIGNED_SHORT`: (type) 인덱스가 어떠한 데이터 타입으로 버퍼에 들어가 있는지를 알려줍니다.
    * `0`: (offset) 첫 데이터를 어디부터 읽을지를 명시합니다. 0~5까지 6개의 인덱스를 모두 사용할 것이므로 0부터 시작하도록 합니다.
---

`http://localhost:8080/lessons/practice/contents.html`(또는 `http://localhost:8080/lessons/03_draw_from_index/contents.html`)에 접속해 보시면 화면에 파란색 사각형이 나오는 것을 보실 수 있습니다.

짝짝짝~ 하고 끝내지 마시고, 한번 생각해 봅시다. 앞서 우리가 정점 좌표 (`positions`)를 전달할 때에는 `vertexAttribPointer()`를 사용해 데이터를 어떻게 끊어서 읽을지를 따로 명시해 주었습니다. 인덱스와 관련해서는 왜 그런 API의 호출이 명시적으로 필요하지 않은걸까요? 스스로 생각해 보신 후에 아래 글을 펼쳐서 읽어보세요.

<details>
  <summary>생각해 보셨나요?</summary>
  
  `drawElements()`의 인자로 데이터를 읽는 방법이 모두 설명되어 있습니다. `gl.TRIANGLES`이니 당연히 인덱스 3개씩이 필요하고, `gl.UNSIGNED_SHORT`를 통해 각 인덱스가 `UInt16`으로 표현되어 있다는 것을 알려주었습니다. 따라서 GPU는 버퍼에 쓰여진 데이터를 2바이트씩 끊어서 읽을 수 있습니다.
</details>

## Quiz

1. `gl.TRIANGLES` 대신 `gl.LINES`나 `gl.LINE_STRIP`으로 바꾸어서 그려지는 결과를 보고, 왜 그런 결과가 나왔는지 생각해 보세요. 각각이 무엇을 의미하는지는 아래 "Useful Links"의 글을 한 번 읽어보세요.

2. `drawElements()`의 두 번째 인자로 3을 넣으면 우측 하단의 삼각형 하나만 그려지게 됩니다. 왜 그럴까요?

3. 반대로, `drawElements()`의 인자를 바꾸어서 좌측 상단의 삼각형 하나만 그려지도록 바꾸어 보세요. (*힌트: 레퍼런스 문서에 써있다시피 `offset`은 바이트 단위의 크기를 인자로 받습니다!*)

## Useful Links

- [WebGL2 점, 선, 삼각형](https://webgl2fundamentals.org/webgl/lessons/ko/webgl-points-lines-triangles.html)
- [drawElements 레퍼런스 문서](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements)

---

[다음 강의](../04_shader_uniform/)

[목록으로](../)
