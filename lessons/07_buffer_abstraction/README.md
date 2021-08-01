# 7. Buffer Abstraction

Abstraction의 첫 단계로 버퍼를 관리하는 클래스를 만들어 보겠습니다. 중요한 부분에 집중하기 위해 삼각형을 그리는 코드를 지우고 사각형을 그리는 코드만 남겨 두었습니다. 하지만 여러 개의 물체를 그리기 위해서는 어떤 과정들이 필요했는지는 꼭 기억해 두십시오!

지금 쯤이면 버퍼에 대해 꽤 익숙해 지셨을 것 같습니다. 해야 하는 작업들이 어려운 것이 아니니 바로 코드로 들어가 보겠습니다.

## How to

이전 코드에서 변화된 내용들을 보자면 아래와 같습니다.

---
1. VertexBuffer 클래스 구현

    ```js
    // VertexBuffer 관리를 위한 클래스 구현
    class VertexBuffer{
        id; // 멤버 변수(필드)
    
        constructor(gl, data) //생성자
        {
            this.id = gl.createBuffer(); 
            gl.bindBuffer(gl.ARRAY_BUFFER, this.id); 
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        }
        
        Bind(gl)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
        }
        
        Unbind(gl)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }
    }
    ```
    
    JS는 처음 접한다고 하셔도 C++ 강의를 들으신 분들이기 때문에 위 코드를 보면 바로 이해가 되실겁니다. 버퍼를 생성은 정점 데이터(ex, 좌표)를 GPU에 전달하기 위해 사용되므로 버퍼를 만들고 바인딩해서 `bufferData()` 호출로 데이터를 GPU로 복사하는 것까지 모두 생성자에서 하도록 했습니다.

    그 외에는 필요한 경우 바인딩/언바인딩을 할 수 있도록 메소드(멤버함수)를 구현해 줬습니다. 이렇게 하면 굳이 내가 지금 바인딩/언바인하고자 하는게 VBO인지 IBO인지 생각해서 `gl.ARRAY_BUFFER`를 사용할지 `gl.ELEMENT_ARRAY_BUFFER`를 사용할지 고민할 필요가 없겠죠? `VertexBuffer` 클래스는 항상 `gl.ARRAY_BUFFER` 관련한 작업만 하게 되어 있으니까요.
    
    한 가지 주의하실 것은 `gl` 컨텍스트를 모든 메소드의 첫 인자로 넘겨주고 있다는 것입니다. 나중에 메소드를 호출할 때 빼먹고 실수하기 쉬우니 꼭 기억해 두십시오. (이와 관련해서 Advanced의 항목도 한번 읽어 보세요.)

2. IndexBuffer 클래스 구현

    ```js
    // IndexBuffer 관리를 위한 클래스 구현
    class IndexBuffer{
        id;
        count;

        constructor(gl, data, count)
        {
            this.id = gl.createBuffer(); 
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id); 
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
            
            this.count = count; //나중에 drawElement를 할 때 몇 개의 index를 그릴 것인지 명시해 주어야 하므로 따로 저장함
        }
        
        Bind(gl)
        {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
        }
        
        Unbind(gl)
        {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        }
        
        getCount()
        {
            return this.count;
        }
    }
    ```

    거의 비슷합니다. 다만 IBO중에 몇 개를 그릴지를 `count`를 사용해 명시적으로 전달해 주었고 필드에 저장해둔 `count`를 반환해주는 `getCount()`를 getter로 구현해 두었습니다. 나중에 드로우콜을 호출할 때 사용됩니다.

3. [초기화] VertexBuffer/IndexBuffer 클래스 객체 생성

    ```js
    let rectangleVB = new VertexBuffer(gl, rectanglePositions); //<-- VertexBuffer 클래스 사용

    let rectangleIB = new IndexBuffer(gl, rectangleIndices, 6); //<-- IndexBuffer 클래스 사용
    ```

    이제 GPU에 정점 좌표와 인덱스 정보를 전달하는 코드가 단 두줄로 끝나게 되었습니다. 버퍼 생성, 바인딩 및 데이터 복사가 모두 두 클래스의 생성자에서 수행됩니다. 
    
    클래스 생성에 `let`키워드를 사용하였는데 JS에서 가급적 `var`보다는 `let`을 사용하는 것이 안전합니다. ([var, let, const 키워드](https://velog.io/@bathingape/JavaScript-var-let-const-%EC%B0%A8%EC%9D%B4%EC%A0%90)) 이전에 다른 부분에서는 저도 관습적으로 `var`을 사용했는데 나중에는 수정할 것 같습니다.

4. [렌더링] 사각형 그리기

    ```js
    var primitiveType = gl.TRIANGLES;
    var indexcount = rectangleIB.getCount(); //<-- 인덱스 몇개를 그릴지 하드코딩하지 않고 IB로부터 얻어옵니다.
    var indexoffset = 0
    gl.drawElements(primitiveType, indexcount, gl.UNSIGNED_SHORT, 0);
    ```

    이전 예제를 통해 정점 데이터를 읽어오는 부분을 개별 버퍼의 접근이 아닌 VAO를 통한 접근으로 바꿔 두었기 때문에 그 부분은 변화가 없습니다. 드로우콜 호출할때 IndexBuffer 객체의 `getCount()` 메소드로 몇 개의 인덱스 정보를 그릴지를 얻어오는 부분만 수정되었습니다.

---

`http://localhost:8080/lessons/_current/contents.html`(또는 `http://localhost:8080/lessons/07_buffer_abstraction/contents.html`)에 접속해서 우측 상단의 슬라이더를 움직여 보세요. 사각형이 표시되고 색상이 변하면 수정된 코드가 문제없이 동작하는겁니다.

클래스/필드/메소드가 뭐고 생성자가 뭔지 모르는 채로 이 강의를 듣는 분은 없으실 것으로 압니다. (C++ 혹은 JAVA가 선수과목입니다.) 혹시나 그런 분이 계시다면 지금이라도 객체지향 프로그래밍 관련해서 먼저 이해를 하시고 나머지 내용을 보셔야 이해가 될겁니다.

<span style="color:red">**여기에 작성한 VertexBuffer/IndexBuffer 클래스 정의는 코드를 간결하게 하기 위해서 다음 커밋에서부터는 다른 파일로 옮겨질 예정입니다. `lessons/_classes/`안으로 옮겨질 예정이니 참고 하시기 바랍니다.**</span>

옮겨진 클래스 구현은 [링크](https://ko.javascript.info/import-export)의 설명에 따라 구현되었으니 참고 하시기 바랍니다.

## Quiz

없음

## Advanced

1. 클래스 메소드에 첫 번째 인자로 `gl` 컨텍스트를 계속 참조하도록 하고 있습니다. 꼭 이렇게 귀찮게 해야하나, 그냥 전역변수로 두거나 멤버로 저장해 두면 안되나 하는 의문이 떠오르셨을 겁니다. (떠오르셨길 바랍니다.) 지금은 컨텍스트(캔버스)가 하나지만 이것이 꼭 하나라는 법은 없습니다. 동일한 데이터를 여러 캔버스에 그릴 수도 있겠죠. 그러한 경우를 생각하면 전역변수로 두는것, 멤버로 저장해 두는 것 모두 설계 관점에서 좋은 선택이 아닙니다.

2. VertexBuffer, IndexBuffer 모두 들어오는 데이터가 Float32, UInt16이라고 가정하고 있습니다. 문제가 좀 있어 보이죠? 어떻게 해결할 수 있을지 한 번 생각해 보세요. 하지만 이 강의에는 항상 float32만 사용하기 때문에 그냥 둘 예정입니다.

## Useful Links

- [var, let, const 키워드](https://velog.io/@bathingape/JavaScript-var-let-const-%EC%B0%A8%EC%9D%B4%EC%A0%90)
- [모듈 내보내고 가져오기](https://ko.javascript.info/import-export)
- [더 많은 기능을 가진 Abstraction 코드(from WebGL2Fundamentals)](https://webgl2fundamentals.org/webgl/lessons/ko/webgl-less-code-more-fun.html)

---

[다음 강의](../08_vertex_array_abstraction/)

[목록으로](../)