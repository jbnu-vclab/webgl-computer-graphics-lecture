const {mat2, mat3, mat4, vec2, vec3, vec4} = glMatrix;

class Light {
    lightColor;
    ambientIntensity;
    diffuseIntensity;
    depthMapWidth;
    depthMapHeight;
    depthMap;
  
    constructor(gl, mapWidth, mapHeight, lightColor, aIntensity, dIntensity)
    {
      this.depthMapWidth = mapWidth;
      this.depthMapHeight = mapHeight;
      this.lightColor = lightColor;
      this.ambientIntensity = aIntensity;
      this.diffuseIntensity = dIntensity;

      this.depthMap = new DepthMap(gl, this.depthMapWidth, this.depthMapHeight);
    }
}
  
export class DirectionalLight extends Light {
    direction;
    lightProjection;
    farPlane;

    constructor(gl, mapWidth, mapHeight, lightColor, aIntensity, dir, dIntensity)
    {
        super(gl, mapWidth, mapHeight, lightColor, aIntensity, dIntensity);
        this.direction = dir;
        this.farPlane = 10.0;
    }

    UseLight(gl,shader) // --> main.js의 1) 셰이더를 사용할 때(다음 강의에서)
    {
        shader.SetUniform3f(gl,"u_directionalLight.base.lightColor", this.lightColor[0], this.lightColor[1], this.lightColor[2]);
        shader.SetUniform1f(gl,"u_directionalLight.base.ambientIntensity", this.ambientIntensity);
        shader.SetUniform1f(gl,"u_directionalLight.base.diffuseIntensity", this.diffuseIntensity);

        shader.SetUniform3f(gl,"u_directionalLight.direction", this.direction[0], this.direction[1], this.direction[2]);

        //depthmap이 어떤 view projection matrix로 생성된 것인지 알려줘야 합니다.
        shader.SetUniformMat4f(gl,"u_directionalLightViewProjection", this.CalculateLightTransform());
    }

    
    UseLightForShadow(gl,shader) // --> main.js의 2) 셰이더를 사용할 때
    {
        // 정확히 어떤 셰이더의 어떤 uniform 변수에 값을 전달하는 것인지 잘 보세요.
        shader.SetUniformMat4f(gl,"u_directionalLightViewProjection", this.CalculateLightTransform());
    }

    CalculateLightTransform()
    {
        //Light에 대한 Projection matrix
        this.lightProjection = mat4.create();
        mat4.ortho(this.lightProjection, -2.0, 2.0, -2.0, 2.0, 0.1, this.farPlane);

        //light에 대한 View matrix
        //directional light는 원래 위치가 정해져 있지 않지만,
        //(0,0,0)을 기준으로 direction의 반대 방향만큼 떨어져 있다고 가정하고 view matrix를 정의합니다.
        let negDirection = vec3.create();
        vec3.scale(negDirection, this.direction, -1.0);
        let lightView = mat4.create();
        mat4.lookAt(lightView, negDirection, [0.0,0.0,0.0], [0.0,1.0,0.0]);

        //생성자에서 만들어둔 projection matrix와 곱하여 반환
        let viewProjectionMat = mat4.create();
        mat4.multiply(viewProjectionMat, this.lightProjection, lightView);

        return viewProjectionMat;
    }

    SetLightXDir(x)
    {
        this.direction[0] = x;
    }
    SetLightYDir(y)
    {
        this.direction[1] = y;
    }
    SetLightZDir(z)
    {
        this.direction[2] = z;
    }
    SetFarPlane(f)
    {
        this.farPlane = f;
    }
}

//LightExt가 멤버로 가질 DepthMap을 정의합니다. 별도 파일에 분리하는 것이 더 좋을지도?
class DepthMap {
    width;
    height;
    mapID;
    fboID;

    constructor(gl,width, height)
    {
      this.width = width;
      this.height = height;
  
      //프레임 버퍼에 쓰여진 데이터는 텍스처로 저장할 겁니다.
      this.mapID = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.mapID);
      //텍스처를 생성합니다. 데이터는 null로 초기화합니다.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, this.width, this.height, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      //!!(주의)!!mag & min filter model를 linear로 하면 제대로 동작하지 않음!
      
      //추가적인 프레임 버퍼 객체를 만듭니다.
      //프레임 버퍼는 기본적으로 화면에 그려지는 Color, depth 버퍼 등이 포함된 버퍼로,
      //기본적으로 하나가 생성되어 우리는 이미 canvas에 결과물을 그리기 위해 활용하고 있습니다만, 
      //Shadow처럼 화면을 한번 그린 후 그 데이터를 사용하고 싶을 때는
      //추가적인 화면에 그려지지 않는(모니터에 표시하지 않는) 프레임버퍼를 만들어 사용 가능합니다.
      this.fboID = gl.createFramebuffer();
      //만들어둔 프레임 버퍼를 바인딩합니다.
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboID);
      //프레임버퍼와 depth map 용으로 준비해둔 텍스처를 연결합니다.
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.mapID, 0);
      
      status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (status != gl.FRAMEBUFFER_COMPLETE) {
        console.log("The created frame buffer is invalid: " + status.toString());
      }
  
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D,null);
    }
    
    Bind(gl)
    {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboID);
    }
  
    Unbind(gl)
    {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  
    Read(gl,slot)
    {
      //Texture의 bind와 동일합니다.
      gl.activeTexture(gl.TEXTURE0 + slot);
      gl.bindTexture(gl.TEXTURE_2D, this.mapID);    
    }
  }