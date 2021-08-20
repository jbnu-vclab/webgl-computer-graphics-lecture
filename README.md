# JBNU WebGL Computer Graphics Lecture Material

전북대학교 컴퓨터공학부 "컴퓨터 그래픽스"강의를 위한 Repository입니다. WebGL을 기반으로 합니다.

WebGL 구현을 위해 JS(자바스크립트)와 GLSL을 사용합니다. HTML과 CSS도 밀접하게 관련되어 있으나 이 강의에서는 단순 사용만 할 뿐, 내용을 다루지 않습니다.

## Why WebGL?

이전 강의에서는 C++과 OpenGL을 사용하여 컴퓨터 그래픽스 강의에 대한 실습을 진행하였습니다. 물론 큰 문제는 없었지만 아래와 같은 이유로 인해 WebGL을 사용하는 것으로 실습 환경을 바꾸는 것이 좋겠다고 생각하여 이 Repository를 만들었습니다.

1. OpenGL은 플랫폼 독립적이지만, 함께 사용하는 GLFW, GLEW의 경우 Windows/Mac에서 사용 방법에 차이가 있어서 Mac을 사용하는 학생이 어려움을 겪는 경우가 있습니다.

2. 향후 여러분이 직접 OpenGL 프로그래밍을 할 일은 거의 없으실겁니다. (Direct3D라면 조금 가능성이 있겠지만요.) 따라서 굳이 OpenGL Specific한 내용을 배운다고 미래에 도움이 되지는 않을겁니다. 오히려 WebGL은 실무에서 약간 사용할 수도 있을 것 같습니다.

3. 이 수업은 WebGL(또는 OpenGL) 프로그래밍을 가르치는 수업이 아니고 컴퓨터 그래픽스 동작 방식을 배우는 수업이며, WebGL은 직접 이를 눈으로 확인하기 위한 수단일 뿐입니다. 따라서 이 수업의 목적을 위해서는 둘 중 어느 환경에서 실습해도 우열은 없습니다.

4. WebGL이든 OpenGL이든 여러분이 API를 통해 해야 할 일은 동일합니다. **WebGL을 사용할 줄 알면, OpenGL은 손쉽게 사용 가능**하고 그 반대도 마찬가지입니다.

그래도 여전히 OpenGL로 내용을 보고 싶으신 분들은 이 Repository와 거의 동일한 구성으로 만들어진 [OpenGL 강의 코드](https://github.com/diskhkme/OpenGL_Lecture_Material)를 보시면 됩니다.

## How to use
- 이 Repository를 학습을 위해 사용하는 방법에는 크게 두 가지가 있습니다.

1. 이 Repository를 Clone하고 lessons 폴더 하위의 개별 예제들을 보며 공부하기
2. 이 Repository의 초기 커밋을 Clone하고 이후 커밋의 변경사항을 따라서 코딩해보기

- 저는 가급적 2번 방법으로 직접 따라서 코드를 직접 작성해 보시기를 추천 드립니다. Github desktop이나 Sourcetree등 툴을 사용하시면 이전 강의내용에서 이번 강의내용 구현까지 어떤 코드들이 변했는지 손쉽게 살펴볼 수 있습니다.

- 실제 이 사이트 코드를 사용해 웹브라우저로 WebGL 화면을 보는 방법은 `/lessons/0_Setup/`을 참고하세요.

## Folder Structure
- 주요 폴더들과 그 설명은 아래와 같습니다.
    * `/resources/`: HTML 페이지에 사용할 CSS, 렌더링에 사용할 모델(*.obj) 및 텍스처 이미지, 외부 라이브러리 코드가 포함되어 있습니다. (출처: [WebGL2 Fundamental Repository](https://github.com/gfxfundamentals/webgl2-fundamentals))
    * `/lessons/_classes/`: 진행 도중 작성할 클래스 구현 코드들이 들어있는 폴더입니다. (*주의: 이 사이트의 코드는 제가 이전에 [OpenGL 강의에 사용한 코드](https://github.com/diskhkme/OpenGL_Lecture_Material)와 통일성을 주기 위해 JS 스타일이 아닌 C++ 스타일을 모사하여 작성되었습니다. 실제 WebGL App을 작성하기 위해서는 JS 스타일에 맞게 구현하시는 것이 좋습니다.*)
    * `/lessons/_shaders/`: 진행 도중 작성할 GLSL 셰이더 코드들이 있는 폴더입니다.
    * `/lessons/_current/`: **현재 커밋의 가장 최신 HTML을 담고있는 코드입니다. "How to use"의 2번 방법을 따라가시는 분들은 이 폴더내 HTML코드의 변화에 주목하시면 됩니다.**
    * `lessons/#_XXX/`: 각 강의내용의 완성된 HTML을 개별적으로 분리하여 저장해 둔 폴더입니다.

## Important Links for Starting
- [Mozilla의 WebGL Reference](https://developer.mozilla.org/ko/docs/Web/API/WebGL_API): WebGL 코드의 정의를 찾아볼 때는 이 링크를 사용하세요.
- [WebGL2 Fundamental](https://webgl2fundamentals.org/webgl/lessons/ko/): 추가적인 설명이 보고싶거나, WebGL 관련한 보다 상세한 내용이 궁금할 때는 이 링크를 참고하세요.
- [OpenGL Lecture Series](https://www.youtube.com/watch?v=W3gAzLwfIP0&list=PLlrATfBNZ98foTJPJ_Ev03o2oq3-GGOS2): "The Cherno"라는 개발자의 C++ OpenGL 강의 영상입니다. 제 [OpenGL 강의 코드](https://github.com/diskhkme/OpenGL_Lecture_Material)가 이 스타일을 따랐고, 이 Reposiroty의 코드도 이 스타일을 따르고 있습니다.
- [Serves](https://greggman.github.io/servez/): 이 Repository의 결과물을 정상적으로 보려면 웹서버가 필요합니다. 간단하게 설치할 수 있는 웹서버입니다. (`/lessons/0_Setup/`에서 설치, 사용 방법 설명)

## Ray Tracing
- 다른 카테고리의 렌더링 방법으로 광선 추적(Ray Tracing)이 있습니다. 광선 추적 또한 이번 학기 강의 후반부에 다룰 예정입니다.
- 가장 좋은 공부 방법은 [TinyRaytracer](https://github.com/ssloy/tinyraytracer) 또는 [Ray Tracing in one weekend](https://raytracing.github.io/books/RayTracingInOneWeekend.html)와 같은 자료를 참고하여 직접 구현해 보는 것입니다.
- 해당 자료들을 기반으로 제가 구현한 코드는 [링크](https://github.com/diskhkme/TinyRaytracer_SFML)에 있으니 참고 하시기 바랍니다.
