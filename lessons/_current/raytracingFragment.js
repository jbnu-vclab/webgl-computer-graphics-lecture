export default
`#version 300 es
precision highp float;

layout(location=0) out vec4 outColor;

uniform vec2 u_resolution;

//---
struct ray {
    vec3 orig;
    vec3 dir;
};

bool hit_sphere(const vec3 center, float radius, const ray r) {
    vec3 oc = r.orig - center;
    float a = dot(r.dir, r.dir);
    float b = 2.0 * dot(oc, r.dir);
    float c = dot(oc, oc) - radius*radius;
    float discriminant = b*b - 4.0*a*c;
    return (discriminant > 0.0);
}

vec3 ray_color(const ray r)
{
    if(hit_sphere(vec3(0,0,-1), 0.5, r))
        return vec3(1,0,0);

    vec3 unit_direction = normalize(r.dir);
    float t = 0.5*(unit_direction.y + 1.0);
    return (1.0-t)*vec3(1.0, 1.0, 1.0) + t*vec3(0.5, 0.7, 1.0);
}

void main() {
    float aspect_ratio = u_resolution.x / u_resolution.y;
    float viewport_height = 2.0;
    float viewport_width = aspect_ratio * viewport_height;
    float focal_length = 1.0;

    vec3 origin = vec3(0,0,0);
    vec3 horizontal = vec3(viewport_width, 0, 0);
    vec3 vertical = vec3(0, viewport_height, 0);
    vec3 lower_left_corner = origin - horizontal*0.5 - vertical*0.5 - vec3(0,0,focal_length);

    float u = gl_FragCoord.x / u_resolution.x;
    float v = gl_FragCoord.y / u_resolution.y;

    ray r;
    r.orig = origin;
    r.dir = lower_left_corner + u*horizontal + v*vertical - origin;

    outColor = vec4(ray_color(r),1.0);
}
`;