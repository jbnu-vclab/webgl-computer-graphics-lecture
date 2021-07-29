//Texture class
export default class Texture {
    id;
    image;
    
    constructor(gl)
    {
        this.id = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.id);
        
        //텍스처 맵핑 및 필터링 옵션 설정
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        //1x1 크기의 임시 텍스처를 생성합니다.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                        new Uint8Array([0, 0, 255, 255]));
        gl.bindTexture(gl.TEXTURE_2D, null);
       
    }
    
    LoadeTextureFromImage(gl, path)
    {
        this.image = new Image();
        
        //아래 익명함수 대신 콜백을 별도로 구현해 사용해도 됩니다.
        //다만 이벤트 리스너 설정을 src 설정 이전에 해주어야 합니다.
        //this.image.addEventListener("load", this.ChangeTexture(gl));

        this.image.src = path;
        this.image.crossOrigin = "";   // CORS 권한 요청
        // 텍스처를 로딩할 때 시간이 소요됩니다. 로드가 완료되면 그 이미지로 임시 텍스처를 대체합니다.
        this.image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, this.id);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, this.image);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);
        };
    }
    
    //slot은 texture unit을 명시합니다.
    //자세한 내용은 강의 자료를 참고하세요.
    Bind(gl,slot)
    {
      gl.activeTexture(gl.TEXTURE0 + slot);
      gl.bindTexture(gl.TEXTURE_2D, this.id);
    }
    
    Unbind(gl)
    {
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }