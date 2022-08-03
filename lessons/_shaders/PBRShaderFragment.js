export default  
`#version 300 es

precision highp float;

layout(location=0) out vec4 outColor;

in vec2 v_texCoords;
in vec3 v_worldPosition;
in vec3 v_normal;

// material parameters
uniform vec3  u_albedo;
uniform float u_metallic;
uniform float u_roughness;
uniform float u_ao;

// lights
uniform vec3 u_lightPositions[4];
uniform vec3 u_lightColors[4];

uniform vec3 u_eyePosition;

const float PI = 3.14159265359;
  
float DistributionGGX (vec3 N, vec3 H, float roughness){
    float a2    = roughness * roughness * roughness * roughness;
    float NdotH = max (dot (N, H), 0.0);
    float denom = (NdotH * NdotH * (a2 - 1.0) + 1.0);
    return a2 / (PI * denom * denom);
}

float GeometrySchlickGGX (float NdotV, float roughness){
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

float GeometrySmith (vec3 N, vec3 V, vec3 L, float roughness){
    return GeometrySchlickGGX (max (dot (N, L), 0.0), roughness) * 
            GeometrySchlickGGX (max (dot (N, V), 0.0), roughness);
}

vec3 FresnelSchlick (float cosTheta, vec3 F0){
    return F0 + (1.0 - F0) * pow (1.0 - cosTheta, 5.0);
}

void main()
{		
    vec3 N = normalize(v_normal);
    vec3 V = normalize(u_eyePosition - v_worldPosition);

    vec3 F0 = vec3(0.04); 
    F0 = mix(F0, u_albedo, u_metallic);
	           
    // reflectance equation
    vec3 Lo = vec3(0.0);
    for(int i = 0; i < 4; ++i) 
    {
        // calculate per-light radiance
        vec3 L = normalize(u_lightPositions[i] - v_worldPosition);
        vec3 H = normalize(V + L);
        float distance    = length(u_lightPositions[i] - v_worldPosition);
        float attenuation = 1.0 / (distance * distance);
        vec3 radiance     = u_lightColors[i] * attenuation;        
        
        // cook-torrance brdf
        float NDF = DistributionGGX(N, H, u_roughness);        
        float G   = GeometrySmith(N, V, L, u_roughness);      
        vec3 F    = FresnelSchlick(max(dot(H, V), 0.0), F0);       
        
        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - u_metallic;	  
        
        vec3 numerator    = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
        vec3 specular     = numerator / denominator;  
            
        // add to outgoing radiance Lo
        float NdotL = max(dot(N, L), 0.0);                
        Lo += (kD * u_albedo / PI + specular) * radiance * NdotL; 
    }   
  
    vec3 ambient = vec3(0.03) * u_albedo * u_ao;
    vec3 color = ambient + Lo;
	
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/2.2));  
   
    outColor = vec4(color, 1.0);
}`