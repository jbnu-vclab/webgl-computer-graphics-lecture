// Renderer 클래스 구현
export default class Renderer{
    Clear(gl)
    {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    Draw(gl, va, ib, shader)
    {
        //무언가를 그릴때, 3가지가 기본적으로 필요함. vao, ibo, shader program
        shader.Bind(gl);
        va.Bind(gl);
                
        var primitiveType = gl.TRIANGLES;
        var indexcount = ib.getCount();
        var indexoffset = 0
        gl.drawElements(primitiveType, indexcount, gl.UNSIGNED_SHORT, 0);
    }
}