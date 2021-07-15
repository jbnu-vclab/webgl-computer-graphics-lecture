// Shader 클래스 구현
export default class Shader{
    id;
    locations = {};

    constructor(gl, vsource, fsource)
    {
        this.id = webglUtils.createProgramFromSources(gl,[vsource, fsource]);
    }

    //Shader는 useProgram을 호출하지만 통일성을 위해 수정
    Bind(gl)
    {
        gl.useProgram(this.id); 
    }

    Unbind(gl)
    {
        gl.useProgram(null); 
    }

    GetUniformLocation(gl, name)
    {
        let location = 0;
        if(name in this.locations)
        {
            location = this.locations[name];
        }
        else
        {
            location = gl.getUniformLocation(this.id, name); 
            this.locations[name] = location;
        }
        return location;
    }

    //SetUniform 메소드들
    SetUniform1f(gl,name, val) 
    {
        let location = this.GetUniformLocation(gl,name);
        gl.uniform1f(location, val); 
    }
    
    SetUniform3f(gl,name, v0,v1,v2) 
    {
        let location = this.GetUniformLocation(gl,name);
        gl.uniform3f(location, v0, v1, v2); 
    }
    
    SetUniform4f(gl,name, v0,v1,v2,v3)
    {
        let location = this.GetUniformLocation(gl,name);
        gl.uniform4f(location, v0, v1, v2, v3); 
    }
        
    SetUniformMat4f(gl, name, mat) 
    {
        let location = this.GetUniformLocation(gl,name);
        gl.uniformMatrix4fv(location, false, mat);
    }
    
    SetUniform1i(gl, name, val) 
    {
        let location = this.GetUniformLocation(gl,name);
        gl.uniform1i(location, val);
    }
}