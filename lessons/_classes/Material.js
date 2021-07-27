export default class Material{
    specularIntensity;
    shininess;
  
    constructor(sIntensity, shininess)
    {
        this.specularIntensity = sIntensity;
        this.shininess = shininess;
    }
    
    UseMaterial(gl, shader)
    {
        shader.SetUniform1f(gl,"u_material.specularIntensity", this.specularIntensity);
        shader.SetUniform1f(gl,"u_material.shininess", this.shininess);
    }
  
}