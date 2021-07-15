export default class VertexArray{
    id;
    
    constructor(gl)
    {
      this.id = gl.createVertexArray(); 
    }
    
    Bind(gl)
    {
      gl.bindVertexArray(this.id);
    }
    
    Unbind(gl)
    {
      gl.bindVertexArray(null);
    }
    
    AddBuffer(gl, vb, countArray, normalizedArray)
    {
      console.assert(countArray.length == normalizedArray.length,
         "length of countArray and normalizedArray should match!");
      this.Bind(gl);
      vb.Bind(gl); 
    
      var stride = 0;
      for(var i=0;i<countArray.length;i++)
      {
        stride += countArray[i] * 4;
      }
      
      var offset = 0;
      for(var i=0;i<countArray.length;i++) 
      {
          gl.enableVertexAttribArray(i); 
          gl.vertexAttribPointer(i, countArray[i], gl.FLOAT, normalizedArray[i], stride, offset);
          offset += 4*countArray[i];
      }
    }
}
