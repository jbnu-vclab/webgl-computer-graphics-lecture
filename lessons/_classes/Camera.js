const {mat2, mat3, mat4, vec2, vec3, vec4} = glMatrix;

export default class Camera{
    //Camera 좌표계 계산을 위한 vector들
    eye;
    worldup;
    front;
    //계산된 Camera 좌표 축 vector들
    right;
    up;
    //Camera 좌표계를 계산하기 위한 yaw, pitch 각
    yaw = 0;
    pitch = 0;
    //Camera의 이동/회전 속도 제어 매개변수
    movespeed;
    turnspeed;
    //마우스 커서 이동량을 계산하기 위한 멤버 변수
    lastMouseX;
    lastMouseY;

    
    constructor(eye, up, yaw, pitch, movespeed, turnspeed)
    {
        this.eye = eye; this.worldup = up; this.yaw = yaw; this.pitch = pitch;
        this.movespeed = movespeed; this.turnspeed = turnspeed;
        this.front = [0.0,0.0,-1.0]; //바라보는 방향. at = eye + front로 계산
        this.lastMouseX = -1.0; 
        this.lastMouseY = -1.0;

        this.right = vec3.create();
        this.up = vec3.create();
        this.Update();
    }
    
    KeyControl(e)
    {
        //WASD 키로 eye 위치를 변경해 줍니다.
        //vec3.add(), sub()를 사용해 벡터끼리의 덧셈, 뺄셈 연산을 수행합니다.
        //마찬가지로 벡터와 스칼라의 곱은 vec3.scale()를 사용합니다.
        if(e.code == "KeyA") // 'A' key down
        {
            let scaledVec = vec3.create();
            vec3.scale(scaledVec, this.right, this.movespeed);
            vec3.sub(this.eye, this.eye, scaledVec);
        }
        if(e.code == "KeyD") // 'D' key down
        {
            let scaledVec = vec3.create();
            vec3.scale(scaledVec, this.right, this.movespeed);
            vec3.add(this.eye, this.eye, scaledVec);
        }
        if(e.code == "KeyW") // 'W' key down
        {
            let scaledVec = vec3.create();
            vec3.scale(scaledVec, this.front, this.movespeed);
            vec3.add(this.eye, this.eye, scaledVec);
        }
        if(e.code == "KeyS") // 'S' key down
        {
            let scaledVec = vec3.create();
            vec3.scale(scaledVec, this.front, this.movespeed);
            vec3.sub(this.eye, this.eye, scaledVec);
        }
    }
    
    MouseControl(e)
    {
        //마우스로 카메라의 바라보는 방향을 변경합니다.
        
        let currentMouseX = e.clientX;
        let currentMouseY = e.clientY;
        
        //처음 마우스가 움직였을때, last값을 현재값으로 할당합니다.
        if(this.lastMouseX == -1.0)
        {
            this.lastMouseX = currentMouseX;
            this.lastMouseY = currentMouseY;
        }
        
        //각 이벤트 호출시마다 마우스가 얼마나 이동했는지, 이동량을 계산합니다.
        let mouseChangeX = (currentMouseX - this.lastMouseX) * this.turnspeed;
        let mouseChangeY = (currentMouseY - this.lastMouseY) * this.turnspeed;
        
        //마우스 좌우이동은 yaw각(y축 기준 회전), 상하이동은 pitch각(x축 기준 회전)을 변경합니다.
        this.yaw += mouseChangeX;
        this.pitch -= mouseChangeY;
        
        //pich각은 제한을 줍니다.(고개를 90도 이상 들거나 내리지 못하도록)
        if(this.pitch > 89.0) this.pitch = 89.0;
        if(this.pitch < -89.0) this.pitch = -89.0;
        
        this.Update();
        
        this.lastMouseX = currentMouseX;
        this.lastMouseY = currentMouseY;
    }
    
    CalculateViewMatrix()
    {
        //mat4의 lookAt은 camera matrix를 반환합니다.
        let cameramat = mat4.create();
        let at = vec3.create();
        vec3.add(at, this.eye,this.front)
        mat4.lookAt(cameramat, this.eye, at, this.up);
        return cameramat;
    }
    
    Update()
    {
        //yaw,pitch 각도를 사용해 front 방향벡터를 계산합니다.
        //구면 좌표계 -> 카르테시안 좌표계 변경식을 사용합니다.
        this.front[0] = Math.cos(this.yaw * Math.PI / 180) * Math.cos(this.pitch * Math.PI / 180);
        this.front[1] = Math.sin(this.pitch * Math.PI / 180);
        this.front[2] = Math.sin(this.yaw * Math.PI / 180) * Math.cos(this.pitch * Math.PI / 180)
        vec3.normalize(this.front,this.front);
        
        //front 방향과 up 방향을 외적해 right 방향을 계산합니다.
        vec3.cross(this.right, this.front, this.worldup)
        vec3.normalize(this.right,this.right);
        //마지막으로 front 방향과 right 방향을 외적해 up 방향을 계산합니다.
        vec3.cross(this.up, this.right, this.front)
        vec3.normalize(this.up,this.up);
    }
}