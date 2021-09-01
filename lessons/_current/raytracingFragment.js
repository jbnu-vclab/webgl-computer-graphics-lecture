export default
`#version 300 es
precision mediump float;

layout(location=0) out vec4 outColor;

uniform vec2 u_resolution;
uniform float time;

//--- Parameters
#define SAMPLES_PER_PIXEL 4
#define MAX_DEPTH 5

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

vec3 random_in_unit_disk()
{
    vec3 r = random_in_unit_sphere();
    return vec3(r.x, r.y, 0.0);
}

vec3 random_unit_vector()
{
    return normalize(random_in_unit_sphere());
}

bool near_zero(vec3 v)
{
    return ((v.x < 1e-8) && (v.y < 1e-8) && (v.z < 1e-8));
}

//-------------------------------------------------------------------------
//---------------Structures------------------------------------------------
//-------------------------------------------------------------------------

struct sphere {
    vec3 center; float radius;
    int material_type; vec3 albedo; float fuzz; float ior; // material
};

struct ray {
    vec3 orig; vec3 dir;
};

struct hit_record {
    vec3 p; vec3 normal; float t; bool front_face;
    int material_type; vec3 albedo; float fuzz; float ior; // material
};

struct camera {
    vec3 origin; vec3 lower_left_corner; vec3 horizontal; vec3 vertical; float lens_radius;
};

//------------------------------------------------------------------------


//--- Material related
#define LAMBERT 1
#define METAL 2
#define DIELECTRIC 3

vec3 reflect(vec3 v, vec3 n) {
    return v - 2.0*dot(v,n)*n;
}

vec3 refract(vec3 uv, vec3 n, float etai_over_etat) {
    float cos_theta = min(dot(-uv, n), 1.0);
    vec3 r_out_perp =  etai_over_etat * (uv + cos_theta*n);
    vec3 r_out_parallel = -sqrt(abs(1.0 - dot(r_out_perp,r_out_perp))) * n;
    return r_out_perp + r_out_parallel;
}

float schlick(float cosine, float ref_idx)
{
    float r0 = (1.0-ref_idx) / (1.0 + ref_idx);
    r0 = r0 * r0;
    return r0 + (1.0-r0)*pow((1.0-cosine), 5.0);
}

bool scatter(ray r_in, hit_record rec, out vec3 atten, out ray scattered)
{
    if(rec.material_type == METAL)
    {
        vec3 reflected = reflect(normalize(r_in.dir), rec.normal);
        scattered = ray(rec.p, reflected + rec.fuzz * random_in_unit_sphere());
        atten = rec.albedo;
        return (dot(scattered.dir, rec.normal) > 0.0);
    }
    else if (rec.material_type == DIELECTRIC)
    {
        atten = vec3(1.0,1.0,1.0);
        
        float refraction_ratio = rec.front_face ? (1.0/rec.ior) : rec.ior;

        vec3 unit_dir = normalize(r_in.dir);
        float cos_theta = min(dot(-unit_dir, rec.normal), 1.0);
        float sin_theta = sqrt(1.0 - cos_theta*cos_theta);

        bool cannot_refract = refraction_ratio * sin_theta > 1.0; // Total internal reflection case
        vec3 direction;

        if(cannot_refract || schlick(cos_theta, refraction_ratio) > random())
            direction = reflect(unit_dir, rec.normal);
        else
            direction = refract(unit_dir, rec.normal, refraction_ratio);

        scattered = ray(rec.p, direction);
        return true;
    }
    else // Lambertian fallback
    {
        vec3 target = rec.p + rec.normal + random_in_unit_sphere();
        vec3 scatter_direction = target-rec.p;
        //vec3 scatter_direction = rec.normal + random_unit_vector(); // doesn't work well...

        if(near_zero(scatter_direction))
            scatter_direction = rec.normal;

        scattered = ray(rec.p, scatter_direction);
        atten = rec.albedo;

        return true;
    }

    return true;
}


//--- Scene(sphere) related
const int SPHERE_COUNT = 84;

// form https://www.shadertoy.com/view/lssBD7
sphere sceneList[] = sphere[SPHERE_COUNT](
    sphere(vec3( 0.000000, -1000.000000, 0.000000), 1000.000000, 1, vec3( 0.500000, 0.500000, 0.500000), 1.000000, 1.000000),
    sphere(vec3( -7.995381, 0.200000, -7.478668), 0.200000, 1, vec3( 0.380012, 0.506085, 0.762437), 1.000000, 1.000000),
    sphere(vec3( -7.696819, 0.200000, -5.468978), 0.200000, 1, vec3( 0.596282, 0.140784, 0.017972), 1.000000, 1.000000),
    sphere(vec3( -7.824804, 0.200000, -3.120637), 0.200000, 1, vec3( 0.288507, 0.465652, 0.665070), 1.000000, 1.000000),
    sphere(vec3( -7.132909, 0.200000, -1.701323), 0.200000, 1, vec3( 0.101047, 0.293493, 0.813446), 1.000000, 1.000000),
    sphere(vec3( -7.569523, 0.200000, 0.494554), 0.200000, 1, vec3( 0.365924, 0.221622, 0.058332), 1.000000, 1.000000),
    sphere(vec3( -7.730332, 0.200000, 2.358976), 0.200000, 1, vec3( 0.051231, 0.430547, 0.454086), 1.000000, 1.000000),
    sphere(vec3( -7.892865, 0.200000, 4.753728), 0.200000, 2, vec3( 0.826684, 0.820511, 0.908836), 0.389611, 1.000000),
    sphere(vec3( -7.656691, 0.200000, 6.888913), 0.200000, 1, vec3( 0.346542, 0.225385, 0.180132), 1.000000, 1.000000),
    sphere(vec3( -7.217835, 0.200000, 8.203466), 0.200000, 2, vec3( 0.600463, 0.582386, 0.608277), 0.427369, 1.000000),
    sphere(vec3( -5.115232, 0.200000, -7.980404), 0.200000, 1, vec3( 0.256969, 0.138639, 0.080293), 1.000000, 1.000000),
    sphere(vec3( -5.323222, 0.200000, -5.113037), 0.200000, 1, vec3( 0.193093, 0.510542, 0.613362), 1.000000, 1.000000),
    sphere(vec3( -5.410681, 0.200000, -3.527741), 0.200000, 1, vec3( 0.352200, 0.191551, 0.115972), 1.000000, 1.000000),
    sphere(vec3( -5.460670, 0.200000, -1.166543), 0.200000, 1, vec3( 0.029486, 0.249874, 0.077989), 1.000000, 1.000000),
    sphere(vec3( -5.457659, 0.200000, 0.363870), 0.200000, 1, vec3( 0.395713, 0.762043, 0.108515), 1.000000, 1.000000),
    sphere(vec3( -5.798715, 0.200000, 2.161684), 0.200000, 3, vec3( 0.000000, 0.000000, 0.000000), 1.000000, 1.500000),
    sphere(vec3( -5.116586, 0.200000, 4.470188), 0.200000, 1, vec3( 0.059444, 0.404603, 0.171767), 1.000000, 1.000000),
    sphere(vec3( -5.273591, 0.200000, 6.795187), 0.200000, 1, vec3( 0.499454, 0.131330, 0.158348), 1.000000, 1.000000),
    sphere(vec3( -5.120286, 0.200000, 8.731398), 0.200000, 1, vec3( 0.267365, 0.136024, 0.300483), 1.000000, 1.000000),
    sphere(vec3( -3.601565, 0.200000, -7.895600), 0.200000, 1, vec3( 0.027752, 0.155209, 0.330428), 1.000000, 1.000000),
    sphere(vec3( -3.735860, 0.200000, -5.163056), 0.200000, 2, vec3( 0.576768, 0.884712, 0.993335), 0.359385, 1.000000),
    sphere(vec3( -3.481116, 0.200000, -3.794556), 0.200000, 1, vec3( 0.405104, 0.066436, 0.009339), 1.000000, 1.000000),
    sphere(vec3( -3.866858, 0.200000, -1.465965), 0.200000, 1, vec3( 0.027570, 0.021652, 0.252798), 1.000000, 1.000000),
    sphere(vec3( -3.168870, 0.200000, 0.553099), 0.200000, 1, vec3( 0.421992, 0.107577, 0.177504), 1.000000, 1.000000),
    sphere(vec3( -3.428552, 0.200000, 2.627547), 0.200000, 2, vec3( 0.974029, 0.653443, 0.571877), 0.312780, 1.000000),
    sphere(vec3( -3.771736, 0.200000, 4.324785), 0.200000, 1, vec3( 0.685957, 0.000043, 0.181270), 1.000000, 1.000000),
    sphere(vec3( -3.768522, 0.200000, 6.384588), 0.200000, 1, vec3( 0.025972, 0.082246, 0.138765), 1.000000, 1.000000),
    sphere(vec3( -3.286992, 0.200000, 8.441148), 0.200000, 1, vec3( 0.186577, 0.560376, 0.367045), 1.000000, 1.000000),
    sphere(vec3( -1.552127, 0.200000, -7.728200), 0.200000, 1, vec3( 0.202998, 0.002459, 0.015350), 1.000000, 1.000000),
    sphere(vec3( -1.360796, 0.200000, -5.346098), 0.200000, 1, vec3( 0.690820, 0.028470, 0.179907), 1.000000, 1.000000),
    sphere(vec3( -1.287209, 0.200000, -3.735321), 0.200000, 1, vec3( 0.345974, 0.672353, 0.450180), 1.000000, 1.000000),
    sphere(vec3( -1.344859, 0.200000, -1.726654), 0.200000, 1, vec3( 0.209209, 0.431116, 0.164732), 1.000000, 1.000000),
    sphere(vec3( -1.974774, 0.200000, 0.183260), 0.200000, 1, vec3( 0.006736, 0.675637, 0.622067), 1.000000, 1.000000),
    sphere(vec3( -1.542872, 0.200000, 2.067868), 0.200000, 1, vec3( 0.192247, 0.016661, 0.010109), 1.000000, 1.000000),
    sphere(vec3( -1.743856, 0.200000, 4.752810), 0.200000, 1, vec3( 0.295270, 0.108339, 0.276513), 1.000000, 1.000000),
    sphere(vec3( -1.955621, 0.200000, 6.493702), 0.200000, 1, vec3( 0.270527, 0.270494, 0.202029), 1.000000, 1.000000),
    sphere(vec3( -1.350449, 0.200000, 8.068503), 0.200000, 2, vec3( 0.646942, 0.501660, 0.573693), 0.346551, 1.000000),
    sphere(vec3( 0.706123, 0.200000, -7.116040), 0.200000, 1, vec3( 0.027695, 0.029917, 0.235781), 1.000000, 1.000000),
    sphere(vec3( 0.897766, 0.200000, -5.938681), 0.200000, 1, vec3( 0.114934, 0.046258, 0.039647), 1.000000, 1.000000),
    sphere(vec3( 0.744113, 0.200000, -3.402960), 0.200000, 1, vec3( 0.513631, 0.335578, 0.204787), 1.000000, 1.000000),
    sphere(vec3( 0.867750, 0.200000, -1.311908), 0.200000, 1, vec3( 0.400246, 0.000956, 0.040513), 1.000000, 1.000000),
    sphere(vec3( 0.082480, 0.200000, 0.838206), 0.200000, 1, vec3( 0.594141, 0.215068, 0.025718), 1.000000, 1.000000),
    sphere(vec3( 0.649692, 0.200000, 2.525103), 0.200000, 2, vec3( 0.602157, 0.797249, 0.614694), 0.341860, 1.000000),
    sphere(vec3( 0.378574, 0.200000, 4.055579), 0.200000, 1, vec3( 0.005086, 0.003349, 0.064403), 1.000000, 1.000000),
    sphere(vec3( 0.425844, 0.200000, 6.098526), 0.200000, 1, vec3( 0.266812, 0.016602, 0.000853), 1.000000, 1.000000),
    sphere(vec3( 0.261365, 0.200000, 8.661150), 0.200000, 1, vec3( 0.150201, 0.007353, 0.152506), 1.000000, 1.000000),
    sphere(vec3( 2.814218, 0.200000, -7.751227), 0.200000, 2, vec3( 0.570094, 0.610319, 0.584192), 0.018611, 1.000000),
    sphere(vec3( 2.050073, 0.200000, -5.731364), 0.200000, 1, vec3( 0.109886, 0.029498, 0.303265), 1.000000, 1.000000),
    sphere(vec3( 2.020130, 0.200000, -3.472627), 0.200000, 1, vec3( 0.216908, 0.216448, 0.221775), 1.000000, 1.000000),
    sphere(vec3( 2.884277, 0.200000, -1.232662), 0.200000, 1, vec3( 0.483428, 0.027275, 0.113898), 1.000000, 1.000000),
    sphere(vec3( 2.644454, 0.200000, 0.596324), 0.200000, 1, vec3( 0.005872, 0.860718, 0.561933), 1.000000, 1.000000),
    sphere(vec3( 2.194283, 0.200000, 2.880603), 0.200000, 1, vec3( 0.452710, 0.824152, 0.045179), 1.000000, 1.000000),
    sphere(vec3( 2.281000, 0.200000, 4.094307), 0.200000, 1, vec3( 0.002091, 0.145849, 0.032535), 1.000000, 1.000000),
    sphere(vec3( 2.080841, 0.200000, 6.716384), 0.200000, 1, vec3( 0.468539, 0.032772, 0.018071), 1.000000, 1.000000),
    sphere(vec3( 2.287131, 0.200000, 8.583242), 0.200000, 3, vec3( 0.000000, 0.000000, 0.000000), 1.000000, 1.500000),
    sphere(vec3( 4.329136, 0.200000, -7.497218), 0.200000, 1, vec3( 0.030865, 0.071452, 0.016051), 1.000000, 1.000000),
    sphere(vec3( 4.502115, 0.200000, -5.941060), 0.200000, 3, vec3( 0.000000, 0.000000, 0.000000), 1.000000, 1.500000),
    sphere(vec3( 4.750631, 0.200000, -3.836759), 0.200000, 1, vec3( 0.702578, 0.084798, 0.141374), 1.000000, 1.000000),
    sphere(vec3( 4.082084, 0.200000, -1.180746), 0.200000, 1, vec3( 0.043052, 0.793077, 0.018707), 1.000000, 1.000000),
    sphere(vec3( 4.429173, 0.200000, 2.069721), 0.200000, 1, vec3( 0.179009, 0.147750, 0.617371), 1.000000, 1.000000),
    sphere(vec3( 4.277152, 0.200000, 4.297482), 0.200000, 1, vec3( 0.422693, 0.011222, 0.211945), 1.000000, 1.000000),
    sphere(vec3( 4.012743, 0.200000, 6.225072), 0.200000, 1, vec3( 0.986275, 0.073358, 0.133628), 1.000000, 1.000000),
    sphere(vec3( 4.047066, 0.200000, 8.419360), 0.200000, 2, vec3( 0.878749, 0.677170, 0.684995), 0.243932, 1.000000),
    sphere(vec3( 6.441846, 0.200000, -7.700798), 0.200000, 1, vec3( 0.309255, 0.342524, 0.489512), 1.000000, 1.000000),
    sphere(vec3( 6.047810, 0.200000, -5.519369), 0.200000, 1, vec3( 0.532361, 0.008200, 0.077522), 1.000000, 1.000000),
    sphere(vec3( 6.779211, 0.200000, -3.740542), 0.200000, 1, vec3( 0.161234, 0.539314, 0.016667), 1.000000, 1.000000),
    sphere(vec3( 6.430776, 0.200000, -1.332107), 0.200000, 1, vec3( 0.641951, 0.661402, 0.326114), 1.000000, 1.000000),
    sphere(vec3( 6.476387, 0.200000, 0.329973), 0.200000, 1, vec3( 0.033000, 0.648388, 0.166911), 1.000000, 1.000000),
    sphere(vec3( 6.568686, 0.200000, 2.116949), 0.200000, 1, vec3( 0.590952, 0.072292, 0.125672), 1.000000, 1.000000),
    sphere(vec3( 6.371189, 0.200000, 4.609841), 0.200000, 2, vec3( 0.870345, 0.753830, 0.933118), 0.233489, 1.000000),
    sphere(vec3( 6.011877, 0.200000, 6.569579), 0.200000, 1, vec3( 0.044868, 0.651697, 0.086779), 1.000000, 1.000000),
    sphere(vec3( 6.096087, 0.200000, 8.892333), 0.200000, 1, vec3( 0.588587, 0.078723, 0.044928), 1.000000, 1.000000),
    sphere(vec3( 8.185763, 0.200000, -7.191109), 0.200000, 2, vec3( 0.989702, 0.886784, 0.540759), 0.104229, 1.000000),
    sphere(vec3( 8.411960, 0.200000, -5.285309), 0.200000, 1, vec3( 0.139604, 0.022029, 0.461688), 1.000000, 1.000000),
    sphere(vec3( 8.047109, 0.200000, -3.427552), 0.200000, 2, vec3( 0.815002, 0.631228, 0.806757), 0.150782, 1.000000),
    sphere(vec3( 8.119639, 0.200000, -1.652587), 0.200000, 1, vec3( 0.177852, 0.429797, 0.042251), 1.000000, 1.000000),
    sphere(vec3( 8.818120, 0.200000, 0.401292), 0.200000, 1, vec3( 0.065416, 0.087694, 0.040518), 1.000000, 1.000000),
    sphere(vec3( 8.754155, 0.200000, 2.152549), 0.200000, 1, vec3( 0.230659, 0.035665, 0.435895), 1.000000, 1.000000),
    sphere(vec3( 8.595298, 0.200000, 4.802001), 0.200000, 1, vec3( 0.188493, 0.184933, 0.040215), 1.000000, 1.000000),
    sphere(vec3( 8.036216, 0.200000, 6.739752), 0.200000, 1, vec3( 0.023192, 0.364636, 0.464844), 1.000000, 1.000000),
    sphere(vec3( 8.256561, 0.200000, 8.129115), 0.200000, 1, vec3( 0.002612, 0.598319, 0.435378), 1.000000, 1.000000),
    sphere(vec3( 0.000000, 1.000000, 0.000000), 1.000000, 3, vec3( 0.000000, 0.000000, 0.000000), 1.000000, 1.500000),
    sphere(vec3( -4.000000, 1.000000, 0.000000), 1.000000, 1, vec3( 0.400000, 0.200000, 0.100000), 1.000000, 1.000000),
    sphere(vec3( 4.000000, 1.000000, 0.000000), 1.000000, 2, vec3( 0.700000, 0.600000, 0.500000), 0.000000, 1.000000)
);



//--- Ray & Hit Record related

vec3 ray_at(ray r, float t)
{
    return r.orig + t*r.dir;
}

void set_face_normal(out hit_record rec, ray r, vec3 outward_normal)
{
    rec.front_face = dot(r.dir, outward_normal) < 0.0;
    rec.normal = rec.front_face ? outward_normal : -outward_normal;
}

//--- Ray trace related
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
    rec.material_type = s.material_type;
    rec.albedo = s.albedo;
    rec.fuzz = s.fuzz;
    rec.ior = s.ior; // 잊어버리지 말것!!

    return true;
}

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

vec3 ray_color(ray r)
{
    hit_record rec;

    vec3 color = vec3(1.0);

    for(int i=0;i<MAX_DEPTH;i++)
    {
        bool is_hit = hit_scene(r, 0.001, 10000.0, rec);

        if(is_hit)
        {
            vec3 atten_color;
            ray scattered_ray;
            if(scatter(r, rec, atten_color, scattered_ray))
            {
                color = color * atten_color;
                r = scattered_ray;
            }
            else
            {
                return vec3(0,0,0);
            }
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

//--- Camera related

uniform float u_fov;
uniform vec3 u_lookfrom;
uniform vec3 u_lookat;
uniform vec3 u_vup;
uniform float u_aperture;
uniform float u_focus_dist;

camera make_camera()
{
    float aspect_ratio = u_resolution.x / u_resolution.y;
    float theta = u_fov * PI / 180.0;
    float h = tan(theta / 2.0);

    float viewport_height = 2.0 * h;
    float viewport_width = aspect_ratio * viewport_height;
    
    vec3 w = normalize(u_lookfrom - u_lookat);
    vec3 u = normalize(cross(u_vup,w));
    vec3 v = cross(w,u);

    camera cam;
    cam.origin = u_lookfrom;
    cam.horizontal = u_focus_dist * viewport_width * u;
    cam.vertical = u_focus_dist * viewport_height * v;
    cam.lower_left_corner = cam.origin - cam.horizontal*0.5 - cam.vertical*0.5 - u_focus_dist * w;
    cam.lens_radius = u_aperture / 2.0;
    return cam;
}

ray get_ray(camera cam, float u, float v)
{
    vec3 rd = cam.lens_radius * random_in_unit_disk();
    vec3 offset = vec3(u * rd.x , v * rd.y, 0.0);

    return ray(cam.origin + offset, cam.lower_left_corner + u*cam.horizontal + v*cam.vertical - cam.origin - offset);
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