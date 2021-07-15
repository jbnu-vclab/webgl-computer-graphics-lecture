// IndexBuffer 관리를 위한 클래스 구현
export default class IndexBuffer{
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