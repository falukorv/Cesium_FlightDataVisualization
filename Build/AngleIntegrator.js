/*global Cesium*/

function forwardEuler(w1,w2,w3,orientation,T){
    // Quaternion components
    var x = orientation.x; 
    var y = orientation.y;
    var z = orientation.z;
    var w = orientation.w;

    w = w + 0.5*(-w1*x-w2*y-w3*z)*T;
    x = x + 0.5*(w1*w+w3*y-w2*z)*T;
    y = y + 0.5*(w2*w-w3*x+w1*z)*T;
    z = z + 0.5*(w3*w+w2*x-w1*y)*T;
    
    var orientation_new = new Cesium.Quaternion(x,y,z,w);
    
    return orientation_new;
}

function RK4(omega1,omega2,omega3,orientation,T){
    var x = orientation.x; 
    var y = orientation.y;
    var z = orientation.z;
    var w = orientation.w;

    var w1 = 0.5*(-omega1*x-omega2*y-omega3*z);
    var x1 = 0.5*(omega1*w+omega3*y-omega2*z);
    var y1 = 0.5*(omega2*w-omega3*x+omega1*z);
    var z1 = 0.5*(omega3*w+omega2*x-omega1*y);
    
    var w2 = 0.5*(-omega1*(x+(T/2)*x1)-omega2*(y+(T/2)*y1)-omega3*(z+(T/2)*z1));
    var x2 = 0.5*(omega1*(w+(T/2)*w1)+omega3*(y+(T/2)*y1)-omega2*(z+(T/2)*z1));
    var y2 = 0.5*(omega2*(w+(T/2)*w1)-omega3*(x+(T/2)*x1)+omega1*(z+(T/2)*z1));
    var z2 = 0.5*(omega3*(w+(T/2)*w1)+omega2*(x+(T/2)*x1)-omega1*(y+(T/2)*y1));
    
    var w3 = 0.5*(-omega1*(x+(T/2)*x2)-omega2*(y+(T/2)*y2)-omega3*(z+(T/2)*z2));
    var x3 = 0.5*(omega1*(w+(T/2)*w2)+omega3*(y+(T/2)*y2)-omega2*(z+(T/2)*z2));
    var y3 = 0.5*(omega2*(w+(T/2)*w2)-omega3*(x+(T/2)*x2)+omega1*(z+(T/2)*z2));
    var z3 = 0.5*(omega3*(w+(T/2)*w2)+omega2*(x+(T/2)*x2)-omega1*(y+(T/2)*y2));
    
    var w4 = 0.5*(-omega1*(x+T*x3)-omega2*(y+T*y3)-omega3*(z+T*z3));
    var x4 = 0.5*(omega1*(w+T*w3)+omega3*(y+T*y3)-omega2*(z+T*z3));
    var y4 = 0.5*(omega2*(w+T*w3)-omega3*(x+T*x3)+omega1*(z+T*z3));
    var z4 = 0.5*(omega3*(w+T*w3)+omega2*(x+T*x3)-omega1*(y+T*y3));
    
    var w = w + (T/6)*(w1+2*w2+2*w3+w4);
    var x = x + (T/6)*(x1+2*x2+2*x3+x4);
    var y = y + (T/6)*(y1+2*y2+2*y3+y4);
    var z = z + (T/6)*(z1+2*z2+2*z3+z4);
    
    orientation = new Cesium.Quaternion(x,y,z,w);
    
    var orientation_new = new Cesium.Quaternion();
    
    Cesium.Quaternion.normalize(orientation,orientation_new);
    
    return orientation_new;
}