const {mat2, mat3, mat4, vec2, vec3, vec4} = glMatrix;

// Orbit Camera class
export default class OrbitCamera {
	constructor(eye, at, up, yaw, pitch, distance,  turnspeed)
	{
		this.eye = eye; this.worldup = up; this.yaw = yaw; this.pitch = pitch;
		this.turnspeed = turnspeed;
		this.worldAt = at;
		this.distance = distance;
		this.front = [0.0, 0.0, -1.0];

		this.right = vec3.create();
        this.up = vec3.create();
		
		this.Update();
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
		//yaw,pitch 각도를 사용해 eye 위치를 변경합니다.
		//구면 좌표계 -> 카르테시안 좌표계 변경식을 사용합니다.
		this.front[0] = Math.cos(this.yaw * Math.PI / 180) * Math.cos(this.pitch * Math.PI / 180);
        this.front[1] = Math.sin(this.pitch * Math.PI / 180);
        this.front[2] = Math.sin(this.yaw * Math.PI / 180) * Math.cos(this.pitch * Math.PI / 180)
        vec3.normalize(this.front,this.front);
		
		//기존 front 계산 결과의 방향을 뒤집고 길이가 distant인 벡터 back을 계산합니다.
		let back = vec3.create();
		vec3.scale(back, this.front, -this.distance);

		//at에서 back만큼 떨어진 위치를 카메라 위치로 설정합니다.
		vec3.add(this.eye, this.worldAt, back);
        
        //front 방향과 up 방향을 외적해 right 방향을 계산합니다.
        vec3.cross(this.right, this.front, this.worldup)
        vec3.normalize(this.right,this.right);
        //마지막으로 front 방향과 right 방향을 외적해 up 방향을 계산합니다.
        vec3.cross(this.up, this.right, this.front)
        vec3.normalize(this.up,this.up);
	}
}