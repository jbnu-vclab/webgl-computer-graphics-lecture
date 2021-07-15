// VertexBuffer 관리를 위한 클래스 구현
export default class VertexBuffer{
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