import VertexBuffer from '../_classes/VertexBuffer.js';
import IndexBuffer from '../_classes/IndexBuffer.js';
import VertexArray  from '../_classes/VertexArray.js';
import Renderer from '../_classes/Renderer.js';

//Model class
export default class Model {
    //각 모델은 고유의 VAO, VBO, IBO를 갖습니다.
    VAO;
    VBO;
    IBO;

    //경로의 모델을 읽어오고, VAO, IBO에 저장
    async LoadModel(gl, path)
    {
        var response = await fetch(path); 
        var text = await response.text();
        this.mesh = new OBJ.Mesh(text); //라이브러리의 Mesh 메소드로 obj를 파싱합니다.
        
        var meshVertexData = []
        
        var vertexCount = this.mesh.vertices.length/3;
        for(var i=0; i<vertexCount; i++)
        {
            //각 vertex마다 x,y,z,u,v,nx,ny,nz로 데이터가 나열되어 있는 하나의 큰 배열을 생성합니다.
            meshVertexData.push(this.mesh.vertices[3*i], this.mesh.vertices[3*i+1], this.mesh.vertices[3*i+2]);
            meshVertexData.push(this.mesh.textures[2*i], this.mesh.textures[2*i+1]);
            meshVertexData.push(this.mesh.vertexNormals[3*i], this.mesh.vertexNormals[3*i+1], this.mesh.vertexNormals[3*i+2]);
        }
        
        //--모델 정의
        this.VAO = new VertexArray(gl); 
        this.VBO = new VertexBuffer(gl,meshVertexData);
        //이제 addbuffer에서 position(3개 값), texcoord(2개 값), normal(3개 값)으로 끊어서 읽도록 알려줍니다.
        this.VAO.AddBuffer(gl, this.VBO, [3, 2, 3], [false, false, false]); 
        this.IBO = new IndexBuffer(gl, this.mesh.indices, this.mesh.indices.length);

        this.VAO.Unbind(gl);
        this.VBO.Unbind(gl);
        this.IBO.Unbind(gl);

    }
    
    //저장된 VAO, IBO를 활용해 화면에 그리기
    RenderModel(gl,shader)
    {
        //비동기 호출로 인해 모델이 아직 로드가 완료되지 않은 상태에서는 Draw 호출하지 않도록 함
        if(this.VAO)
        {
            let renderer = new Renderer();
            renderer.Draw(gl, this.VAO, this.IBO, shader);
        }
    }
  }