export default
`#version 300 es
precision mediump float;

layout(location=0) out vec4 outColor;

uniform vec2 u_resolution;
uniform float time;

//--- Parameters
#define SAMPLES_PER_PIXEL 100
#define MAX_DEPTH 50

#define PI 3.1415926535


//--- Utility
vec2 randState;

float hash( const float n ) 
{
    return fract(sin(n)*43758.54554213);
}

// bad random :(
float random(){
    randState.x = fract(sin(dot(randState.xy + time, vec2(12.9898, 78.233))) * 43758.5453);
    randState.y = fract(sin(dot(randState.xy + time, vec2(12.9898, 78.233))) * 43758.5453);
    
    return randState.x;
}

vec3 random_in_unit_sphere()
{
    float phi = 2.0 * PI * random();
    float cosTheta = 2.0 * random() - 1.0;
    float u = random();

    float theta = acos(cosTheta);
    float r = pow(u, 1.0 / 3.0);

    float x = r * sin(theta) * cos(phi);
    float y = r * sin(theta) * sin(phi);
    float z = r * cos(theta);

    return vec3(x, y, z);
}


//--- Scene
const int SPHERE_COUNT = 2;

struct sphere {
    vec3 center;
    float radius;
};

sphere sceneList[] = sphere[SPHERE_COUNT](
sphere(vec3( 0,0,-1), 0.5),
sphere(vec3( 0,-100.5,-1), 100.0)
);

//--- Ray & Hit Record
struct ray {
    vec3 orig;
    vec3 dir;
};
vec3 ray_at(ray r, float t)
{
    return r.orig + t*r.dir;
}

struct hit_record {
    vec3 p;
    vec3 normal;
    float t;
    bool front_face;
};
void set_face_normal(out hit_record rec, ray r, vec3 outward_normal)
{
    rec.front_face = dot(r.dir, outward_normal) < 0.0;
    rec.normal = rec.front_face ? outward_normal : -outward_normal;
}

//--- Sphere Hit Test
bool hit_sphere(sphere s, ray r, float t_min, float t_max, out hit_record rec) {
    vec3 oc = r.orig - s.center;
    float a = dot(r.dir, r.dir);
    float half_b = dot(oc, r.dir);
    float c = dot(oc, oc) - s.radius*s.radius;
    float discriminant = half_b*half_b - a*c;
    
    if(discriminant < 0.0)
    {
        return false;
    }
    float sqrtd = sqrt(discriminant);
    
    float root = (-half_b - sqrtd) / a;
    if(root < t_min || root > t_max)
    {
        root = (-half_b + sqrtd) / a;
        if(root < t_min || root > t_max)
        {
            return false;
        }
    }

    rec.t = root;
    rec.p = ray_at(r, rec.t);
    vec3 outward_normal = (rec.p - s.center)/s.radius;
    set_face_normal(rec, r, outward_normal);

    return true;
}

//--- Scene Hit Test
bool hit_scene(ray r, float t_min, float t_max, out hit_record rec)
{
    hit_record temp_rec;
    bool hit_anything = false;
    float closest_so_far = t_max;

    for (int i=0;i<SPHERE_COUNT;i++)
    {
        if(hit_sphere(sceneList[i], r, t_min, t_max, temp_rec) && temp_rec.t < closest_so_far)
        {
            hit_anything = true;
            closest_so_far = temp_rec.t;
            rec = temp_rec;
        }
    }

    return hit_anything;
}

//---

vec3 ray_color(ray r)
{
    hit_record rec;

    vec3 color = vec3(1.0);

    for(int i=0;i<MAX_DEPTH;i++)
    {
        bool is_hit = hit_scene(r, 0.001, 10000.0, rec);

        if(is_hit)
        {
            vec3 target = rec.p + rec.normal + random_in_unit_sphere();
            //vec3 target = rec.p + rec.normal + vec3(1,0,0);
            r = ray(rec.p, target-rec.p);
            color = color * 0.5;
        }
        else
        {
            vec3 unit_direction = normalize(r.dir);
            float t = 0.5*(unit_direction.y + 1.0);
            color = color * ((1.0-t)*vec3(1.0, 1.0, 1.0) + t*vec3(0.5, 0.7, 1.0));
            break;
        }
    }

    return color;
}

//--- Camera
struct camera {
    vec3 origin;
    vec3 lower_left_corner;
    vec3 horizontal;
    vec3 vertical;
};

camera make_camera()
{
    float aspect_ratio = u_resolution.x / u_resolution.y;
    float viewport_height = 2.0;
    float viewport_width = aspect_ratio * viewport_height;
    float focal_length = 1.0;

    camera cam;
    cam.origin = vec3(0,0,0);
    cam.horizontal = vec3(viewport_width, 0, 0);
    cam.vertical = vec3(0, viewport_height, 0);
    cam.lower_left_corner = cam.origin - cam.horizontal*0.5 - cam.vertical*0.5 - vec3(0,0,focal_length);
    return cam;
}

ray get_ray(camera cam, float u, float v)
{
    return ray(cam.origin, cam.lower_left_corner + u*cam.horizontal + v*cam.vertical - cam.origin);
}

void main() {
    randState = gl_FragCoord.xy / u_resolution.xy;

    camera cam = make_camera();

    vec3 pixel_color = vec3(0,0,0);
    
    for(int s=0; s < SAMPLES_PER_PIXEL; s++)
    {
        float u = float(gl_FragCoord.x + random()) / float(u_resolution.x);
        float v = float(gl_FragCoord.y + random()) / float(u_resolution.y);

        ray r = get_ray(cam, u, v);
        pixel_color = pixel_color + ray_color(r);
    }
    pixel_color = pixel_color * (1.0/float(SAMPLES_PER_PIXEL));

    outColor = vec4(sqrt(pixel_color),1.0);
    //outColor = vec4(random(),random(),random(),1.0);
}
`;