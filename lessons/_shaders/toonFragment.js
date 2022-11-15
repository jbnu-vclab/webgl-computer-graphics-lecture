export default  
`#version 300 es
precision highp float;

struct Light
{
    vec3 lightColor;
    float ambientIntensity;
    float diffuseIntensity;
};

struct DirectionalLight
{
    Light base;   
    vec3 direction;
};

struct Material
{
    float specularIntensity;
    float shininess; // == sh
};

layout(location=0) out vec4 outColor;

uniform sampler2D u_toonLut; // LUT == Look Up Table
uniform sampler2D u_mainTexture;
uniform DirectionalLight u_directionalLight; 

in vec2 v_texcoord; 
in vec3 v_normal; 

void main()
{
	vec3 normal = normalize(v_normal);

	vec3 lightDir = normalize(-u_directionalLight.direction);
	float ndotl = dot(normal, lightDir);
	float diffuseFactor = max(ndotl, 0.0);
	
	vec4 lut = texture(u_toonLut, vec2(diffuseFactor, 0));

	//outColor = vec4(0.8, 0.3, 0.2, 1.0) * lut;
	outColor = texture(u_mainTexture, v_texcoord) * lut;
	//outColor = lut;
}
`