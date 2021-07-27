export class Light {
  lightColor;
  ambientIntensity;
  diffuseIntensity;

  constructor(lightColor, aIntensity, dIntensity)
  {
    this.lightColor = lightColor;
    this.ambientIntensity = aIntensity;
    this.diffuseIntensity = dIntensity;
  }
}

export class DirectionalLight extends Light {
  direction;

  constructor(lightColor, aIntensity, dir, dIntensity)
  {
    super(lightColor, aIntensity, dIntensity);
    this.direction = dir;
  }

  UseLight(gl,shader)
  {
    shader.SetUniform3f(gl,"u_directionalLight.base.lightColor", this.lightColor[0], this.lightColor[1], this.lightColor[2]);
    shader.SetUniform1f(gl,"u_directionalLight.base.ambientIntensity", this.ambientIntensity);
    shader.SetUniform1f(gl,"u_directionalLight.base.diffuseIntensity", this.diffuseIntensity);

    shader.SetUniform3f(gl,"u_directionalLight.direction", this.direction[0], this.direction[1], this.direction[2]);
  }
}